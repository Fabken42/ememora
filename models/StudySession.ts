import mongoose, { Schema, Document, Model } from "mongoose";

export type StudyMode = "flashcards" | "quiz";

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  studyListId?: mongoose.Types.ObjectId;
  mode: StudyMode;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  durationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    studyListId: { type: Schema.Types.ObjectId, ref: "StudyList" },
    mode: { type: String, enum: ["flashcards", "quiz"], required: true },
    total: { type: Number, required: true, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    incorrect: { type: Number, default: 0, min: 0 },
    skipped: { type: Number, default: 0, min: 0 },
    durationMs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, createdAt: -1 });

const StudySession: Model<IStudySession> =
  (mongoose.models["StudySession"] as Model<IStudySession>) ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
