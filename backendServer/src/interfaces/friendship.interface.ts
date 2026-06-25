import { Document, Types } from "mongoose";
import { IUser } from "./user.interface.js";

export type FriendshipStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "BLOCKED";

export interface IFriendship extends Document {
    sender: Types.ObjectId | IUser;
    receiver: Types.ObjectId | IUser;
    status: FriendshipStatus;
    createdAt: Date;
    updatedAt: Date;
}