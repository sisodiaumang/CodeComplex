import crypto from "crypto";
import ModelConfig from "../models/modelConfig.model.js";
import TokenUsage from "../models/tokenUsage.model.js";
import ApiKey from "../models/apiKey.model.js";
import { env } from "../config/env.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const ALGORITHM = "aes-256-cbc";

// Derive a 32-byte key from JWT_ACCESS_SECRET for AES encryption
const ENCRYPTION_KEY = crypto
    .createHash("sha256")
    .update(env.JWT_ACCESS_SECRET || "fallback_encryption_key_32_bytes_long!")
    .digest();

const GROQ_MODEL_ALIAS_MAP: Record<string, string> = {
    "meta-llama/llama-4-scout-17b-16e-instruct": "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b": "llama-3.3-70b-versatile",
    "openai/gpt-oss-20b": "llama-3.1-8b-instant",
    "qwen/qwen3-32b": "llama-3.3-70b-versatile",
    "qwen/qwen3.6-27b": "llama-3.3-70b-versatile",
    "grok-2-vision-1212": "llama-3.3-70b-versatile"
};

const DEFAULT_MODELS = [
    {
        modelId: "llama-3.3-70b-versatile",
        displayName: "Llama 3.3 70B",
        inputPricePer1M: 0.59,
        outputPricePer1M: 0.79,
        spendLimit: 5.00,
        limitSpent: 0,
        priority: 1,
        isActive: true,
    },
    {
        modelId: "llama-3.1-8b-instant",
        displayName: "Llama 3.1 8B",
        inputPricePer1M: 0.05,
        outputPricePer1M: 0.08,
        spendLimit: 5.00,
        limitSpent: 0,
        priority: 2,
        isActive: true,
    },
    {
        modelId: "mixtral-8x7b-32768",
        displayName: "Mixtral 8x7B",
        inputPricePer1M: 0.24,
        outputPricePer1M: 0.24,
        spendLimit: 5.00,
        limitSpent: 0,
        priority: 3,
        isActive: true,
    },
    {
        modelId: "gemma2-9b-it",
        displayName: "Gemma 2 9B",
        inputPricePer1M: 0.20,
        outputPricePer1M: 0.20,
        spendLimit: 5.00,
        limitSpent: 0,
        priority: 4,
        isActive: true,
    }
];

export async function seedModels() {
    try {
        for (const m of DEFAULT_MODELS) {
            await ModelConfig.findOneAndUpdate(
                { modelId: m.modelId },
                { $setOnInsert: m },
                { upsert: true, new: true }
            );
        }
        console.log("[AIGateway] Models seeded successfully");
    } catch (error) {
        console.error("[AIGateway] Failed to seed models:", error);
    }
}

/**
 * Encrypt plain text using AES-256-CBC.
 */
export function encrypt(text: string): { iv: string; encryptedData: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
    };
}

/**
 * Decrypt ciphertext using AES-256-CBC.
 */
export function decrypt(encryptedData: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedData, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/**
 * Decrypted API key info containing identifier and plaintext key value.
 */
export interface DecryptedKeyInfo {
    _id: string; // "env-0", "env-1", or MongoDB ObjectId
    key: string;
}

/**
 * Get all API keys configured in the environment (.env).
 */
export function getEnvApiKeys(): string[] {
    const keys: string[] = [];
    if (env.GROQ_API_KEY) keys.push(env.GROQ_API_KEY);
    if (env.GROQ_API_KEYS) {
        const splitKeys = env.GROQ_API_KEYS.split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        for (const k of splitKeys) {
            if (!keys.includes(k)) {
                keys.push(k);
            }
        }
    }
    if (env.XAI_API_KEY && !keys.includes(env.XAI_API_KEY)) {
        keys.push(env.XAI_API_KEY);
    }
    return keys;
}

/**
 * Get all API keys (environment keys + active decrypted database keys) mapped with unique IDs.
 */
export async function getDecryptedApiKeys(): Promise<DecryptedKeyInfo[]> {
    const keys: DecryptedKeyInfo[] = [];

    // 1. Get from env
    const envKeys = getEnvApiKeys();
    envKeys.forEach((key, idx) => {
        keys.push({ _id: `env-${idx}`, key });
    });

    // 2. Get from database
    try {
        const dbKeys = await ApiKey.find({ isActive: true });
        for (const dbKey of dbKeys) {
            try {
                const decrypted = decrypt(dbKey.keyHash, dbKey.iv);
                if (decrypted && !keys.some((x) => x.key === decrypted)) {
                    keys.push({ _id: dbKey._id.toString(), key: decrypted });
                }
            } catch (err) {
                console.error(`[AIGateway] Failed to decrypt key ${dbKey.label}:`, err);
            }
        }
    } catch (error) {
        console.error("[AIGateway] Error fetching database API keys:", error);
    }
    return keys;
}

/**
 * Checks and resets limits for models whose reset interval has elapsed.
 */
export async function resetExpiredModelLimits() {
    try {
        const models = await ModelConfig.find();
        const now = new Date();
        for (const m of models) {
            const timeDiffMs = now.getTime() - m.lastResetTime.getTime();
            const resetIntervalMs = m.resetIntervalHours * 60 * 60 * 1000;
            if (timeDiffMs >= resetIntervalMs) {
                m.limitSpent = 0;
                m.lastResetTime = now;
                await m.save();
                console.log(`[AIGateway] Reset spent budget for model: ${m.modelId}`);
            }
        }
    } catch (error) {
        console.error("[AIGateway] Error resetting model limits:", error);
    }
}

interface GrokRequest {
    model: string;
    max_tokens?: number;
    messages: any[];
    temperature?: number;
    response_format?: { type: "json_object" };
}

/**
 * Route LLM request dynamically based on model spend limits and priority.
 */
export async function callLLM(
    requestedModel: string,
    requestBody: Omit<GrokRequest, "model">,
    feature: "FRONTEND" | "PROMPT_WAR" | "PROJECTS"
): Promise<{ text: string; modelUsed: string }> {
    // 1. Sanitize model ID using alias map
    const targetModel = GROQ_MODEL_ALIAS_MAP[requestedModel] || requestedModel;

    // 1b. Reset limits if reset interval passed
    await resetExpiredModelLimits();

    // 2. Fetch config for requested model
    let modelConfig = await ModelConfig.findOne({ modelId: targetModel });
    let modelIdToUse = targetModel;

    // Fallback logic if limits exceeded
    if (!modelConfig || !modelConfig.isActive || modelConfig.limitSpent >= modelConfig.spendLimit) {
        console.warn(
            `[AIGateway] Requested model ${targetModel} is inactive or budget exceeded (${modelConfig?.limitSpent?.toFixed(4)} / ${modelConfig?.spendLimit?.toFixed(4)}). Finding fallback model...`
        );

        // Find best active model that has not exceeded its limit, sorted by priority (lowest rank first)
        const fallbackConfig = await ModelConfig.findOne({
            isActive: true,
            $expr: { $lt: ["$limitSpent", "$spendLimit"] }
        }).sort({ priority: 1 });

        if (fallbackConfig) {
            modelIdToUse = fallbackConfig.modelId;
            modelConfig = fallbackConfig;
            console.log(`[AIGateway] Switching to fallback model: ${modelIdToUse}`);
        } else {
            console.warn("[AIGateway] All models have exceeded their spend limit! Falling back to original requested model.");
            modelConfig = await ModelConfig.findOne({ modelId: targetModel });
            if (!modelConfig) {
                modelConfig = new ModelConfig({
                    modelId: targetModel,
                    displayName: targetModel,
                    inputPricePer1M: 0.1,
                    outputPricePer1M: 0.2
                });
            }
        }
    }

    const apiKeys = await getDecryptedApiKeys();
    if (apiKeys.length === 0) {
        throw new Error("[AIGateway] No API keys available in environment or database");
    }

    // Sanitize messages so content is always a valid string for Groq text models
    const sanitizedMessages = (requestBody.messages || []).map((m: any) => {
        if (typeof m.content === "string") return m;
        if (Array.isArray(m.content)) {
            const textParts: string[] = [];
            for (const block of m.content) {
                if (block.type === "text" && block.text) {
                    textParts.push(block.text);
                } else if (block.type === "image_url" && block.image_url?.url) {
                    textParts.push(`\n[Reference Mockup Image: ${block.image_url.url}]`);
                }
            }
            return { ...m, content: textParts.join("\n") };
        }
        return { ...m, content: String(m.content || "") };
    });

    let lastError: Error | null = null;
    let apiResponseData: any = null;
    let successfulKeyId = "";

    // 3. API key rotation loop
    for (let i = 0; i < apiKeys.length; i++) {
        const keyInfo = apiKeys[i];
        console.log(`[AIGateway] Requesting ${modelIdToUse} with API Key ${keyInfo._id} (${i + 1}/${apiKeys.length})`);

        try {
            const res = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${keyInfo.key}`,
                },
                body: JSON.stringify({
                    ...requestBody,
                    messages: sanitizedMessages,
                    model: modelIdToUse
                }),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                
                // If the model returned 404 / model_not_found, try automatic fallback to llama-3.3-70b-versatile
                if ((res.status === 404 || body.includes("model_not_found") || body.includes("does not exist")) && modelIdToUse !== "llama-3.3-70b-versatile") {
                    console.warn(`[AIGateway] Model '${modelIdToUse}' returned 404. Automatically falling back to 'llama-3.3-70b-versatile'...`);
                    modelIdToUse = "llama-3.3-70b-versatile";
                    const retryRes = await fetch(GROQ_API_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${keyInfo.key}`,
                        },
                        body: JSON.stringify({
                            ...requestBody,
                            messages: sanitizedMessages,
                            model: modelIdToUse
                        }),
                    });

                    if (retryRes.ok) {
                        const retryData = await retryRes.json() as any;
                        apiResponseData = retryData;
                        successfulKeyId = keyInfo._id;
                        break;
                    }
                }

                throw new Error(
                    `[AIGateway] API request failed with status ${res.status}: ${body.slice(0, 300)}`
                );
            }

            const data = await res.json() as any;
            if (data.error) {
                throw new Error(`[AIGateway] API responded with error: ${data.error.message}`);
            }

            apiResponseData = data;
            successfulKeyId = keyInfo._id;
            break; // Success!
        } catch (err: any) {
            console.warn(`[AIGateway] Key ${keyInfo._id} failed: ${err.message}`);
            lastError = err;
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }

    if (!apiResponseData) {
        throw lastError || new Error("[AIGateway] All API keys in pool failed");
    }

    const text = apiResponseData.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("[AIGateway] API returned empty response text");
    }

    // 4. Token & Cost Logging
    const promptTokens = apiResponseData.usage?.prompt_tokens ?? 0;
    const completionTokens = apiResponseData.usage?.completion_tokens ?? 0;
    const totalTokens = apiResponseData.usage?.total_tokens ?? 0;

    const inputPrice = modelConfig.inputPricePer1M ?? 0;
    const outputPrice = modelConfig.outputPricePer1M ?? 0;
    const cost = (promptTokens * inputPrice + completionTokens * outputPrice) / 1_000_000;

    // Update model's budget spent in DB
    await ModelConfig.updateOne(
        { modelId: modelIdToUse },
        { $inc: { limitSpent: cost } }
    );

    // Save token usage record
    try {
        await TokenUsage.create({
            promptTokens,
            completionTokens,
            totalTokens,
            model: modelIdToUse,
            feature,
            cost,
            apiKeyId: successfulKeyId,
        });
    } catch (e) {
        console.error("[AIGateway] Failed to save token usage log:", e);
    }

    return { text, modelUsed: modelIdToUse };
}
