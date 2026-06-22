import { Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;

    avatar?: {
        profileImageURL:string,
        profileImagePublicId:string
    };
    bio?: string;
    country?: string;

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
}