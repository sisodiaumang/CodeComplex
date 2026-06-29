import mongoose from "mongoose";
import {
    IBackendQuestion,
    IBackendEndpointSpec,
    IBackendApiTestCase,
} from "../interfaces/backendQuestion.interface.js";

const endpointSpecSchema = new mongoose.Schema<IBackendEndpointSpec>(
    {
        method: {
            type: String,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            required: true,
        },
        path: { type: String, required: true },
        description: { type: String, required: true },
    },
    { _id: false }
);

const apiTestCaseSchema = new mongoose.Schema<IBackendApiTestCase>(
    {
        id: { type: String, required: true },
        method: {
            type: String,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            required: true,
        },
        path: { type: String, required: true },
        headers: { type: mongoose.Schema.Types.Mixed },
        body: { type: mongoose.Schema.Types.Mixed },
        expectedStatus: { type: Number, required: true },
        expectedBody: { type: mongoose.Schema.Types.Mixed },
        expectedBodySchema: { type: mongoose.Schema.Types.Mixed },
        isVisible: { type: Boolean, required: true },
    },
    { _id: false }
);

const judgeConfigSchema = new mongoose.Schema(
    {
        requestTimeoutMs: { type: Number, required: true, min: 1 },
        startupTimeoutMs: { type: Number, required: true, min: 1 },
        healthCheckPath: { type: String },
        port: { type: Number, required: true, min: 1 },
        stack: { type: [String], required: true, default: [] },
    },
    { _id: false }
);

const scoringSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["binary", "partial"], default: "binary" },
        maxScore: { type: Number, required: true, default: 100, min: 0 },
        partialScoring: { type: Boolean, required: true, default: false },
    },
    { _id: false }
);

const battleConfigSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, required: true, default: true },
        timeBonus: { type: Boolean, required: true, default: false },
        maxBattleScore: { type: Number, required: true, default: 100, min: 0 },
    },
    { _id: false }
);

const testCaseDistributionSchema = new mongoose.Schema(
    {
        visible: { type: Number, required: true, min: 0 },
        hidden: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const backendQuestionSchema = new mongoose.Schema<IBackendQuestion>(
    {
        // Same reasoning as question.model.ts: human-readable string ids
        // (e.g. "backend_001"), not Mongo ObjectIds.
        _id: { type: String, required: true },

        title: { type: String, required: true, trim: true },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true,
        },

        topics: { type: [String], default: [] },

        statement: { type: String, required: true },

        constraints: { type: [String], default: [] },

        endpoints: { type: [endpointSpecSchema], default: [] },

        mode: {
            type: String,
            enum: ["solve", "bug_fix"],
            required: true,
            default: "solve",
        },

        starterCode: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        buggyStarterCode: {
            type: mongoose.Schema.Types.Mixed,
        },

        judgeConfig: { type: judgeConfigSchema, required: true },

        scoring: {
            type: scoringSchema,
            required: true,
            default: () => ({ type: "binary", maxScore: 100, partialScoring: false }),
        },

        battleConfig: {
            type: battleConfigSchema,
            required: true,
            default: () => ({ enabled: true, timeBonus: false, maxBattleScore: 100 }),
        },

        visibleApiTestCases: {
            type: [apiTestCaseSchema],
            default: [],
            validate: {
                validator: (cases: IBackendApiTestCase[]) =>
                    cases.every((tc) => tc.isVisible === true),
                message: "Every entry in visibleApiTestCases must have isVisible: true",
            },
        },

        hiddenApiTestCases: {
            type: [apiTestCaseSchema],
            default: [],
            validate: {
                validator: (cases: IBackendApiTestCase[]) =>
                    cases.every((tc) => tc.isVisible === false),
                message: "Every entry in hiddenApiTestCases must have isVisible: false",
            },
        },

        testCaseDistribution: {
            type: testCaseDistributionSchema,
            required: true,
            default: () => ({ visible: 0, hidden: 0, total: 0 }),
        },

        tags: { type: [String], default: [], index: true },
    },
    {
        timestamps: true,
    }
);

backendQuestionSchema.pre("validate", function () {
    const visible = this.visibleApiTestCases?.length ?? 0;
    const hidden = this.hiddenApiTestCases?.length ?? 0;

    this.testCaseDistribution = { visible, hidden, total: visible + hidden };

    if (
        this.mode === "bug_fix" &&
        (!this.buggyStarterCode || Object.keys(this.buggyStarterCode).length === 0)
    ) {
        this.invalidate(
            "buggyStarterCode",
            "buggyStarterCode is required when mode is \"bug_fix\""
        );
    }
});

backendQuestionSchema.index({ difficulty: 1 });
backendQuestionSchema.index({ topics: 1 });

const BackendQuestion: mongoose.Model<IBackendQuestion> =
    (mongoose.models.BackendQuestion as mongoose.Model<IBackendQuestion>) ||
    mongoose.model<IBackendQuestion>("BackendQuestion", backendQuestionSchema);

export default BackendQuestion;