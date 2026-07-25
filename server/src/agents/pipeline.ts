import { Server as SocketServer } from "socket.io";
import { PipelineState, emitAgentStatus, AGENT_NAMES } from "./state";
import { researchAgent } from "./researchAgent";
import { searchAgent } from "./searchAgent";
import { verificationAgent } from "./verificationAgent";
import { hallucinationAgent } from "./hallucinationAgent";
import { confidenceAgent } from "./confidenceAgent";
import { reportAgent } from "./reportAgent";
import { Run } from "../models/Run";
import { Claim } from "../models/Claim";
import { Report } from "../models/Report";

type AgentFn = (state: PipelineState) => Promise<Partial<PipelineState>>;

// Sequential pipeline — each agent runs in order, updating shared state.
// We don't use the LangGraph StateGraph class directly because the @langchain/langgraph
// Annotation.Root API has compatibility nuances with plain objects. Instead, we
// implement the same linear state-graph pattern manually, which is clearer for this
// sequential (non-branching) pipeline and gives us direct control over Socket.IO emissions.

const agentSequence: Array<{ name: string; fn: AgentFn }> = [
  { name: "research", fn: researchAgent },
  { name: "search", fn: searchAgent },
  { name: "verification", fn: verificationAgent },
  { name: "hallucination", fn: hallucinationAgent },
  { name: "confidence", fn: confidenceAgent },
  { name: "report", fn: reportAgent },
];

export async function runPipeline(
  topic: string,
  runId: string,
  io: SocketServer
): Promise<PipelineState> {
  let state: PipelineState = {
    topic,
    claims: [],
    report: null,
    currentAgent: "",
    agentLogs: new Map(),
    runId,
    error: null,
  };

  // Mark run as running
  await Run.findByIdAndUpdate(runId, { status: "running" });

  for (const { name, fn } of agentSequence) {
    try {
      // Emit "thinking" status
      emitAgentStatus(io, runId, name, "thinking", `${name} agent is working...`);

      await Run.findByIdAndUpdate(runId, {
        [`agentStates.${name}`]: {
          status: "thinking",
          log: `${name} agent started`,
          startedAt: new Date(),
        },
      });

      // Run the agent
      const updates = await fn(state);
      state = { ...state, ...updates };

      // Emit "done" status
      const claimCount = state.claims.length;
      const doneLog = name === "research"
        ? `Extracted ${claimCount} claims`
        : name === "search"
          ? `Collected evidence for ${claimCount} claims`
          : name === "report"
            ? "Report compiled"
            : `Processed ${claimCount} claims`;

      emitAgentStatus(io, runId, name, "done", doneLog);

      await Run.findByIdAndUpdate(runId, {
        [`agentStates.${name}`]: {
          status: "done",
          log: doneLog,
          completedAt: new Date(),
        },
      });
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      emitAgentStatus(io, runId, name, "error", errorMsg);

      await Run.findByIdAndUpdate(runId, {
        [`agentStates.${name}`]: {
          status: "error",
          log: errorMsg,
        },
        status: "failed",
        error: `${name}: ${errorMsg}`,
      });

      state.error = errorMsg;
      io.to(`run:${runId}`).emit("run:error", { error: errorMsg, agent: name });
      return state;
    }
  }

  // Persist claims to MongoDB
  const savedClaims = await Claim.insertMany(
    state.claims.map((c) => ({
      runId,
      text: c.text,
      evidence: c.evidence,
      sources: c.sources,
      verificationStatus: c.verificationStatus,
      confidenceScore: c.confidenceScore,
      reasoning: c.reasoning,
      contradictions: c.contradictions,
    }))
  );

  // Persist report
  let savedReport = null;
  if (state.report) {
    savedReport = await Report.create({
      runId,
      ...state.report,
    });
  }

  // Update run with claim/report references
  await Run.findByIdAndUpdate(runId, {
    status: "completed",
    claims: savedClaims.map((c) => c._id),
    report: savedReport?._id,
    completedAt: new Date(),
  });

  io.to(`run:${runId}`).emit("run:complete", { runId });

  return state;
}
