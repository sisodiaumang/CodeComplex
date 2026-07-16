import mongoose from "mongoose";

export interface ITokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    feature: "FRONTEND" | "PROMPT_WAR" | "PROJECTS";
    cost: number; // estimated USD cost
    apiKeyId?: string; // ID of the API key used
    createdAt: Date;
}

const tokenUsageSchema = new mongoose.Schema<ITokenUsage>(
    {
        promptTokens: { type: Number, required: true },
        completionTokens: { type: Number, required: true },
        totalTokens: { type: Number, required: true },
        model: { type: String, required: true, default: "grok-2" },
        feature: { type: String, required: true, enum: ["FRONTEND", "PROMPT_WAR", "PROJECTS", "DSA"] },
        cost: { type: Number, required: true, default: 0 },
        apiKeyId: { type: String, required: false },
    },
    { timestamps: true }
);

const TokenUsage = mongoose.models.TokenUsage || mongoose.model<ITokenUsage>("TokenUsage", tokenUsageSchema);
export default TokenUsage;
