import mongoose, { Schema, Document, Types } from "mongoose";

export type VerificationStatus =
  | "supported"
  | "verified"
  | "contradicted"
  | "insufficient_evidence"
  | "unsupported"
  | "verification_error"
  | "pending";

export interface ISource {
  title: string;
  url: string;
  snippet: string;
  retrievedAt?: string;
  domain?: string;
}

export interface IClaim extends Document {
  runId: Types.ObjectId;
  text: string;
  evidence: string[];
  sources: ISource[];
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  reasoning: string;
  contradictions: string[];
  createdAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    title: { type: String, default: "" },
    url: { type: String, default: "" },
    snippet: { type: String, default: "" },
    retrievedAt: { type: String, default: () => new Date().toISOString() },
    domain: { type: String, default: "" },
  },
  { _id: false }
);

const claimSchema = new Schema<IClaim>({
  runId: { type: Schema.Types.ObjectId, ref: "Run", required: true, index: true },
  text: { type: String, required: true },
  evidence: [{ type: String }],
  sources: [sourceSchema],
  verificationStatus: {
    type: String,
    enum: [
      "supported",
      "verified",
      "contradicted",
      "insufficient_evidence",
      "unsupported",
      "verification_error",
      "pending",
    ],
    default: "pending",
  },
  confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
  reasoning: { type: String, default: "" },
  contradictions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const Claim = mongoose.model<IClaim>("Claim", claimSchema);
