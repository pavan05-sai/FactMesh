import { tavily } from "@tavily/core";
import { env } from "../config/env";
import { PipelineState, PipelineSource } from "./state";
import { sanitizeUntrustedSnippet } from "./llmHelper";

// Common authoritative domains for source credibility assessment
const HIGH_AUTHORITY_DOMAINS = [
  "gov",
  "edu",
  "wikipedia.org",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "nature.com",
  "science.org",
  "nih.gov",
  "who.int",
  "nasa.gov",
  "cdc.gov",
];

function extractDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isAuthorityDomain(domain: string): boolean {
  if (!domain) return false;
  return HIGH_AUTHORITY_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`) || domain.endsWith(".gov") || domain.endsWith(".edu")
  );
}

function normalizeUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    // Remove query tracking tokens
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("utm_term");
    parsed.searchParams.delete("utm_content");
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function cleanHtmlSnippet(snippet: string): string {
  return snippet
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wikipedia search fallback using native fetch with timeout.
 */
async function searchWikipedia(query: string, timeoutMs: number): Promise<PipelineSource[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&srlimit=3&origin=*`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as any;
    const results = data?.query?.search || [];
    const now = new Date().toISOString();

    return results
      .map((r: any): PipelineSource | null => {
        const title = (r.title || "").trim();
        if (!title) return null;
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        const rawSnippet = cleanHtmlSnippet(r.snippet || "");
        const snippet = sanitizeUntrustedSnippet(rawSnippet);
        const domain = "wikipedia.org";

        return {
          title,
          url: pageUrl,
          snippet,
          retrievedAt: now,
          domain,
          isAuthority: true,
        };
      })
      .filter((s: PipelineSource | null): s is PipelineSource => s !== null && s.snippet.length > 0);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn(`[Search Warning] Wikipedia search timed out for query: "${query}"`);
    } else {
      console.warn(`[Search Warning] Wikipedia search failed:`, err?.message || err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Deduplicates and validates raw sources.
 */
function deduplicateSources(sources: PipelineSource[]): PipelineSource[] {
  const seenUrls = new Set<string>();
  const deduped: PipelineSource[] = [];

  for (const src of sources) {
    const normalized = normalizeUrl(src.url);
    if (!normalized || seenUrls.has(normalized)) continue;
    seenUrls.add(normalized);

    const domain = src.domain || extractDomain(normalized);
    deduped.push({
      ...src,
      url: normalized,
      domain,
      isAuthority: src.isAuthority ?? isAuthorityDomain(domain),
    });
  }

  return deduped;
}

export async function searchAgent(state: PipelineState): Promise<Partial<PipelineState>> {
  const timeoutMs = env.searchTimeoutMs || 10000;
  const hasTavily = Boolean(env.tavilyApiKey && env.tavilyApiKey.trim());
  const tvly = hasTavily ? tavily({ apiKey: env.tavilyApiKey }) : null;

  const updatedClaims = [...state.claims];

  for (let i = 0; i < updatedClaims.length; i++) {
    const claim = updatedClaims[i];
    let sources: PipelineSource[] = [];
    const now = new Date().toISOString();

    if (tvly) {
      try {
        // Enforce timeout using Promise.race
        const searchPromise = tvly.search(claim.text, {
          searchDepth: "basic",
          maxResults: 5,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tavily search timeout after ${timeoutMs}ms`)), timeoutMs)
        );

        const result: any = await Promise.race([searchPromise, timeoutPromise]);

        const rawResults = result?.results || [];
        sources = rawResults
          .map((r: any): PipelineSource | null => {
            const normalized = normalizeUrl(r.url || "");
            if (!normalized) return null;
            const snippet = sanitizeUntrustedSnippet(r.content || "");
            const domain = extractDomain(normalized);
            return {
              title: (r.title || "").trim() || domain,
              url: normalized,
              snippet,
              retrievedAt: now,
              domain,
              isAuthority: isAuthorityDomain(domain),
            };
          })
          .filter((s: PipelineSource | null): s is PipelineSource => s !== null && s.snippet.length > 0);
      } catch (err: any) {
        console.warn(`[Search] Tavily search for claim ${i + 1} encountered error: ${err.message}. Trying Wikipedia fallback.`);
        sources = await searchWikipedia(claim.text, timeoutMs);
      }
    } else {
      // Direct Wikipedia fallback when Tavily key is absent
      sources = await searchWikipedia(claim.text, timeoutMs);
    }

    // If initial query returned 0 sources from Wikipedia too, try a simplified search using topic + core nouns
    if (sources.length === 0) {
      const simplifiedQuery = `${state.topic} ${claim.text.split(" ").slice(0, 5).join(" ")}`;
      sources = await searchWikipedia(simplifiedQuery, timeoutMs);
    }

    const dedupedSources = deduplicateSources(sources).slice(0, 5);
    const evidence = dedupedSources.map((s) => s.snippet).filter(Boolean);

    updatedClaims[i] = {
      ...claim,
      sources: dedupedSources,
      evidence,
    };
  }

  return {
    claims: updatedClaims,
    currentAgent: "search",
  };
}
