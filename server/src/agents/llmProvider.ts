import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env";

export class LlmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigurationError";
  }
}

export class LlmExecutionError extends Error {
  public readonly code: "AUTH" | "QUOTA" | "RATE_LIMIT" | "TIMEOUT" | "MODEL" | "UNKNOWN";
  public readonly provider: string;

  constructor(message: string, code: "AUTH" | "QUOTA" | "RATE_LIMIT" | "TIMEOUT" | "MODEL" | "UNKNOWN", provider: string) {
    super(message);
    this.name = "LlmExecutionError";
    this.code = code;
    this.provider = provider;
  }
}

export interface CreateModelOptions {
  temperature?: number;
  modelName?: string;
  maxTokens?: number;
}

/**
 * Centralized LLM factory supporting OpenRouter and OpenAI.
 * Automatically configures official OpenRouter base URL, headers, timeouts, and model.
 */
export function createLlmModel(options: CreateModelOptions = {}): ChatOpenAI {
  const provider = env.llmProvider;
  const temperature = options.temperature ?? 0.1;

  if (provider === "openrouter") {
    if (!env.openRouterApiKey || env.openRouterApiKey.trim() === "") {
      throw new LlmConfigurationError(
        "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your server .env file."
      );
    }

    const modelName = options.modelName || env.openRouterModel;

    return new ChatOpenAI({
      model: modelName,
      apiKey: env.openRouterApiKey,
      temperature,
      maxTokens: options.maxTokens,
      timeout: env.llmTimeoutMs,
      maxRetries: env.llmMaxRetries,
      configuration: {
        baseURL: env.openRouterBaseUrl,
        defaultHeaders: {
          "HTTP-Referer": "https://factmesh.ai",
          "X-Title": "FactMesh AI Research",
        },
      },
    });
  } else if (provider === "openai") {
    if (!env.openaiApiKey || env.openaiApiKey.trim() === "") {
      throw new LlmConfigurationError(
        "OpenAI API key is not configured. Please set OPENAI_API_KEY in your server .env file."
      );
    }

    const modelName = options.modelName || env.openaiModel;

    return new ChatOpenAI({
      model: modelName,
      apiKey: env.openaiApiKey,
      temperature,
      maxTokens: options.maxTokens,
      timeout: env.llmTimeoutMs,
      maxRetries: env.llmMaxRetries,
      configuration: {
        baseURL: env.openaiBaseUrl,
      },
    });
  } else {
    throw new LlmConfigurationError(
      `Unsupported LLM provider '${provider}'. Set LLM_PROVIDER to 'openrouter' or 'openai'.`
    );
  }
}

/**
 * Classifies LLM errors safely without logging sensitive auth headers or API keys.
 */
export function classifyLlmError(err: any, provider: string): LlmExecutionError {
  const message = err?.message || String(err);
  const status = err?.status || err?.statusCode || err?.response?.status;

  if (status === 401 || message.includes("401") || /invalid.*api.*key/i.test(message) || /unauthorized/i.test(message)) {
    return new LlmExecutionError(
      `Authentication failed with ${provider}. Please verify your API key configuration.`,
      "AUTH",
      provider
    );
  }

  if (status === 402 || message.includes("402") || /insufficient.*credit/i.test(message) || /quota.*exceeded/i.test(message)) {
    return new LlmExecutionError(
      `Account credit or quota exhausted on ${provider}. Please check your account balance.`,
      "QUOTA",
      provider
    );
  }

  if (status === 429 || message.includes("429") || /rate.*limit/i.test(message)) {
    return new LlmExecutionError(
      `Rate limit exceeded on ${provider}. Please retry after a brief pause.`,
      "RATE_LIMIT",
      provider
    );
  }

  if (message.includes("timeout") || message.includes("ETIMEDOUT") || message.includes("ECONNABORTED") || err?.code === "ETIMEDOUT") {
    return new LlmExecutionError(
      `Request to ${provider} timed out after ${env.llmTimeoutMs}ms.`,
      "TIMEOUT",
      provider
    );
  }

  return new LlmExecutionError(
    `Error executing ${provider} model request: ${message}`,
    "MODEL",
    provider
  );
}
