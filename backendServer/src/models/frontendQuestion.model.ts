import mongoose from "mongoose";
import {
    IFrontendQuestion,
    IFrontendReferenceAsset,
    IFrontendGradingCriterion,
} from "../interfaces/frontendQuestion.interface.js";

const referenceAssetSchema = new mongoose.Schema<IFrontendReferenceAsset>(
    {
        url: { type: String, required: true },
        caption: { type: String },
    },
    { _id: false }
);

const gradingCriterionSchema = new mongoose.Schema<IFrontendGradingCriterion>(
    {
        id: { type: String, required: true },
        description: { type: String, required: true },
        weight: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const judgeConfigSchema = new mongoose.Schema(
    {
        judgeModel: { type: String, required: true },
        stack: { type: [String], required: true, default: [] },
        referenceSolution: { type: String },
    },
    { _id: false }
);

const scoringSchema = new mongoose.Schema(
    {
        maxScore: { type: Number, required: true, default: 100, min: 0 },
        passingScore: { type: Number, required: true, default: 70, min: 0 },
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

const frontendQuestionSchema = new mongoose.Schema<IFrontendQuestion>(
    {
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

        statement: {
            markdown: { type: String, required: true },
        },

        constraints: { type: [String], default: [] },

        referenceAssets: { type: [referenceAssetSchema], default: [] },

        starterCode: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // At least one criterion is required — a rubric-graded question
        // with zero criteria has nothing for the LLM judge to score
        // against, which is the frontend equivalent of question.model.ts's
        // "test case array can't be empty" guard in judge.service.ts.
        gradingCriteria: {
            type: [gradingCriterionSchema],
            required: true,
            validate: {
                validator: (criteria: IFrontendGradingCriterion[]) => criteria.length > 0,
                message: "gradingCriteria must contain at least one criterion",
            },
        },

        judgeConfig: { type: judgeConfigSchema, required: true },

        scoring: {
            type: scoringSchema,
            required: true,
            default: () => ({ maxScore: 100, passingScore: 70 }),
        },

        battleConfig: {
            type: battleConfigSchema,
            required: true,
            default: () => ({ enabled: true, timeBonus: false, maxBattleScore: 100 }),
        },

        tags: { type: [String], default: [], index: true },
    },
    {
        timestamps: true,
    }
);

frontendQuestionSchema.index({ difficulty: 1 });
frontendQuestionSchema.index({ topics: 1 });

const FrontendQuestion: mongoose.Model<IFrontendQuestion> =
    (mongoose.models.FrontendQuestion as mongoose.Model<IFrontendQuestion>) ||
    mongoose.model<IFrontendQuestion>("FrontendQuestion", frontendQuestionSchema);

export default FrontendQuestion;