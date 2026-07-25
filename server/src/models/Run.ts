import mongoose, { Schema, Document, Types } from "mongoose";

export type AgentStatus = "pending" | "thinking" | "done" | "error";
export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface IAgentState {
  status: AgentStatus;
  log: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IRun extends Document {
  userId: Types.ObjectId;
  topic: string;
  status: RunStatus;
  agentStates: Map<string, IAgentState>;
  claims: Types.ObjectId[];
  report?: Types.ObjectId;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const agentStateSchema = new Schema<IAgentState>(
  {
    status: {
      type: String,
      enum: ["pending", "thinking", "done", "error"],
      default: "pending",
    },
    log: { type: String, default: "" },
    startedAt: Date,
    completedAt: Date,
  },
  { _id: false }
);

const runSchema = new Schema<IRun>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["pending", "running", "completed", "failed"],
    default: "pending",
  },
  agentStates: {
    type: Map,
    of: agentStateSchema,
    default: () =>
      new Map([
        ["research", { status: "pending", log: "" }],
        ["search", { status: "pending", log: "" }],
        ["verification", { status: "pending", log: "" }],
        ["hallucination", { status: "pending", log: "" }],
        ["confidence", { status: "pending", log: "" }],
        ["report", { status: "pending", log: "" }],
      ]),
  },
  claims: [{ type: Schema.Types.ObjectId, ref: "Claim" }],
  report: { type: Schema.Types.ObjectId, ref: "Report" },
  error: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export const Run = mongoose.model<IRun>("Run", runSchema);
