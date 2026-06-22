import mongoose from "mongoose";
import { INotification } from "../interfaces/notification.interface.js";

const notificationSchema =
new mongoose.Schema<INotification>(
{
    recipient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    type:{
        type:String,
        enum:[
            "FRIEND_REQUEST",
            "FRIEND_ACCEPTED",
            "ROOM_INVITE",
            "MATCH_STARTED",
            "MATCH_RESULT",
            "ACHIEVEMENT_UNLOCKED",
            "SYSTEM"
        ],
        required:true
    },

    title:{
        type:String,
        required:true
    },

    message:{
        type:String,
        required:true
    },

    isRead:{
        type:Boolean,
        default:false
    },

    relatedEntityId:{
        type:mongoose.Schema.Types.ObjectId
    }

},
{
    timestamps:true
});


notificationSchema.index({
    recipient: 1,
    isRead: 1
});

notificationSchema.index({
    recipient: 1,
    createdAt: -1
});



const Notification: mongoose.Model<INotification> =
    (mongoose.models.Notification as mongoose.Model<INotification>) ||
    mongoose.model<INotification>(
        "Notification",
        notificationSchema
    );

export default Notification;