import mongoose, { Schema } from "mongoose";
import { IProblemList } from "../interfaces/problemList.interface.js";

const problemListItemSchema = new Schema(
  {
    questionSlug: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "EASY", "MEDIUM", "HARD"],
      default: "Medium",
    },
    mode: {
      type: String,
      default: "DSA",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const problemListSchema = new Schema<IProblemList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: "bookmark",
    },
    color: {
      type: String,
      default: "#f59e0b",
    },
    questions: {
      type: [problemListItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index per user per list name
problemListSchema.index({ userId: 1, name: 1 }, { unique: true });
problemListSchema.index({ userId: 1, "questions.questionSlug": 1 });

const ProblemList = mongoose.model<IProblemList>("ProblemList", problemListSchema);

export default ProblemList;
