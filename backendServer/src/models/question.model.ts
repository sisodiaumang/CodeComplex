import mongoose from "mongoose";
import slugify from "slugify";

import {
    IAnalytics,
    IBattleConfig,
    ICompanyTag,
    IConstraint,
    IEditorial,
    IJudgeConfig,
    IQuestion,
    IQuestionExample,
    IQuestionHint,
    IQuestionMetadata,
    IQuestionSolutions,
    IQuestionStatement,
    IQuestionTestCase,
    IScoring,
    ILanguageCode,
    IFunctionSignature,
} from "../interfaces/question.interface.js";

/* ─────────────────────────────────────────────────────────── */
/*                      COMPANY                               */
/* ─────────────────────────────────────────────────────────── */

export const companySchema = new mongoose.Schema<ICompanyTag>(
    {
        name: { type: String, required: true, trim: true },
        frequency: { type: Number, required: true, min: 1, max: 5, default: 3 },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                     METADATA                               */
/* ─────────────────────────────────────────────────────────── */

export const metadataSchema = new mongoose.Schema<IQuestionMetadata>(
    {
        estimatedTime: { type: Number, required: true, min: 1 },
        points: { type: Number, default: 100, min: 0 },
        premium: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: true },

        companies: { type: [companySchema], default: [] },
        topics: { type: [String], default: [] },
        patterns: { type: [String], default: [] },
        prerequisites: { type: [String], default: [] },
        variants: { type: [String], default: [] },
        tags: { type: [String], default: [] },
        keywords: { type: [String], default: [] },

        interviewFrequency: { type: Number, default: 0, min: 0, max: 5 },
        revisionLevel: { type: Number, default: 0, enum: [0, 1, 2] },


        contestEligible: { type: Boolean, default: false },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                     CONSTRAINT                             */
/* ─────────────────────────────────────────────────────────── */

export const constraintSchema = new mongoose.Schema<IConstraint>(
    {
        variable: { type: String, required: true },
        type: { type: String, required: true },
        min: Number,
        max: Number,
        description: String,
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      EXAMPLE                               */
/* ─────────────────────────────────────────────────────────── */

export const exampleSchema = new mongoose.Schema<IQuestionExample>(
    {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: String,
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      STATEMENT                             */
/* ─────────────────────────────────────────────────────────── */

export const statementSchema = new mongoose.Schema<IQuestionStatement>(
    {
        markdown: { type: String, required: true },
        html: String,
        inputFormat: String,
        outputFormat: String,
        notes: String,
        images: { type: [String], default: [] },
        constraints: { type: [constraintSchema], default: [] },
        examples: { type: [exampleSchema], default: [] },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      HINT                                */
/* ─────────────────────────────────────────────────────────── */

export const hintSchema = new mongoose.Schema<IQuestionHint>(
    {
        order: { type: Number, required: true },
        text: { type: String, required: true },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                     EDITORIAL                              */
/* ─────────────────────────────────────────────────────────── */

export const editorialSchema = new mongoose.Schema<IEditorial>(
    {
        title: { type: String, required: true },
        intuition: { type: String, required: true },
        bruteForce: { type: String, required: true },
        betterSolution: String,
        optimalSolution: { type: String, required: true },
        proofOfCorrectness: String,
        dryRun: String,
        commonMistakes: { type: [String], default: [] },
        timeComplexity: { type: String, required: true },
        spaceComplexity: { type: String, required: true },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      TEST CASE                              */
/* ─────────────────────────────────────────────────────────── */

export const testCaseSchema = new mongoose.Schema<IQuestionTestCase>(
    {
        id: { type: String, required: true, trim: true },
        input: { type: String, required: true },
        output: { type: String, required: true },
        isVisible: { type: Boolean, required: true },
        weight: { type: Number, default: 1, min: 1 },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                    JUDGE CONFIG                            */
/* ─────────────────────────────────────────────────────────── */

export const judgeConfigSchema = new mongoose.Schema<IJudgeConfig>(
    {
        timeLimit: { type: Number, required: true, min: 1 },
        memoryLimit: { type: Number, required: true, min: 1 },
        stackLimit: Number,
        outputLimit: Number,
        supportedLanguages: { type: [String], required: true, default: [] },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      SCORING                               */
/* ─────────────────────────────────────────────────────────── */

export const scoringSchema = new mongoose.Schema<IScoring>(
    {
        type: { type: String, enum: ["binary", "partial"], default: "binary" },
        maxScore: { type: Number, default: 100, min: 0 },
        partialScoring: { type: Boolean, default: false },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                    BATTLE CONFIG                           */
/* ─────────────────────────────────────────────────────────── */

export const battleConfigSchema = new mongoose.Schema<IBattleConfig>(
    {
        enabled: { type: Boolean, default: true },
        ratingEnabled: { type: Boolean, default: true },
        timeBonus: { type: Boolean, default: false },
        maxBattleScore: { type: Number, default: 100 },
        difficultyMultiplier: { type: Number, default: 1 },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                      ANALYTICS                             */
/* ─────────────────────────────────────────────────────────── */

export const analyticsSchema = new mongoose.Schema<IAnalytics>(
    {
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 },
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        averageRuntime: { type: Number, default: 0 },
        averageMemory: { type: Number, default: 0 },
    },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                  LANGUAGE CODE                             */
/* ─────────────────────────────────────────────────────────── */

const languageCodeSchema = new mongoose.Schema<ILanguageCode>(
    { cpp: String, java: String, python: String, javascript: String, go: String },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*               FUNCTION SIGNATURE                           */
/* ─────────────────────────────────────────────────────────── */

const functionSignatureSchema = new mongoose.Schema<IFunctionSignature>(
    { cpp: String, java: String, python: String, javascript: String, go: String },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                    SOLUTIONS                               */
/* ─────────────────────────────────────────────────────────── */

const solutionSchema = new mongoose.Schema<IQuestionSolutions>(
    { cpp: String, java: String, python: String, javascript: String, go: String },
    { _id: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                    QUESTION                                */
/* ─────────────────────────────────────────────────────────── */

const questionSchema = new mongoose.Schema<IQuestion>(
    {
        _id: { type: String, required: true },

        title: { type: String, required: true, trim: true },

        slug: { type: String, required: false, unique: true, lowercase: true, trim: true },

        difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },

        category: { type: String, required: true, trim: true, enum: ["ARRAY", "STRING", "GRAPH", "TREE", "GREEDY", "DP", "LINKED_LIST", "STACK", "QUEUE", "HEAP", "BINARY_SEARCH", "BACKTRACKING", "BIT_MANIPULATION", "MATH", "SORTING", "TRIE"] },

        subCategory: { type: String, default: "" },

        mode: { type: String, enum: ["solve", "bug_fix"], default: "solve", required: true },

        metadata: { type: metadataSchema, required: true },

        statement: { type: statementSchema, required: true },

        hints: { type: [hintSchema], default: [] },

        editorial: { type: editorialSchema, required: false, default: undefined },

        starterCode: { type: languageCodeSchema, required: true },
        buggyStarterCode: { type: languageCodeSchema, required: false },

        functionSignature: { type: functionSignatureSchema, required: true },

        solutions: { type: solutionSchema, required: false, default: undefined },

        judgeConfig: { type: judgeConfigSchema, required: true },
        scoring: { type: scoringSchema, required: true },
        battleConfig: { type: battleConfigSchema, required: true },

        testCases: { type: [testCaseSchema], default: [] },

        analytics: {
            type: analyticsSchema,
            default: () => ({
                likes: 0,
                dislikes: 0,
                totalSubmissions: 0,
                acceptedSubmissions: 0,
                averageRuntime: 0,
                averageMemory: 0,
            }),
        },

        similarProblems: { type: [String], default: [] },
        followUpQuestions: { type: [String], default: [] },

        // Soft delete
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },

        // Auditing
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: undefined },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: undefined },

    },
    { timestamps: true, versionKey: false, strict: true }
);

/* ─────────────────────────────────────────────────────────── */
/*                    VALIDATION                              */
/* ─────────────────────────────────────────────────────────── */

// Auto-generate slug
questionSchema.pre("validate", function () {
    if (!this.slug && this.title) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    
});

// Duplicate test case id validation
questionSchema.pre("validate", function () {
    const ids = new Set<string>();
    for (const tc of this.testCases || []) {
        if (ids.has(tc.id)) {
            this.invalidate("testCases", `Duplicate testcase id ${tc.id}`);
        }
        ids.add(tc.id);
    }
});

// Visibility validation: need >=1 public and >=1 hidden
questionSchema.pre("validate", function () {
    const tcs = this.testCases || [];
    const publicCount = tcs.filter((tc) => tc.isVisible).length;
    const hiddenCount = tcs.filter((tc) => !tc.isVisible).length;

    if (publicCount < 1)
        this.invalidate("testCases", "At least 1 visible test case is required");
    if (hiddenCount < 1)
        this.invalidate("testCases", "At least 1 hidden test case is required");

    
});

// Bug-fix validation: require starterCode AND buggyStarterCode
questionSchema.pre("validate", function () {
    if (this.mode === "bug_fix") {
        const hasStarter =
            !!this.starterCode &&
            Object.keys(this.starterCode as any).length > 0;

        if (!hasStarter)
            this.invalidate("starterCode", "starterCode is required for bug_fix mode");

        const hasBuggy =
            !!this.buggyStarterCode &&
            Object.keys(this.buggyStarterCode as any).length > 0;

        if (!hasBuggy)
            this.invalidate("buggyStarterCode", "buggyStarterCode is required for bug_fix mode");
    }
    
});

// Language consistency: starterCode/functionSignature/solutions must align with supportedLanguages
questionSchema.pre("validate", function () {
    const supported = new Set<string>(this.judgeConfig?.supportedLanguages || []);
    const keys: Array<keyof ILanguageCode> = ["cpp", "java", "python", "javascript", "go"];

    // starterCode + reverse check (supported -> code exists)
    for (const lang of supported) {
        if (!(this.starterCode as any)?.[lang]) {
            this.invalidate("starterCode", `Missing starterCode for ${lang}`);
        }
    }

    // starterCode forward check (code exists -> supported)
    for (const k of keys) {
        if ((this.starterCode as any)?.[k] && !supported.has(k as string)) {
            this.invalidate(
                "starterCode",
                `starterCode.${k} exists but ${k} is not in supportedLanguages`
            );
        }
    }

    // functionSignature + reverse check
    for (const lang of supported) {
        if (!(this.functionSignature as any)?.[lang]) {
            this.invalidate("functionSignature", `Missing functionSignature for ${lang}`);
        }
    }

    // functionSignature forward check
    for (const k of keys) {
        if ((this.functionSignature as any)?.[k] && !supported.has(k as string)) {
            this.invalidate(
                "functionSignature",
                `functionSignature.${k} exists but ${k} is not in supportedLanguages`
            );
        }
    }

    // solutions (if provided): reverse + forward
    if (this.solutions) {
        let anySolution = false;

        for (const lang of supported) {
            if (!(this.solutions as any)?.[lang]) {
                this.invalidate("solutions", `Missing solutions for ${lang}`);
            }
        }

        for (const k of keys) {
            if ((this.solutions as any)?.[k]) {
                anySolution = true;
                if (!supported.has(k as string)) {
                    this.invalidate(
                        "solutions",
                        `solutions.${k} exists but ${k} is not in supportedLanguages`
                    );
                }
            }
        }

        if (!anySolution) {
            this.invalidate("solutions", "solutions cannot be empty");
        }
    }
});



/* ─────────────────────────────────────────────────────────── */
/*                   VIRTUALS                                 */
/* ─────────────────────────────────────────────────────────── */

questionSchema.virtual("acceptanceRate").get(function () {
    if (!this.analytics || this.analytics.totalSubmissions === 0) return 0;
    const accepted = this.analytics.acceptedSubmissions || 0;
    const total = this.analytics.totalSubmissions || 0;
    return Number(((accepted / total) * 100).toFixed(2));
});

questionSchema.virtual("visibleTestCases").get(function () {
    return (this.testCases || []).filter((tc) => tc.isVisible);
});

questionSchema.virtual("hiddenTestCases").get(function () {
    return (this.testCases || []).filter((tc) => !tc.isVisible);
});

/* ─────────────────────────────────────────────────────────── */
/*                      INDEXES                             */
/* ─────────────────────────────────────────────────────────── */

questionSchema.index({ slug: 1 }, { unique: true });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ mode: 1 });
questionSchema.index({ "metadata.topics": 1 });
questionSchema.index({ "metadata.patterns": 1 });
questionSchema.index({ "metadata.tags": 1 });
questionSchema.index({ "metadata.keywords": 1 });
questionSchema.index({ "metadata.prerequisites": 1 });
questionSchema.index({ "metadata.variants": 1 });
questionSchema.index({ "metadata.companies.name": 1 });
questionSchema.index({ isDeleted: 1 });
questionSchema.index({ createdBy: 1 });


questionSchema.index(
    {
        title: "text",
        "statement.markdown": "text",
        "metadata.tags": "text",
        "metadata.topics": "text",
        "metadata.patterns": "text",
        "metadata.keywords": "text",
        "metadata.prerequisites": "text",
        "metadata.variants": "text",
    },
    { name: "Question_Search_Index" }
);


/* ─────────────────────────────────────────────────────────── */
/*                       EXPORT                               */
/* ─────────────────────────────────────────────────────────── */

const Question =
    (mongoose.models.Question as mongoose.Model<IQuestion>) ||
    mongoose.model<IQuestion>("Question", questionSchema);

export default Question;

