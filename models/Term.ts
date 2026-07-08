import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITerm extends Document {
  studyListId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  concept: string;
  definition: string;
  conceptImage?: string; 
  definitionImage?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITerm>(
  {
    studyListId: { type: Schema.Types.ObjectId, ref: "StudyList", required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    concept: { type: String, required: true, trim: true, maxlength: 500 },
    definition: { type: String, required: true, trim: true, maxlength: 1000 },
    conceptImage: { type: String },
    definitionImage: { type: String },
    status: { type: Number, default: 3, min: 0, max: 6 },
  },
  { timestamps: true }
);

// Composite indices matching actual query patterns
TermSchema.index({ studyListId: 1, userId: 1, createdAt: -1 });
TermSchema.index({ studyListId: 1, userId: 1, status: 1, createdAt: -1 });

const Term: Model<ITerm> =
  mongoose.models.Term || mongoose.model<ITerm>("Term", TermSchema);

export default Term;
