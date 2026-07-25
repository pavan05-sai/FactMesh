import { Server as SocketServer } from "socket.io";

// Shared state shape flowing through the LangGraph pipeline
export interface PipelineSource {
  title: string;
  url: string;
  snippet: string;
}

export interface PipelineClaim {
  text: string;
  evidence: string[];
  sources: PipelineSource[];
  verificationStatus: "verified" | "unsupported" | "contradicted" | "pending";
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
  io: SocketServer,
  runId: string,
  agentName: string,
  status: "pending" | "thinking" | "done" | "error",
  log: string
) {
  io.to(`run:${runId}`).emit("agent:status", {
    agentName,
    status,
    log,
    timestamp: new Date().toISOString(),
  });
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
