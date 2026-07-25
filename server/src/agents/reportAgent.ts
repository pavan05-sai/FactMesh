import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";
import { PipelineState, PipelineReport } from "./state";

const REPORT_PROMPT = `You are a research report compiler. Using the analyzed claims below, create a structured fact-verification report.

Claims data:
{claimsJson}

Topic: {topic}

Generate a report with these sections:
1. executiveSummary — 2-3 paragraph overview of findings
2. verifiedClaims — array of claim texts that were verified
3. unsupportedClaims — array of claim texts that were unsupported
4. contradictions — array of contradiction descriptions
5. confidenceTable — array of objects with claimText, score, factors
6. references — array of all unique source URLs cited

Return ONLY valid JSON matching this structure:
{
  "executiveSummary": "...",
  "verifiedClaims": ["..."],
  "unsupportedClaims": ["..."],
  "contradictions": ["..."],
  "confidenceTable": [{"claimText": "...", "score": 0, "factors": "..."}],
  "references": ["..."]
}`;

import { safeLlmInvoke } from "./llmHelper";

export async function reportAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    openAIApiKey: env.openaiApiKey,
  });

  const claimsForPrompt = state.claims.map((c) => ({
    claim: c.text,
    status: c.verificationStatus,
    confidence: c.confidenceScore,
    reasoning: c.reasoning,
    contradictions: c.contradictions,
    sources: c.sources.map((s) => s.url),
  }));

  const fallbackReport = () => {
    const verified = state.claims.filter((c) => c.verificationStatus === "verified").map((c) => c.text);
    const unsupported = state.claims.filter((c) => c.verificationStatus === "unsupported").map((c) => c.text);
    const contradicted = state.claims.filter((c) => c.verificationStatus === "contradicted").map((c) => c.text);
    const allSources = Array.from(new Set(state.claims.flatMap((c) => c.sources.map((s) => s.url))));

    return JSON.stringify({
      executiveSummary: `FactMesh automated research synthesis for topic: "${state.topic}". Analyzed ${state.claims.length} claims against live web sources. Found ${verified.length} verified statements, ${unsupported.length} unsupported claims, and ${contradicted.length} contradicted claims.`,
      verifiedClaims: verified,
      unsupportedClaims: unsupported,
      contradictions: contradicted,
      confidenceTable: state.claims.map((c) => ({
        claimText: c.text,
        score: c.confidenceScore,
        factors: `Verified status: ${c.verificationStatus} with ${c.sources.length} sources.`,
      })),
      references: allSources,
    });
  };

  const prompt = REPORT_PROMPT
    .replace("{claimsJson}", JSON.stringify(claimsForPrompt, null, 2))
    .replace("{topic}", state.topic);

  const response = await safeLlmInvoke(llm, prompt, fallbackReport);
  const content = response.content;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const report: PipelineReport = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fallbackReport());

  return {
    report,
    currentAgent: "report",
  };
}
