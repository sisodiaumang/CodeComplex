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


export interface IMascotReward {
    name: string;
    icon: string;
    description: string;
}


export interface IAchievement extends Document {

    name: string;

    description: string;

    rarity :Rarity ;

    icon: string;

    category: AchievementCategory;

    requirement: number;

    xpReward: number;

    mascotReward?: IMascotReward;

    createdAt: Date;
    updatedAt: Date;
}