import mongoose from "mongoose";
import {
    IPromptWarScenario,
    IPromptWarEvaluationCriterion,
} from "../interfaces/promptWarScenario.interface.js";

const evaluationCriterionSchema = new mongoose.Schema<IPromptWarEvaluationCriterion>(
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
        comparisonMode: {
            type: String,
            enum: ["head_to_head", "absolute_score"],
            required: true,
            default: "head_to_head",
        },
    },
    { _id: false }
);

const scoringSchema = new mongoose.Schema(
    {
        maxScore: { type: Number, required: true, default: 100, min: 0 },
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

const promptWarScenarioSchema = new mongoose.Schema<IPromptWarScenario>(
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

        scenario: { type: String, required: true },
        targetArtifactType: { type: String, required: true },
        constraints: { type: [String], default: [] },

        evaluationCriteria: {
            type: [evaluationCriterionSchema],
            required: true,
            validate: {
                validator: (criteria: IPromptWarEvaluationCriterion[]) => criteria.length > 0,
                message: "evaluationCriteria must contain at least one criterion",
            },
        },

        judgeConfig: { type: judgeConfigSchema, required: true },

        scoring: {
            type: scoringSchema,
            required: true,
            default: () => ({ maxScore: 100 }),
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

promptWarScenarioSchema.index({ difficulty: 1 });
promptWarScenarioSchema.index({ topics: 1 });

const PromptWarScenario: mongoose.Model<IPromptWarScenario> =
    (mongoose.models.PromptWarScenario as mongoose.Model<IPromptWarScenario>) ||
    mongoose.model<IPromptWarScenario>("PromptWarScenario", promptWarScenarioSchema);

export default PromptWarScenario;