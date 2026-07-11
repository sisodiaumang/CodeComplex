import mongoose from "mongoose";

export interface ITokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    feature: "FRONTEND" | "PROMPT_WAR" | "FULLSTACK";
    cost: number; // estimated USD cost
    createdAt: Date;
}

const tokenUsageSchema = new mongoose.Schema<ITokenUsage>(
    {
        promptTokens: { type: Number, required: true },
        completionTokens: { type: Number, required: true },
        totalTokens: { type: Number, required: true },
        model: { type: String, required: true, default: "grok-2" },
        feature: { type: String, required: true, enum: ["FRONTEND", "PROMPT_WAR", "FULLSTACK"] },
        cost: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

const TokenUsage = mongoose.models.TokenUsage || mongoose.model<ITokenUsage>("TokenUsage", tokenUsageSchema);
export default TokenUsage;
