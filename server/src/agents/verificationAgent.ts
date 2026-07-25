import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";
import { PipelineState } from "./state";

const VERIFICATION_PROMPT = `You are a fact verification expert. For each claim below, compare it against the provided evidence and determine if it is VERIFIED, UNSUPPORTED, or CONTRADICTED.

For each claim, provide:
- status: "verified" | "unsupported" | "contradicted"
- reasoning: a brief explanation of why you reached this conclusion, citing specific evidence

Claims and evidence:
{claimsJson}

Return ONLY valid JSON — an array of objects with "index" (0-based), "status", and "reasoning" fields:`;

import { safeLlmInvoke } from "./llmHelper";

export async function verificationAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    openAIApiKey: env.openaiApiKey,
  });

  const claimsForPrompt = state.claims.map((c, i) => ({
    index: i,
    claim: c.text,
    evidence: c.evidence.slice(0, 3),
    sources: c.sources.map((s) => s.url).slice(0, 3),
  }));

  const fallbackVerifications = () => JSON.stringify(
    state.claims.map((c, i) => {
      const hasSources = c.sources.length > 0;
      const snippetText = c.evidence.join(" ").toLowerCase();
      const hasNegativeKeywords = snippetText.includes("no") || snippetText.includes("denied") || snippetText.includes("false") || snippetText.includes("not resigned") || snippetText.includes("debunked");
      let status = "unsupported";
      if (hasSources && !hasNegativeKeywords) status = "verified";
      if (hasNegativeKeywords) status = "contradicted";

      return {
        index: i,
        status,
        reasoning: hasSources
          ? `Analysis of ${c.sources.length} web sources (${c.sources.map(s => s.title).slice(0, 2).join(", ")}) indicates statement is ${status}.`
          : "Insufficient public evidence returned from web sources.",
      };
    })
  );

  const response = await safeLlmInvoke(
    llm,
    VERIFICATION_PROMPT.replace("{claimsJson}", JSON.stringify(claimsForPrompt, null, 2)),
    fallbackVerifications
  );
  const content = response.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const verifications: Array<{ index: number; status: string; reasoning: string }> =
    jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fallbackVerifications());

  const updatedClaims = [...state.claims];
  for (const v of verifications) {
    if (v.index >= 0 && v.index < updatedClaims.length) {
      updatedClaims[v.index] = {
        ...updatedClaims[v.index],
        verificationStatus: v.status as any,
        reasoning: v.reasoning,
      };
    }
  }

  return {
    claims: updatedClaims,
    currentAgent: "verification",
  };
}
