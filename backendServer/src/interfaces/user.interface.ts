import { Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    fullName : string;
    email: string;
    password: string;

    oauthProvider?: "google" | "github";
    oauthId?: string;

    avatar: {
        profileImageURL:string,
        profileImagePublicId:string
    };
    bio?: string;
    country: string;
    githubProfile?: string;
    linkedinProfile?: string;
    leetcodeProfile?: string;
    mascot?: {
        type: string;
        color: string;
    };
    banner?: string;
    role: "USER" | "ADMIN"|"MODERATOR"|"OWNER";

    isVerified: boolean;
    isBanned: boolean;

    lastSeen: Date;
    lastPasswordChangedAt?: Date;

    createdAt: Date;
    updatedAt: Date;

    comparePassword(
        password: string
    ): Promise<boolean>;

    generateRefreshToken() : string;
    generateAccessToken() :string;

}