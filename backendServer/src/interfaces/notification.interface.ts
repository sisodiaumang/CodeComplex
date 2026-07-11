import { Document, Types } from "mongoose";

export type NotificationType =
    | "FRIEND_REQUEST"
    | "FRIEND_ACCEPTED"
    | "FRIEND_REMOVED"
    | "ROOM_INVITE"
    | "MATCH_STARTED"
    | "MATCH_RESULT"
    | "ACHIEVEMENT_UNLOCKED"
    | "SYSTEM";

export interface INotification extends Document {

    recipient: Types.ObjectId;

    sender?: Types.ObjectId;

    type: NotificationType;

    title: string;

    message: string;

    isRead: boolean;

    relatedEntityId?: Types.ObjectId;

    metadata?: Record<string, unknown>;

    createdAt: Date;
    updatedAt: Date;
}