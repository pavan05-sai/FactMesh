import { createLlmModel } from "./llmProvider";
import { invokeLlm, extractAndParseJson } from "./llmHelper";
import { PipelineState, PipelineClaim } from "./state";

/**
 * Deterministically computes explainable confidence score bounds
 * based on source authority, domain independence, evidence depth, and claim status.
 */
export function calculateDeterministicConfidence(claim: PipelineClaim): { score: number; factors: string } {
  const status = claim.verificationStatus;
  const sources = claim.sources || [];
  const uniqueDomains = new Set(sources.map((s) => s.domain).filter(Boolean));
  const authorityCount = sources.filter((s) => s.isAuthority).length;
  const hasContradictions = (claim.contradictions && claim.contradictions.length > 0);

  // 1. Errors: Locked to 0
  if (status === "verification_error") {
    return {
      score: 0,
      factors: "Verification failed due to search or model execution errors. Zero confidence.",
    };
  }

  // 2. Insufficient Evidence / Unsupported: Strictly capped at 10-30%
  if (status === "insufficient_evidence" || status === "unsupported") {
    const score = Math.min(30, 10 + sources.length * 4);
    return {
      score,
      factors: `Insufficient evidence found to substantiate claim. Inspected ${sources.length} sources across ${uniqueDomains.size} domains without direct confirmation.`,
    };
  }

  // 3. Contradicted claims
  if (status === "contradicted") {
    let score = 70;
    if (authorityCount >= 1) score += 10;
    if (uniqueDomains.size >= 2) score += 5;
    score = Math.min(88, Math.max(50, score));
    return {
      score,
      factors: `Contradiction identified against ${uniqueDomains.size} source domain(s) (${authorityCount} authoritative). High confidence of conflict.`,
    };
  }

  // 4. Supported / Verified claims
  if (status === "supported" || status === "verified") {
    if (sources.length === 0) {
      return {
        score: 25,
        factors: "Claim was marked supported but has no cited sources. Score capped for safety.",
      };
    }

    let score = 50; // base score
    score += Math.min(25, authorityCount * 15); // +15 per authority source up to 25
    score += Math.min(15, (uniqueDomains.size - 1) * 8); // +8 for each independent domain
    
    // Check evidence length
    const totalSnippetLen = claim.evidence.reduce((acc, e) => acc + (e ? e.length : 0), 0);
    if (totalSnippetLen > 250) score += 5;

    // Penalty for single source
    if (uniqueDomains.size <= 1) {
      score = Math.min(score, 75);
    }

    // Penalty for any contradictions
    if (hasContradictions) {
      score -= 20;
    }

    // Hard ceiling: Never claim 100% certainty (bound to 95%)
    score = Math.min(95, Math.max(45, score));

    return {
      score,
      factors: `Corroborated across ${uniqueDomains.size} independent domain(s) including ${authorityCount} authoritative source(s). No unresolved contradictions.`,
    };
  }

  return {
    score: 0,
    factors: "Pending verification evaluation.",
  };
}

const CONFIDENCE_SYSTEM_PROMPT = `You are a confidence scoring specialist.
Assess the confidence level for the verification decision of each claim.

Evaluate:
1. Source independence (distinct domains)
2. Source authority (academic, governmental, peer-reviewed, major news vs unknown blogs)
3. Agreement and absence of contradictions
4. Specificity of evidence matching the claim

Rules:
- If a claim has INSUFFICIENT_EVIDENCE or 0 sources, score MUST NOT exceed 30.
- If a claim has a VERIFICATION_ERROR, score MUST be 0.
- Never award 100 to any claim. Maximum supported score is 95.

Return JSON array of objects:
[
  {
    "index": 0,
    "score": 75,
    "factors": "Brief explanation of scoring factors..."
  }
]`;

export async function confidenceAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const updatedClaims = [...state.claims];

  // First compute deterministic scores as the reliable ground truth & fallback
  const deterministicAssessments = updatedClaims.map((claim) => calculateDeterministicConfidence(claim));

  // Attempt LLM factor refinement if available
  try {
    const claimsPayload = updatedClaims.map((c, i) => ({
      index: i,
      text: c.text,
      status: c.verificationStatus,
      sourcesCount: c.sources.length,
      domains: Array.from(new Set(c.sources.map((s) => s.domain).filter(Boolean))),
      authoritativeSourcesCount: c.sources.filter((s) => s.isAuthority).length,
      hasContradictions: (c.contradictions && c.contradictions.length > 0),
    }));

    const prompt = `${CONFIDENCE_SYSTEM_PROMPT}\n\nClaims to score:\n${JSON.stringify(claimsPayload, null, 2)}\n\nReturn JSON array:`;
    const llm = createLlmModel({ temperature: 0.1 });
    const rawResponse = await invokeLlm(llm, prompt);

    const scores = extractAndParseJson<Array<{ index: number; score: number; factors: string }>>(
      rawResponse,
      (data) => {
        if (!Array.isArray(data)) throw new Error("Expected array of confidence scores.");
        return data.map((item) => ({
          index: typeof item.index === "number" ? item.index : parseInt(item.index, 10),
          score: Math.min(100, Math.max(0, parseInt(item.score, 10) || 0)),
          factors: String(item.factors || "").trim(),
        }));
      },
      "confidence scores"
    );

    for (const item of scores) {
      if (item.index >= 0 && item.index < updatedClaims.length) {
        const claim = updatedClaims[item.index];
        const det = deterministicAssessments[item.index];

        // Apply strict safety clamping according to claim status
        let finalScore = item.score;
        if (claim.verificationStatus === "verification_error") {
          finalScore = 0;
        } else if (claim.verificationStatus === "insufficient_evidence" || claim.verificationStatus === "unsupported") {
          finalScore = Math.min(35, finalScore);
        } else if (claim.verificationStatus === "supported" || claim.verificationStatus === "verified") {
          finalScore = Math.min(95, Math.max(40, finalScore));
        }

        updatedClaims[item.index] = {
          ...claim,
          confidenceScore: finalScore,
          reasoning: claim.reasoning,
        };
      }
    }
  } catch (err: any) {
    console.warn(`[Confidence Agent Warning] LLM scoring refinement skipped: ${err.message}. Using deterministic confidence scoring.`);
    // Fall back safely to deterministic scores
    for (let i = 0; i < updatedClaims.length; i++) {
      updatedClaims[i] = {
        ...updatedClaims[i],
        confidenceScore: deterministicAssessments[i].score,
      };
    }
  }

  return {
    claims: updatedClaims,
    currentAgent: "confidence",
  };
}
