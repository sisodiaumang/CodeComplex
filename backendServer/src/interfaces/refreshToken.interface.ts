import { Document } from "mongoose";
import { Types } from "mongoose";

export interface IRefreshToken extends Document {

    userId: Types.ObjectId;

    token: string;

    expiresAt: Date;

    createdAt: Date;
    updatedAt: Date;
    compareToken(
        token: string
    ): Promise<boolean>;
    isExpired(): boolean;
}
