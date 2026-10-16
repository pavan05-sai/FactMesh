import { Server as SocketServer } from "socket.io";
import { PipelineState, emitAgentStatus } from "./state";
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
  io?: SocketServer
): Promise<PipelineState> {
  let state: PipelineState = {
    topic: topic.trim(),
    claims: [],
    report: null,
    currentAgent: "",
    agentLogs: new Map(),
    runId,
    error: null,
  };

  // Mark run as running
  try {
    await Run.findByIdAndUpdate(runId, { status: "running" });
  } catch (err: any) {
    console.error(`[Pipeline Error] Failed to set run ${runId} to running:`, err.message);
  }

  for (const { name, fn } of agentSequence) {
    try {
      emitAgentStatus(io, runId, name, "thinking", `${name} agent is processing...`);

      await Run.findByIdAndUpdate(runId, {
        [`agentStates.${name}`]: {
          status: "thinking",
          log: `${name} agent started`,
          startedAt: new Date(),
        },
      });

      // Execute agent step
      const updates = await fn(state);
      state = { ...state, ...updates };

      const claimCount = state.claims.length;
      const doneLog =
        name === "research"
          ? `Extracted ${claimCount} testable claims`
          : name === "search"
          ? `Gathered evidence across ${claimCount} claims`
          : name === "verification"
          ? `Evaluated verdicts for ${claimCount} claims`
          : name === "hallucination"
          ? `Audited contradictions and evidence alignment`
          : name === "confidence"
          ? `Computed calibrated confidence scores`
          : `Synthesized final research report`;

      emitAgentStatus(io, runId, name, "done", doneLog);

      await Run.findByIdAndUpdate(runId, {
        [`agentStates.${name}`]: {
          status: "done",
          log: doneLog,
          completedAt: new Date(),
        },
      });
    } catch (err: any) {
      const errorMsg = err?.message || String(err) || "Unknown agent execution error";
      console.error(`[Pipeline Error in ${name}]`, errorMsg);

      emitAgentStatus(io, runId, name, "error", errorMsg);

      try {
        await Run.findByIdAndUpdate(runId, {
          [`agentStates.${name}`]: {
            status: "error",
            log: errorMsg,
            completedAt: new Date(),
          },
          status: "failed",
          error: `Pipeline halted at '${name}' stage: ${errorMsg}`,
        });
      } catch (dbErr: any) {
        console.error(`[Pipeline DB Error] Failed to update failed run status:`, dbErr.message);
      }

      state.error = errorMsg;
      if (io) {
        io.to(`run:${runId}`).emit("run:error", { error: errorMsg, agent: name });
      }
      return state;
    }
  }

  // Persist claims and report safely
  try {
    if (state.claims.length === 0) {
      throw new Error("Pipeline completed without extracting any claims.");
    }

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

    let savedReport = null;
    if (state.report) {
      savedReport = await Report.create({
        runId,
        executiveSummary: state.report.executiveSummary,
        verifiedClaims: state.report.verifiedClaims,
        unsupportedClaims: state.report.unsupportedClaims,
        contradictions: state.report.contradictions,
        confidenceTable: state.report.confidenceTable,
        references: state.report.references,
      });
    }

    await Run.findByIdAndUpdate(runId, {
      status: "completed",
      claims: savedClaims.map((c) => c._id),
      report: savedReport?._id,
      completedAt: new Date(),
    });

    if (io) {
      io.to(`run:${runId}`).emit("run:complete", { runId });
    }
  } catch (persistErr: any) {
    const errorMsg = `Persistence error: ${persistErr.message}`;
    console.error(`[Pipeline Persistence Error]`, errorMsg);

    await Run.findByIdAndUpdate(runId, {
      status: "failed",
      error: errorMsg,
    });

    state.error = errorMsg;
    if (io) {
      io.to(`run:${runId}`).emit("run:error", { error: errorMsg, agent: "persistence" });
    }
  }

  return state;
}
