import { tavily } from "@tavily/core";
import { env } from "../config/env";
import { PipelineState, PipelineSource } from "./state";

// Wikipedia fallback for when Tavily quota is exceeded
async function searchWikipedia(query: string): Promise<PipelineSource[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as any;
    const results = data?.query?.search || [];
    return results.map((r: any) => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      snippet: r.snippet.replace(/<[^>]*>/g, ""), // strip HTML tags
    }));
  } catch {
    return [];
  }
}

export async function searchAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const tvly = tavily({ apiKey: env.tavilyApiKey });
  const updatedClaims = [...state.claims];

  for (let i = 0; i < updatedClaims.length; i++) {
    const claim = updatedClaims[i];
    let sources: PipelineSource[] = [];
    let evidence: string[] = [];

    try {
      const result = await tvly.search(claim.text, {
        searchDepth: "basic",
        maxResults: 5,
      });

      sources = (result.results || []).map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        snippet: r.content || "",
      }));
      evidence = sources.map((s) => s.snippet).filter(Boolean);
    } catch (err: any) {
      // Fallback to Wikipedia if Tavily fails
      console.warn(`Tavily search failed for claim ${i}, falling back to Wikipedia:`, err.message);
      sources = await searchWikipedia(claim.text);
      evidence = sources.map((s) => s.snippet).filter(Boolean);
    }

    updatedClaims[i] = {
      ...claim,
      sources,
      evidence,
    };
  }

  return {
    claims: updatedClaims,
    currentAgent: "search",
  };
}
