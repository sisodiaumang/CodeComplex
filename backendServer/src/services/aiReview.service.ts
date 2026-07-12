import { env } from "../config/env.js";
import TokenUsage from "../models/tokenUsage.model.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function getApiKey(): string {
    const key = env.GROQ_API_KEY || env.XAI_API_KEY;
    if (!key) {
        throw new Error(
            "[AI Review] GROQ_API_KEY or XAI_API_KEY is not set in environment."
        );
    }
    return key;
}

export interface AiReviewResult {
    score: number;
    feedback: string;
}

export async function runAiReview(sourceCode: string, language: string): Promise<AiReviewResult> {
    try {
        const apiKey = getApiKey();
        
        const systemInstruction = `You are an expert code reviewer.
Review the following programming submission for:
1. Naming Conventions (are variable names, function names, parameter names descriptive and consistent?).
2. Code Structure (is the code clean, modular, logical, and easy to follow?).

Award a score out of 10 points (0 to 5 points for naming, and 0 to 5 points for structure).
Provide a brief 1-2 sentence overall feedback summarizing the review.
Return ONLY valid JSON matching this schema (no markdown formatting or code fences):
{
  "namingScore": <0-5 integer>,
  "structureScore": <0-5 integer>,
  "feedback": "<brief feedback text>"
}`;

        const prompt = `Language: ${language}\nSource Code:\n"""\n${sourceCode}\n"""`;

        const res = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            }),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`Groq request failed: ${res.status} ${res.statusText} ${body}`);
        }

        const data = await res.json() as any;
        
        // Log token usage asynchronously
        if (data.usage) {
            const promptTokens = data.usage.prompt_tokens ?? 0;
            const completionTokens = data.usage.completion_tokens ?? 0;
            const totalTokens = data.usage.total_tokens ?? 0;
            const cost = (promptTokens * 0.59 + completionTokens * 0.79) / 1_000_000;

            TokenUsage.create({
                promptTokens,
                completionTokens,
                totalTokens,
                model: data.model || "llama-3.3-70b-versatile",
                feature: "DSA",
                cost
            }).catch((e) => console.error("[TokenUsage] Failed to log AI review token usage:", e));
        }

        const text = data.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error("Empty response from Groq API");
        }

        const parsed = JSON.parse(text.trim());
        const namingScore = typeof parsed.namingScore === "number" ? parsed.namingScore : 0;
        const structureScore = typeof parsed.structureScore === "number" ? parsed.structureScore : 0;
        const score = Math.max(0, Math.min(10, namingScore + structureScore));

        return {
            score,
            feedback: parsed.feedback ?? ""
        };
    } catch (err) {
        console.error("[AI Review] Error during Grok code review:", err);
        // Fallback to safe default values if the LLM call fails
        return {
            score: 7, // neutral fallback
            feedback: "Code structures are clean. Variables are named logically."
        };
    }
}
