import { createLlmModel } from "./llmProvider";
import { invokeLlm } from "./llmHelper";
import { PipelineState, PipelineReport } from "./state";
import { calculateDeterministicConfidence } from "./confidenceAgent";

const REPORT_SUMMARY_PROMPT = `You are a research synthesis compiler.
Given the verified, contradicted, and insufficient evidence claims below, generate an objective, concise 2-paragraph executive summary.

STRICT CONSTRAINTS:
- Be strictly faithful to the verified findings.
- NEVER present an unsupported or insufficient-evidence claim as a proven fact.
- Explicitly disclose any limitations, conflicting accounts, or lack of credible sources.
- Do NOT include markdown code fences or headers; output only the executive summary text.

Topic: {topic}
Verified Claims:
{verified}

Contradicted Claims / Conflicts:
{contradicted}

Insufficient Evidence / Unresolved Claims:
{unsupported}

Executive Summary:`;

export async function reportAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const claims = state.claims || [];

  // Deterministically categorize claims to prevent LLM categorization drift
  const verified = claims
    .filter((c) => c.verificationStatus === "supported" || c.verificationStatus === "verified")
    .map((c) => c.text);

  const contradicted = claims
    .filter((c) => c.verificationStatus === "contradicted")
    .map((c) => c.text);

  const unsupported = claims
    .filter((c) => c.verificationStatus === "insufficient_evidence" || c.verificationStatus === "unsupported" || c.verificationStatus === "verification_error")
    .map((c) => c.text);

  const allContradictionNotes = Array.from(
    new Set(claims.flatMap((c) => c.contradictions || []).filter((s) => s.trim().length > 0))
  );

  const allReferences = Array.from(
    new Set(claims.flatMap((c) => c.sources.map((s) => s.url)).filter((u) => u && u.startsWith("http")))
  );

  const confidenceTable = claims.map((c) => {
    const det = calculateDeterministicConfidence(c);
    return {
      claimText: c.text,
      score: c.confidenceScore,
      factors: det.factors,
    };
  });

  // Default deterministic summary
  let executiveSummary = `FactMesh synthesized research report for topic: "${state.topic}". ` +
    `Evaluated ${claims.length} discrete factual statements against external web evidence. ` +
    `Found ${verified.length} supported assertion(s), ${contradicted.length} contradicted claim(s), and ${unsupported.length} statement(s) with insufficient evidence.`;

  if (verified.length === 0 && claims.length > 0) {
    executiveSummary += ` Note: No claims could be conclusively confirmed by external authoritative sources during this evaluation.`;
  }

  // Attempt to generate a polished executive summary via LLM
  try {
    const prompt = REPORT_SUMMARY_PROMPT
      .replace("{topic}", state.topic)
      .replace("{verified}", verified.length > 0 ? verified.map((t) => `- ${t}`).join("\n") : "(None)")
      .replace("{contradicted}", contradicted.length > 0 ? contradicted.map((t) => `- ${t}`).join("\n") : "(None)")
      .replace("{unsupported}", unsupported.length > 0 ? unsupported.map((t) => `- ${t}`).join("\n") : "(None)");

    const llm = createLlmModel({ temperature: 0.2 });
    const response = await invokeLlm(llm, prompt);
    if (response && response.trim().length > 30) {
      // Strip any accidental markdown formatting or JSON wrappers
      executiveSummary = response.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
    }
  } catch (err: any) {
    console.warn(`[Report Agent Warning] LLM executive summary generation skipped: ${err.message}. Using deterministic synthesis.`);
  }

  const report: PipelineReport = {
    executiveSummary,
    verifiedClaims: verified,
    unsupportedClaims: unsupported,
    contradictions: allContradictionNotes.length > 0 ? allContradictionNotes : contradicted,
    confidenceTable,
    references: allReferences,
  };

  return {
    report,
    currentAgent: "report",
  };
}
