import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export type LlmProvider = "openrouter" | "openai";

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/factmesh",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : ["*"],

  // LLM Provider configuration
  llmProvider: (process.env.LLM_PROVIDER || (process.env.OPENROUTER_API_KEY ? "openrouter" : "openai")).toLowerCase() as LlmProvider,
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",

  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",

  llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || "30000", 10),
  llmMaxRetries: parseInt(process.env.LLM_MAX_RETRIES || "2", 10),

  // Search configuration
  tavilyApiKey: process.env.TAVILY_API_KEY || "",
  searchTimeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || "10000", 10),
};

export interface EnvValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateEnv(): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const provider = env.llmProvider;
  if (provider === "openrouter") {
    if (!env.openRouterApiKey) {
      warnings.push("OPENROUTER_API_KEY is not configured. OpenRouter API calls will fail.");
    }
  } else if (provider === "openai") {
    if (!env.openaiApiKey) {
      warnings.push("OPENAI_API_KEY is not configured. OpenAI API calls will fail.");
    }
  } else {
    warnings.push(`Unknown LLM_PROVIDER '${provider}'. Expected 'openrouter' or 'openai'.`);
  }

  if (!env.tavilyApiKey) {
    warnings.push("TAVILY_API_KEY is not configured. Web searches will use Wikipedia fallback.");
  }

  if (env.jwtSecret === "dev-secret-change-me" && env.nodeEnv === "production") {
    errors.push("JWT_SECRET must be set to a secure string in production.");
  }

  if (warnings.length > 0) {
    warnings.forEach((msg) => console.warn(`[Config Warning] ${msg}`));
  }
  if (errors.length > 0) {
    errors.forEach((msg) => console.error(`[Config Error] ${msg}`));
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
