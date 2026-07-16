import mongoose from "mongoose";

export interface IReport {
    reporter: mongoose.Types.ObjectId;
    targetType: "USER" | "QUESTION" | "SITE";
    reportedUser?: mongoose.Types.ObjectId;
    reportedQuestion?: string;
    reason: string;
    details: string;
    matchId?: mongoose.Types.ObjectId;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    questionSnapshotBefore?: any;
    questionSnapshotAfter?: any;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new mongoose.Schema<IReport>(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetType: {
            type: String,
            required: true,
            enum: ["USER", "QUESTION", "SITE"],
            default: "USER"
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reportedQuestion: {
            type: String,
            ref: "Question",
        },
        reason: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            required: true,
            trim: true,
        },
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
        },
        status: {
            type: String,
            required: true,
            enum: ["PENDING", "RESOLVED", "DISMISSED"],
            default: "PENDING",
        },
        questionSnapshotBefore: {
            type: mongoose.Schema.Types.Mixed,
        },
        questionSnapshotAfter: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reportedQuestion: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.models.Report || mongoose.model<IReport>("Report", reportSchema);
export default Report;
