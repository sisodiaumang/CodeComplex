import mongoose from "mongoose";
import { IAchievement } from "../interfaces/achievement.interface.js";



const achievementSchema =
    new mongoose.Schema<IAchievement>(
        {
            name: {
                type: String,
                required: true,
                unique: true
            },

            description: {
                type: String,
                required: true
            },

            icon: {
                type: String,
                required: true
            },

            category: {
                type: String,
                enum: [
                    "RATING",
                    "MATCHES",
                    "STREAK",
                    "DSA",
                    "PROMPT_WAR",
                    "SPECIAL"
                ],
                required: true
            },
            rarity: {
                type: String,
                enum: [
                    "COMMON",
                    "RARE",
                    "EPIC",
                    "LEGENDARY"
                ],
                default: "COMMON"
            },

            requirement: {
                type: Number,
                required: true,
                min: 1
            },

            xpReward: {
                type: Number,
                default: 0,
                min: 0
            },

            mascotReward: {
                name: { type: String },
                icon: { type: String },
                description: { type: String },
                type: { type: String },
                rarity: { type: String }
            }

        },
        {
            timestamps: true
        });


const Achievement: mongoose.Model<IAchievement> =
    (mongoose.models.Achievement as mongoose.Model<IAchievement>) ||
    mongoose.model<IAchievement>(
        "Achievement",
        achievementSchema
    );

export default Achievement;