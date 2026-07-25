import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";
import { PipelineState } from "./state";

const CONFIDENCE_PROMPT = `You are a confidence scoring expert. For each claim, calculate a confidence score from 0 to 100 based on:

1. Number of independent sources (more sources = higher confidence)
2. Source authority (well-known, reputable sources score higher)
3. Consistency across sources (agreement between sources boosts score)
4. Evidence quality (specific, detailed evidence scores higher than vague statements)

Claims data:
{claimsJson}

Return ONLY valid JSON — an array of objects with:
- "index" (0-based claim index)
- "score" (integer 0-100)
- "factors" (brief string explaining the score)`;

import { safeLlmInvoke } from "./llmHelper";

export async function confidenceAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    openAIApiKey: env.openaiApiKey,
  });

  const claimsForPrompt = state.claims.map((c, i) => ({
    index: i,
    claim: c.text,
    status: c.verificationStatus,
    evidence: c.evidence,
    sources: c.sources.map((s) => ({ title: s.title, url: s.url })),
    contradictions: c.contradictions,
  }));

  const fallbackScores = () => JSON.stringify(
    state.claims.map((c, i) => {
      let score = 50;
      if (c.verificationStatus === "verified") score = 85 + Math.min(15, c.sources.length * 3);
      else if (c.verificationStatus === "contradicted") score = 25;
      else if (c.verificationStatus === "unsupported") score = 35;

      return {
        index: i,
        score,
        factors: `${c.sources.length} sources analyzed. Verification status: ${c.verificationStatus}.`,
      };
    })
  );

  const response = await safeLlmInvoke(
    llm,
    CONFIDENCE_PROMPT.replace("{claimsJson}", JSON.stringify(claimsForPrompt, null, 2)),
    fallbackScores
  );
  const content = response.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const scores: Array<{ index: number; score: number; factors: string }> =
    jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fallbackScores());

  const updatedClaims = [...state.claims];
  for (const s of scores) {
    if (s.index >= 0 && s.index < updatedClaims.length) {
      updatedClaims[s.index] = {
        ...updatedClaims[s.index],
        confidenceScore: Math.min(100, Math.max(0, s.score)),
      };
    }
  }

  return {
    claims: updatedClaims,
    currentAgent: "confidence",
  };
}
