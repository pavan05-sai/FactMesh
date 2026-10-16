import { ChatOpenAI } from "@langchain/openai";
import { classifyLlmError, LlmExecutionError } from "./llmProvider";
import { env } from "../config/env";

export class ModelOutputParseError extends Error {
  public readonly rawContent: string;
  constructor(message: string, rawContent: string) {
    super(message);
    this.name = "ModelOutputParseError";
    this.rawContent = rawContent;
  }
}

/**
 * Executes a call to the LLM model.
 * If the model call fails, classifies the error and throws an explicit LlmExecutionError.
 * NEVER returns fabricated success text.
 */
export async function invokeLlm(llm: ChatOpenAI, prompt: string): Promise<string> {
  try {
    const response = await llm.invoke(prompt);
    if (typeof response.content === "string") {
      return response.content;
    }
    if (Array.isArray(response.content)) {
      return response.content
        .map((part) => (typeof part === "string" ? part : (part as any)?.text || ""))
        .join("\n");
    }
    return String(response.content || "");
  } catch (err: any) {
    const classified = classifyLlmError(err, env.llmProvider);
    console.error(`[LLM Error] [${classified.code}] ${classified.message}`);
    throw classified;
  }
}

/**
 * Sanitizes untrusted web snippets to mitigate prompt injection.
 * Strips delimiters that could mimic system boundaries and truncates excessive lengths.
 */
export function sanitizeUntrustedSnippet(snippet: string, maxChars = 800): string {
  if (!snippet) return "";
  // Strip null bytes and common prompt injection wrappers
  let sanitized = snippet
    .replace(/\0/g, "")
    .replace(/```/g, "'''")
    .replace(/<\/?(system|instruction|prompt|delimiters|evidence_context)[^>]*>/gi, "")
    .trim();

  if (sanitized.length > maxChars) {
    sanitized = sanitized.slice(0, maxChars) + "… [truncated]";
  }
  return sanitized;
}

/**
 * Extracts and parses JSON from model output with markdown fence stripping
 * and structured validation.
 */
export function extractAndParseJson<T>(
  raw: string,
  validator: (data: any) => T,
  contextDescription = "JSON"
): T {
  if (!raw || !raw.trim()) {
    throw new ModelOutputParseError(`Empty response received when expecting ${contextDescription}`, raw);
  }

  // 1. Remove markdown code fences if present
  let cleaned = raw.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // 2. Try matching the outermost array or object
    const bracketMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (bracketMatch) {
      cleaned = bracketMatch[1].trim();
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new ModelOutputParseError(
      `Failed to parse ${contextDescription}: ${err.message}. Raw output preview: ${raw.slice(0, 150)}...`,
      raw
    );
  }

  try {
    return validator(parsed);
  } catch (err: any) {
    throw new ModelOutputParseError(
      `Model output failed schema validation for ${contextDescription}: ${err.message}`,
      raw
    );
  }
}

/**
 * Backward compatibility wrapper if referenced elsewhere, but enforces true errors on LLM failure.
 */
export async function safeLlmInvoke(
  llm: ChatOpenAI,
  prompt: string,
  _legacyFallback?: () => string
): Promise<{ content: string }> {
  const content = await invokeLlm(llm, prompt);
  return { content };
}
