import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConfidenceEntry {
  claimText: string;
  score: number;
  factors: string;
}

export interface IReport extends Document {
  runId: Types.ObjectId;
  executiveSummary: string;
  verifiedClaims: string[];
  unsupportedClaims: string[];
  contradictions: string[];
  confidenceTable: IConfidenceEntry[];
  references: string[];
  generatedAt: Date;
}

const confidenceEntrySchema = new Schema<IConfidenceEntry>(
  {
    claimText: { type: String, required: true },
    score: { type: Number, required: true },
    factors: { type: String, default: "" },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>({
  runId: {
    type: Schema.Types.ObjectId,
    ref: "Run",
    required: true,
    unique: true,
    index: true,
  },
  executiveSummary: { type: String, default: "" },
  verifiedClaims: [{ type: String }],
  unsupportedClaims: [{ type: String }],
  contradictions: [{ type: String }],
  confidenceTable: [confidenceEntrySchema],
  references: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model<IReport>("Report", reportSchema);
