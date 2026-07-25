import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";
import { PipelineState } from "./state";

const HALLUCINATION_PROMPT = `You are a hallucination detection expert. Review the following verified/unverified claims and their evidence.

Your tasks:
1. Flag any claims that are UNSUPPORTED — they have no credible evidence backing them.
2. Detect CONTRADICTIONS — where different sources disagree with each other, or where claims contradict one another.

Claims data:
{claimsJson}

Return ONLY valid JSON — an array of objects with:
- "index" (0-based claim index)
- "isUnsupported" (boolean)
- "contradictions" (array of strings describing any contradictions found — empty array if none)`;

import { safeLlmInvoke } from "./llmHelper";

export async function hallucinationAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    openAIApiKey: env.openaiApiKey,
  });

  const claimsForPrompt = state.claims.map((c, i) => ({
    index: i,
    claim: c.text,
    status: c.verificationStatus,
    evidence: c.evidence.slice(0, 3),
    reasoning: c.reasoning,
  }));

  const fallbackFlags = () => JSON.stringify(
    state.claims.map((c, i) => ({
      index: i,
      isUnsupported: c.verificationStatus === "unsupported" || c.sources.length === 0,
      contradictions: c.verificationStatus === "contradicted" ? ["Sources present conflicting accounts regarding this statement."] : [],
    }))
  );

  const response = await safeLlmInvoke(
    llm,
    HALLUCINATION_PROMPT.replace("{claimsJson}", JSON.stringify(claimsForPrompt, null, 2)),
    fallbackFlags
  );
  const content = response.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const flags: Array<{ index: number; isUnsupported: boolean; contradictions: string[] }> =
    jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fallbackFlags());

  const updatedClaims = [...state.claims];
  for (const flag of flags) {
    if (flag.index >= 0 && flag.index < updatedClaims.length) {
      const claim = updatedClaims[flag.index];
      if (flag.contradictions.length > 0) {
        updatedClaims[flag.index] = {
          ...claim,
          verificationStatus: "contradicted",
          contradictions: flag.contradictions,
        };
      } else if (flag.isUnsupported && claim.verificationStatus !== "verified") {
        updatedClaims[flag.index] = {
          ...claim,
          verificationStatus: "unsupported",
        };
      }
    }
  }

  return {
    claims: updatedClaims,
    currentAgent: "hallucination",
  };
}
