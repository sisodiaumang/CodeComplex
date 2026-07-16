import Report from "../models/report.model.js";
import Question from "../models/question.model.js";
import FrontendQuestion from "../models/frontendQuestion.model.js";
import BackendQuestion from "../models/backendQuestion.model.js";
import PromptWarScenario from "../models/promptWarScenerio.model.js";
import TokenUsage from "../models/tokenUsage.model.js";

import { callLLM } from "./aiGateway.service.js";

async function callGrokJson(prompt: string, systemInstruction: string): Promise<any> {
    const result = await callLLM(
        "llama-3.3-70b-versatile",
        {
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        },
        "FRONTEND"
    );

    return JSON.parse(result.text);
}

export interface ModerationAuditLog {
    reportId: string;
    targetType: "USER" | "QUESTION";
    questionTitle: string;
    reason: string;
    details: string;
    isLegit: boolean;
    confidence: number;
    analysis: string;
    fixedFields: string[];
    status: "RESOLVED" | "DISMISSED" | "FAILED";
    error?: string;
}

/**
 * Runs the AI Moderator Agent over all PENDING question reports.
 */
export async function runAIModeratorAgent(): Promise<ModerationAuditLog[]> {
    const pendingReports = await Report.find({ targetType: "QUESTION", status: "PENDING" })
        .populate("reporter", "username");

    const auditLogs: ModerationAuditLog[] = [];

    for (const report of pendingReports) {
        const audit: ModerationAuditLog = {
            reportId: report._id.toString(),
            targetType: "QUESTION",
            questionTitle: "Unknown Question",
            reason: report.reason,
            details: report.details,
            isLegit: false,
            confidence: 0,
            analysis: "No analysis generated",
            fixedFields: [],
            status: "DISMISSED"
        };

        try {
            if (!report.reportedQuestion) {
                throw new Error("Reported question reference is missing in the database");
            }

            const qId = report.reportedQuestion;
            // 1. Fetch the actual question from collections
            let questionDoc: any = null;
            let questionModel: any = null;

            // Search in default Question
            questionDoc = await Question.findById(qId);
            if (questionDoc) {
                questionModel = Question;
            } else {
                questionDoc = await FrontendQuestion.findById(qId);
                if (questionDoc) {
                    questionModel = FrontendQuestion;
                } else {
                    questionDoc = await BackendQuestion.findById(qId);
                    if (questionDoc) {
                        questionModel = BackendQuestion;
                    } else {
                        questionDoc = await PromptWarScenario.findById(qId);
                        if (questionDoc) {
                            questionModel = PromptWarScenario;
                        }
                    }
                }
            }

            if (!questionDoc) {
                throw new Error(`Question with ID ${qId} not found in any collection`);
            }

            audit.questionTitle = questionDoc.title || questionDoc.scenarioName || "Untitled";

            // 2. Perform legitimacy check with LLM
            const hasStatementString = typeof questionDoc.statement === "string";
            const hasScenarioString = typeof questionDoc.scenario === "string";
            
            let markdown = "";
            let inputFormat = "";
            let outputFormat = "";
            let notes = "";
            
            if (hasStatementString) {
                markdown = questionDoc.statement;
            } else if (hasScenarioString) {
                markdown = questionDoc.scenario;
            } else if (questionDoc.statement) {
                markdown = questionDoc.statement.markdown || "";
                inputFormat = questionDoc.statement.inputFormat || "";
                outputFormat = questionDoc.statement.outputFormat || "";
                notes = questionDoc.statement.notes || "";
            }

            const constraints = questionDoc.constraints || (questionDoc.statement && questionDoc.statement.constraints) || [];

            const qDetails = {
                title: audit.questionTitle,
                markdown,
                inputFormat,
                outputFormat,
                notes,
                examples: questionDoc.statement ? (questionDoc.statement.examples || []) : [],
                constraints,
                starterCode: questionDoc.templates || questionDoc.starterCode || {}
            };

            const checkPrompt = `
Question Details:
${JSON.stringify(qDetails, null, 2)}

User Report:
Reason: ${report.reason}
Description of issue: ${report.details}
`;

            const checkSystem = `You are a Senior Algorithm Engineer and Platform Moderator.
Review the coding challenge details and the user report claiming there is an issue with the description, starter code, or test cases.
Determine if the report is valid (legit). Output a JSON object containing:
- "isLegit": boolean
- "confidence": number (0.0 to 1.0)
- "analysis": string (explanation of your findings)
- "targetField": string (one of "markdown", "inputFormat", "outputFormat", "notes", "starterCode", "other")
`;

            const checkResult = await callGrokJson(checkPrompt, checkSystem);
            audit.isLegit = checkResult.isLegit;
            audit.confidence = checkResult.confidence;
            audit.analysis = checkResult.analysis;

            if (checkResult.isLegit && checkResult.confidence >= 0.6) {
                const snapshotBefore = {
                    title: questionDoc.title || questionDoc.scenarioName || "Untitled",
                    statement: JSON.parse(JSON.stringify(questionDoc.statement || {})),
                    templates: JSON.parse(JSON.stringify(questionDoc.templates || questionDoc.starterCode || {})),
                };

                // 3. Make the question offline (isPublished = false)
                if (questionDoc.metadata) {
                    questionDoc.metadata.isPublished = false;
                } else {
                    questionDoc.isPublished = false;
                }
                await questionDoc.save();

                // 4. Correct the question details properly using Grok
                const correctPrompt = `
Question Details:
${JSON.stringify(qDetails, null, 2)}

User Issue:
Reason: ${report.reason}
Description of issue: ${report.details}

Analysis of issue:
${checkResult.analysis}

Please fix the field "${checkResult.targetField}" to resolve the user issue properly. 
Return the fully corrected version of the field.
Provide the output in a JSON object with:
- "correctedValue": string (or object if modifying template structures)
`;

                const correctSystem = `You are an expert compiler and contents writer.
Correct the designated field of the question according to the issue details and return ONLY a JSON object containing "correctedValue" containing the final correct content.`;

                const correctResult = await callGrokJson(correctPrompt, correctSystem);

                // Update the document
                const field = checkResult.targetField;
                if (field === "starterCode" || field === "templates") {
                    if (questionDoc.templates) {
                        questionDoc.templates = correctResult.correctedValue;
                    } else if (questionDoc.starterCode) {
                        questionDoc.starterCode = correctResult.correctedValue;
                    }
                } else if (["markdown", "inputFormat", "outputFormat", "notes"].includes(field)) {
                    if (hasStatementString) {
                        questionDoc.statement = correctResult.correctedValue;
                    } else if (hasScenarioString) {
                        questionDoc.scenario = correctResult.correctedValue;
                    } else {
                        if (!questionDoc.statement) {
                            questionDoc.statement = {};
                        }
                        questionDoc.statement[field] = correctResult.correctedValue;
                    }
                }

                // 5. Make the question online again (isPublished = true)
                if (questionDoc.metadata) {
                    questionDoc.metadata.isPublished = true;
                } else {
                    questionDoc.isPublished = true;
                }

                // Force mark modified if nested
                questionDoc.markModified("statement");
                questionDoc.markModified("templates");
                questionDoc.markModified("starterCode");
                questionDoc.markModified("metadata");

                await questionDoc.save();

                const snapshotAfter = {
                    title: questionDoc.title || questionDoc.scenarioName || "Untitled",
                    statement: JSON.parse(JSON.stringify(questionDoc.statement || {})),
                    templates: JSON.parse(JSON.stringify(questionDoc.templates || questionDoc.starterCode || {})),
                };

                // Mark report as resolved
                report.questionSnapshotBefore = snapshotBefore;
                report.questionSnapshotAfter = snapshotAfter;
                report.status = "RESOLVED";
                await report.save();

                audit.fixedFields.push(field);
                audit.status = "RESOLVED";
            } else {
                // Dismiss the report
                report.status = "DISMISSED";
                await report.save();
                audit.status = "DISMISSED";
            }

        } catch (e: any) {
            console.error(`[AI Moderator] Error processing report ${report._id}:`, e);
            audit.status = "FAILED";
            audit.error = e.message || "Unknown error";
        }

        auditLogs.push(audit);
    }

    return auditLogs;
}
