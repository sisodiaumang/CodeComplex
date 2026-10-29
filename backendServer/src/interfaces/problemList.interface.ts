import { Document, Types } from "mongoose";

export interface IProblemListItem {
  questionSlug: string;
  title?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  mode?: string;
  addedAt: Date;
}

export interface IProblemList extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  isDefault: boolean;
  icon?: string;
  color?: string;
  questions: IProblemListItem[];
  createdAt: Date;
  updatedAt: Date;
}
