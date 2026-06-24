import mongoose, { Schema, Document, Model } from "mongoose";
import { GENRES, type Genre } from "./StudyList.types";
export { GENRES, type Genre } from "./StudyList.types";

export interface IStudyList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  genre?: Genre;
  termsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudyListSchema = new Schema<IStudyList>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    genre: { type: String, enum: GENRES },
    termsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const StudyList: Model<IStudyList> =
  (mongoose.models["StudyList"] as Model<IStudyList>) ||
  mongoose.model<IStudyList>("StudyList", StudyListSchema);

export default StudyList;
