import mongoose from "mongoose";

export interface IApiKey {
    label: string; // e.g., "API 3"
    keyHash: string; // Encrypted API key string
    iv: string; // Hex IV used for AES decryption
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const apiKeySchema = new mongoose.Schema<IApiKey>(
    {
        label: { type: String, required: true },
        keyHash: { type: String, required: true },
        iv: { type: String, required: true },
        isActive: { type: Boolean, required: true, default: true },
    },
    { timestamps: true }
);

const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", apiKeySchema);
export default ApiKey;
