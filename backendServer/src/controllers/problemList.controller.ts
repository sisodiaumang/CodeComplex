import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import ProblemList from "../models/problemList.model.js";
import Submission from "../models/submission.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper to get or create default Favorites list
async function getOrCreateDefaultFavoritesList(userId: any) {
  let list = await ProblemList.findOne({ userId, isDefault: true });
  if (!list) {
    list = await ProblemList.create({
      userId,
      name: "Favorites",
      description: "My favorite problems",
      isDefault: true,
      icon: "star",
      color: "#f59e0b",
      questions: [],
    });
  }
  return list;
}

// ─────────────────────────────────────────────
// GET /api/v1/problem-lists/user-status
// Returns solved questions + user's lists and slugs
// ─────────────────────────────────────────────
export const getUserProblemStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }

    // Ensure default favorites list exists
    await getOrCreateDefaultFavoritesList(userId);

    // Fetch user lists
    const lists = await ProblemList.find({ userId })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    // Fetch solved question slugs
    const solvedSlugs = await Submission.distinct("questionSlug", {
      userId,
      $or: [{ status: "ACCEPTED" }, { judgeResult: "ACCEPTED" }],
    });

    const formattedLists = lists.map((l: any) => ({
      _id: l._id,
      name: l.name,
      description: l.description,
      isDefault: l.isDefault,
      icon: l.icon || "bookmark",
      color: l.color || "#f59e0b",
      count: (l.questions || []).length,
      slugs: (l.questions || []).map((q: any) => q.questionSlug),
    }));

    res.status(200).json({
      success: true,
      data: {
        solvedSlugs,
        solvedCount: solvedSlugs.length,
        lists: formattedLists,
      },
    });
  }
);

// ─────────────────────────────────────────────
// GET /api/v1/problem-lists
// ─────────────────────────────────────────────
export const getProblemLists = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }

    await getOrCreateDefaultFavoritesList(userId);

    const lists = await ProblemList.find({ userId })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: lists,
    });
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/problem-lists
// Create custom list
// ─────────────────────────────────────────────
export const createProblemList = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { name, description = "", icon = "bookmark", color = "#f59e0b" } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "List name is required");
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 60) {
      throw new ApiError(400, "List name cannot exceed 60 characters");
    }

    const existing = await ProblemList.findOne({
      userId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      throw new ApiError(409, `A list named "${trimmedName}" already exists`);
    }

    const newList = await ProblemList.create({
      userId,
      name: trimmedName,
      description: String(description || "").trim().slice(0, 300),
      isDefault: false,
      icon,
      color,
      questions: [],
    });

    res.status(201).json({
      success: true,
      message: "List created successfully",
      data: newList,
    });
  }
);

// ─────────────────────────────────────────────
// DELETE /api/v1/problem-lists/:listId
// ─────────────────────────────────────────────
export const deleteProblemList = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const listId = String(req.params.listId);

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await ProblemList.findOne({ _id: listId, userId });
    if (!list) {
      throw new ApiError(404, "List not found");
    }

    if (list.isDefault) {
      throw new ApiError(400, "Default list cannot be deleted");
    }

    await ProblemList.deleteOne({ _id: listId });

    res.status(200).json({
      success: true,
      message: "List deleted successfully",
    });
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/problem-lists/:listId/toggle
// Add or remove problem from custom list
// ─────────────────────────────────────────────
export const toggleQuestionInList = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const listId = String(req.params.listId);
    const { questionSlug, title = "", difficulty = "Medium", mode = "DSA" } = req.body;

    if (!questionSlug || typeof questionSlug !== "string") {
      throw new ApiError(400, "questionSlug is required");
    }

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await ProblemList.findOne({ _id: listId, userId });
    if (!list) {
      throw new ApiError(404, "List not found");
    }

    const slug = questionSlug.trim();
    const existingIndex = list.questions.findIndex((q) => q.questionSlug === slug);

    let isAdded = false;
    if (existingIndex >= 0) {
      // Remove
      list.questions.splice(existingIndex, 1);
      isAdded = false;
    } else {
      // Add
      list.questions.push({
        questionSlug: slug,
        title: title || slug,
        difficulty,
        mode,
        addedAt: new Date(),
      });
      isAdded = true;
    }

    await list.save();

    res.status(200).json({
      success: true,
      data: {
        listId: list._id,
        name: list.name,
        questionSlug: slug,
        isAdded,
        count: list.questions.length,
        slugs: list.questions.map((q) => q.questionSlug),
      },
    });
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/problem-lists/favorite/toggle
// Quick toggle into Favorites list
// ─────────────────────────────────────────────
export const toggleFavorite = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { questionSlug, title = "", difficulty = "Medium", mode = "DSA" } = req.body;

    if (!questionSlug || typeof questionSlug !== "string") {
      throw new ApiError(400, "questionSlug is required");
    }

    const list = await getOrCreateDefaultFavoritesList(userId);
    const slug = questionSlug.trim();
    const existingIndex = list.questions.findIndex((q) => q.questionSlug === slug);

    let isFavorite = false;
    if (existingIndex >= 0) {
      list.questions.splice(existingIndex, 1);
      isFavorite = false;
    } else {
      list.questions.push({
        questionSlug: slug,
        title: title || slug,
        difficulty,
        mode,
        addedAt: new Date(),
      });
      isFavorite = true;
    }

    await list.save();

    res.status(200).json({
      success: true,
      data: {
        questionSlug: slug,
        isFavorite,
        count: list.questions.length,
        slugs: list.questions.map((q) => q.questionSlug),
      },
    });
  }
);
