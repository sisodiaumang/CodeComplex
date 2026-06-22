import { Document } from "mongoose";

export type AchievementCategory =
    | "RATING"
    | "MATCHES"
    | "STREAK"
    | "DSA"
    | "PROMPT_WAR"
    | "SPECIAL";

export type Rarity = 
    
    | "COMMON"
    | "RARE"
    | "EPIC"
    | "LEGENDARY";


export interface IAchievement extends Document {

    name: string;

    description: string;

    rarity :Rarity ;

    icon: string;

    category: AchievementCategory;

    requirement: number;

    xpReward: number;

    createdAt: Date;
    updatedAt: Date;
}