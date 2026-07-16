import mongoose from "mongoose";

export interface IModelConfig {
    modelId: string; // e.g. "llama-3.3-70b-versatile"
    displayName: string;
    inputPricePer1M: number; // in USD
    outputPricePer1M: number; // in USD
    spendLimit: number; // in USD
    limitSpent: number; // in USD
    priority: number; // 1 = best, higher numbers = fallbacks
    lastResetTime: Date;
    resetIntervalHours: number; // default: 24
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const modelConfigSchema = new mongoose.Schema<IModelConfig>(
    {
        modelId: { type: String, required: true, unique: true },
        displayName: { type: String, required: true },
        inputPricePer1M: { type: Number, required: true, default: 0 },
        outputPricePer1M: { type: Number, required: true, default: 0 },
        spendLimit: { type: Number, required: true, default: 5.00 },
        limitSpent: { type: Number, required: true, default: 0 },
        priority: { type: Number, required: true, default: 10 },
        lastResetTime: { type: Date, required: true, default: Date.now },
        resetIntervalHours: { type: Number, required: true, default: 24 },
        isActive: { type: Boolean, required: true, default: true },
    },
    { timestamps: true }
);

const ModelConfig = mongoose.models.ModelConfig || mongoose.model<IModelConfig>("ModelConfig", modelConfigSchema);
export default ModelConfig;
