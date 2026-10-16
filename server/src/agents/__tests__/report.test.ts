import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { reportAgent } from "../reportAgent";
import { PipelineState } from "../state";
import { env } from "../../config/env";

describe("Report Agent & Consistency", () => {
  let origOpenAiKey: string;
  let origOpenRouterKey: string;

  beforeEach(() => {
    origOpenAiKey = env.openaiApiKey;
    origOpenRouterKey = env.openRouterApiKey;
    env.openaiApiKey = "";
    env.openRouterApiKey = "";
  });

  afterEach(() => {
    env.openaiApiKey = origOpenAiKey;
    env.openRouterApiKey = origOpenRouterKey;
  });
  it("strictly separates verified, unsupported, and contradicted claims into report sections", async () => {
    const state: PipelineState = {
      topic: "Artemis 1 Mission Overview",
      claims: [
        {
          text: "Claim 1: NASA launched Artemis 1 on November 16, 2022.",
          evidence: ["NASA official record confirms November 16, 2022 launch date."],
          sources: [{ title: "NASA", url: "https://nasa.gov/artemis1", snippet: "Launch date Nov 16" }],
          verificationStatus: "supported",
          confidenceScore: 85,
          reasoning: "Corroborated by NASA",
          contradictions: [],
        },
        {
          text: "Claim 2: Artemis 1 carried a crew of four astronauts.",
          evidence: ["Artemis 1 was an uncrewed flight test."],
          sources: [{ title: "ESA", url: "https://esa.int/artemis", snippet: "Uncrewed mission" }],
          verificationStatus: "contradicted",
          confidenceScore: 88,
          reasoning: "Directly refuted; Artemis 1 was uncrewed",
          contradictions: ["Mission was uncrewed"],
        },
        {
          text: "Claim 3: The mission discovered underground water on the Moon.",
          evidence: [],
          sources: [],
          verificationStatus: "insufficient_evidence",
          confidenceScore: 10,
          reasoning: "No external evidence retrieved",
          contradictions: [],
        },
      ],
      report: null,
      currentAgent: "confidence",
      agentLogs: new Map(),
      runId: "run-artemis-report",
      error: null,
    };

    const result = await reportAgent(state);
    assert(result.report !== null && result.report !== undefined);
    const report = result.report!;

    // Invariant: Claim 1 is ONLY in verifiedClaims
    assert.equal(report.verifiedClaims.length, 1);
    assert.equal(report.verifiedClaims[0], state.claims[0].text);

    // Invariant: Claim 2 is in contradictions
    assert(report.contradictions.length >= 1);

    // Invariant: Claim 3 is in unsupportedClaims (never upgraded)
    assert.equal(report.unsupportedClaims.length, 1);
    assert.equal(report.unsupportedClaims[0], state.claims[2].text);

    // Confidence table matches all 3 claims
    assert.equal(report.confidenceTable.length, 3);
    assert.equal(report.confidenceTable[0].score, 85);
    assert.equal(report.confidenceTable[2].score, 10);

    // References contains NASA and ESA URLs
    assert(report.references.includes("https://nasa.gov/artemis1"));
    assert(report.references.includes("https://esa.int/artemis"));
  });

  it("explicitly discloses when no claims could be conclusively verified", async () => {
    const unverifiedState: PipelineState = {
      topic: "Obscure Unverified Conspiracy Hypothesis",
      claims: [
        {
          text: "Secret subterranean base discovered in Antarctica.",
          evidence: [],
          sources: [],
          verificationStatus: "insufficient_evidence",
          confidenceScore: 10,
          reasoning: "No evidence found",
          contradictions: [],
        },
      ],
      report: null,
      currentAgent: "confidence",
      agentLogs: new Map(),
      runId: "run-unverified-test",
      error: null,
    };

    const result = await reportAgent(unverifiedState);
    assert(result.report !== null);
    const report = result.report!;

    assert.equal(report.verifiedClaims.length, 0);
    assert.equal(report.unsupportedClaims.length, 1);
    assert(
      report.executiveSummary.toLowerCase().includes("no claims could be") ||
      report.executiveSummary.toLowerCase().includes("0 supported") ||
      report.executiveSummary.toLowerCase().includes("insufficient evidence")
    );
  });
});
