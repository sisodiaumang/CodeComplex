import mongoose from "mongoose";
import { IFriendship } from "../interfaces/friendship.interface.js";

const friendshipSchema =
    new mongoose.Schema<IFriendship>(
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            status: {
                type: String,
                enum: [
                    "PENDING",
                    "ACCEPTED",
                    "REJECTED",
                    "BLOCKED"
                ],
                default: "PENDING"
            }
        },
        {
            timestamps: true
        }
    );


// Unique pair index — prevents duplicate {sender, receiver} documents.
// FIX: This alone does NOT prevent {sender: B, receiver: A} when {sender: A,
// receiver: B} already exists. The controller/service must check for the
// reverse pair before creating a new friendship request. Example query:
//
//   await Friendship.findOne({
//     $or: [
//       { sender: userId, receiver: targetId },
//       { sender: targetId, receiver: userId }
//     ]
//   });
friendshipSchema.index(
    { sender: 1, receiver: 1 },
    { unique: true }
);

friendshipSchema.index({ sender: 1 });
friendshipSchema.index({ receiver: 1 });
friendshipSchema.index({ status: 1 });


// FIX: pre-save hook catches self-requests on document.save() calls, but it
// is bypassed by findOneAndUpdate. Always enforce this check at the
// controller/service layer too.
friendshipSchema.pre("save", function () {

    if (this.sender.toString() === this.receiver.toString()) {
        throw new Error(
            "Cannot send friend request to yourself"
        );
    }

});


const Friendship: mongoose.Model<IFriendship> =
    (mongoose.models.Friendship as mongoose.Model<IFriendship>) ||
    mongoose.model<IFriendship>("Friendship", friendshipSchema);

export default Friendship;