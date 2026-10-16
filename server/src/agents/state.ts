import { Server as SocketServer } from "socket.io";

export type VerificationStatus =
  | "supported"
  | "verified"
  | "contradicted"
  | "insufficient_evidence"
  | "unsupported"
  | "verification_error"
  | "pending";

export interface PipelineSource {
  title: string;
  url: string;
  snippet: string;
  retrievedAt?: string;
  domain?: string;
  isAuthority?: boolean;
}

export interface PipelineClaim {
  text: string;
  evidence: string[];
  sources: PipelineSource[];
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  reasoning: string;
  contradictions: string[];
}

export interface PipelineReport {
  executiveSummary: string;
  verifiedClaims: string[];
  unsupportedClaims: string[];
  contradictions: string[];
  confidenceTable: Array<{ claimText: string; score: number; factors: string }>;
  references: string[];
}

export interface PipelineState {
  topic: string;
  claims: PipelineClaim[];
  report: PipelineReport | null;
  currentAgent: string;
  agentLogs: Map<string, string>;
  runId: string;
  error: string | null;
}

// Utility to emit agent status updates via Socket.IO
export function emitAgentStatus(
  io: SocketServer | undefined,
  runId: string,
  agentName: string,
  status: "pending" | "thinking" | "done" | "error",
  log: string
) {
  if (!io) return;
  try {
    io.to(`run:${runId}`).emit("agent:status", {
      agentName,
      status,
      log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[Socket Emit Error] Failed to emit status for ${agentName}:`, err);
  }
}

export const AGENT_NAMES = [
  "research",
  "search",
  "verification",
  "hallucination",
  "confidence",
  "report",
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

export function normalizeStatus(
  status: string
): "supported" | "contradicted" | "insufficient_evidence" | "verification_error" | "pending" {
  const s = (status || "").toLowerCase().trim();
  if (s === "supported" || s === "verified") return "supported";
  if (s === "contradicted" || s === "refuted" || s === "false") return "contradicted";
  if (s === "insufficient_evidence" || s === "unsupported" || s === "uncertain" || s === "inconclusive") return "insufficient_evidence";
  if (s === "verification_error" || s === "error" || s === "failed") return "verification_error";
  return "pending";
}
