import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLlmModel, classifyLlmError, LlmConfigurationError } from "../llmProvider";
import { env } from "../../config/env";

describe("LLM Provider & Configuration", () => {
  it("throws LlmConfigurationError when OpenRouter API key is missing", () => {
    const origProvider = env.llmProvider;
    const origKey = env.openRouterApiKey;
    try {
      env.llmProvider = "openrouter";
      env.openRouterApiKey = "";

      assert.throws(
        () => createLlmModel(),
        (err: any) => {
          assert(err instanceof LlmConfigurationError);
          assert(err.message.includes("OPENROUTER_API_KEY"));
          return true;
        }
      );
    } finally {
      env.llmProvider = origProvider;
      env.openRouterApiKey = origKey;
    }
  });

  it("throws LlmConfigurationError when OpenAI API key is missing", () => {
    const origProvider = env.llmProvider;
    const origKey = env.openaiApiKey;
    try {
      env.llmProvider = "openai";
      env.openaiApiKey = "";

      assert.throws(
        () => createLlmModel(),
        (err: any) => {
          assert(err instanceof LlmConfigurationError);
          assert(err.message.includes("OPENAI_API_KEY"));
          return true;
        }
      );
    } finally {
      env.llmProvider = origProvider;
      env.openaiApiKey = origKey;
    }
  });

  it("configures official OpenRouter base URL and headers when configured", () => {
    const origProvider = env.llmProvider;
    const origKey = env.openRouterApiKey;
    const origModel = env.openRouterModel;
    try {
      env.llmProvider = "openrouter";
      env.openRouterApiKey = "sk-or-v1-mock-key-for-test";
      env.openRouterModel = "google/gemini-2.0-flash-001";

      const model = createLlmModel({ temperature: 0.1 });
      assert.equal(model.modelName, "google/gemini-2.0-flash-001");
      // Verify configuration baseURL
      const config: any = (model as any).clientConfig;
      assert.equal(config?.baseURL, "https://openrouter.ai/api/v1");
      assert.equal(config?.defaultHeaders?.["HTTP-Referer"], "https://factmesh.ai");
      assert.equal(config?.defaultHeaders?.["X-Title"], "FactMesh AI Research");
    } finally {
      env.llmProvider = origProvider;
      env.openRouterApiKey = origKey;
      env.openRouterModel = origModel;
    }
  });

  it("classifies 401 authentication errors accurately without leaking secrets", () => {
    const error401 = { status: 401, message: "Invalid API key provided: sk-secret-12345" };
    const classified = classifyLlmError(error401, "openrouter");
    assert.equal(classified.code, "AUTH");
    assert.equal(classified.provider, "openrouter");
    assert(!classified.message.includes("sk-secret-12345"));
  });

  it("classifies 402 quota exhausted errors accurately", () => {
    const error402 = { status: 402, message: "User account credit balance is insufficient" };
    const classified = classifyLlmError(error402, "openrouter");
    assert.equal(classified.code, "QUOTA");
    assert(classified.message.includes("quota exhausted") || classified.message.includes("credit"));
  });

  it("classifies 429 rate limit errors accurately", () => {
    const error429 = { status: 429, message: "Rate limit exceeded" };
    const classified = classifyLlmError(error429, "openai");
    assert.equal(classified.code, "RATE_LIMIT");
    assert(classified.message.includes("Rate limit exceeded"));
  });

  it("classifies timeout errors accurately", () => {
    const timeoutErr = { code: "ETIMEDOUT", message: "Request timed out" };
    const classified = classifyLlmError(timeoutErr, "openrouter");
    assert.equal(classified.code, "TIMEOUT");
    assert(classified.message.includes("timed out"));
  });
});
