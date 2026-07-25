import { ChatOpenAI } from "@langchain/openai";

export async function safeLlmInvoke(
  llm: ChatOpenAI,
  prompt: string,
  fallbackGenerator: () => string
): Promise<{ content: string }> {
  try {
    const response = await llm.invoke(prompt);
    return {
      content: typeof response.content === "string" ? response.content : "",
    };
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    console.warn(`[LLM Warning] OpenAI call failed (${errorMessage}). Utilizing agent fallback logic.`);
    return {
      content: fallbackGenerator(),
    };
  }
}
