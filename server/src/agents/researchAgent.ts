import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";
import { PipelineState, PipelineClaim } from "./state";
import { safeLlmInvoke } from "./llmHelper";

const RESEARCH_PROMPT = `You are a research analyst. Given a topic, extract 5-10 discrete, specific, factually checkable claims about it.

Rules:
- Each claim must be a single, concrete statement that can be verified against external sources.
- Avoid vague or opinion-based statements.
- Cover different aspects of the topic.
- Return ONLY valid JSON — an array of strings, each being one claim.

Topic: {topic}

Return JSON array of claim strings:`;

export async function researchAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    openAIApiKey: env.openaiApiKey,
  });

  const fallbackClaims = () => JSON.stringify([
    `${state.topic} - Official public statements and records regarding this event.`,
    `${state.topic} - Press releases or media confirmations from credible sources.`,
    `${state.topic} - Official reports verifying current administrative or executive status.`,
    `${state.topic} - Primary source document verification regarding key figures involved.`
  ]);

  const response = await safeLlmInvoke(
    llm,
    RESEARCH_PROMPT.replace("{topic}", state.topic),
    fallbackClaims
  );
  const content = response.content;

  // Extract JSON array from response (handles markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const claimTexts: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fallbackClaims());

  const claims: PipelineClaim[] = claimTexts.map((text) => ({
    text: text.trim(),
    evidence: [],
    sources: [],
    verificationStatus: "pending",
    confidenceScore: 0,
    reasoning: "",
    contradictions: [],
  }));

  return {
    claims,
    currentAgent: "research",
  };
}
