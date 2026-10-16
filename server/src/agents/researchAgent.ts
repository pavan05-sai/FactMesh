import { createLlmModel } from "./llmProvider";
import { invokeLlm, extractAndParseJson } from "./llmHelper";
import { PipelineState, PipelineClaim } from "./state";

const RESEARCH_SYSTEM_PROMPT = `You are a rigorous research analyst.
Given a topic or statement, deconstruct it into 3 to 8 discrete, concrete, specific, and factually testable claims.

Rules:
- Each claim must be a standalone declarative assertion that can be objectively verified or refuted with external factual evidence.
- Avoid opinions, purely subjective judgments, or broad speculation.
- Focus on key assertions of who, what, when, where, quantities, or causal relationships.
- Do NOT include any commentary, greetings, or explanations.
- Output ONLY a valid JSON array of claim strings.

Example:
["NASA launched the Artemis 1 mission on November 16, 2022.", "The Orion spacecraft traveled approximately 1.4 million miles."]`;

export async function researchAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const topic = (state.topic || "").trim();
  if (!topic) {
    throw new Error("Research topic is empty. Cannot extract claims.");
  }

  const llm = createLlmModel({ temperature: 0.2 });

  const prompt = `${RESEARCH_SYSTEM_PROMPT}\n\nTopic to analyze:\n"${topic}"\n\nReturn JSON array of claim strings:`;

  const rawResponse = await invokeLlm(llm, prompt);

  const claimTexts = extractAndParseJson<string[]>(
    rawResponse,
    (data) => {
      if (!Array.isArray(data)) {
        throw new Error("Expected an array of claim strings.");
      }
      const strings = data
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((text) => text.length > 5);

      if (strings.length === 0) {
        throw new Error("No non-empty claim strings extracted.");
      }
      return strings;
    },
    "extracted claims"
  );

  const claims: PipelineClaim[] = claimTexts.map((text) => ({
    text,
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
