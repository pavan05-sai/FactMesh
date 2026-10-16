import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateDeterministicConfidence } from "../confidenceAgent";
import { PipelineClaim } from "../state";

describe("Confidence Scoring Calibration", () => {
  it("locks verification_error claims strictly to 0 confidence", () => {
    const errorClaim: PipelineClaim = {
      text: "Some unverified statement",
      evidence: [],
      sources: [{ title: "Source", url: "https://example.com", snippet: "snippet" }],
      verificationStatus: "verification_error",
      confidenceScore: 0,
      reasoning: "Error",
      contradictions: [],
    };

    const { score, factors } = calculateDeterministicConfidence(errorClaim);
    assert.equal(score, 0);
    assert(factors.includes("Zero confidence") || factors.includes("Verification failed"));
  });

  it("strictly caps insufficient_evidence claims to <= 30% confidence", () => {
    const insufficientClaim: PipelineClaim = {
      text: "Hypothetical statement without direct proof",
      evidence: ["Mentions keywords but proves nothing", "Another tangential snippet"],
      sources: [
        { title: "Blog 1", url: "https://blog1.com/post", snippet: "text" },
        { title: "Blog 2", url: "https://blog2.com/post", snippet: "text" },
        { title: "Blog 3", url: "https://blog3.com/post", snippet: "text" },
      ],
      verificationStatus: "insufficient_evidence",
      confidenceScore: 0,
      reasoning: "Insufficient evidence",
      contradictions: [],
    };

    const { score, factors } = calculateDeterministicConfidence(insufficientClaim);
    assert(score <= 30, `Expected score <= 30, got ${score}`);
    assert(score >= 10, `Expected score >= 10, got ${score}`);
    assert(factors.includes("Insufficient evidence"));
  });

  it("caps single-source supported claims to <= 75%", () => {
    const singleSourceClaim: PipelineClaim = {
      text: "Claim confirmed by a single authoritative outlet",
      evidence: ["NASA official statement confirming the launch timestamp."],
      sources: [
        {
          title: "NASA Official",
          url: "https://nasa.gov/press-release",
          snippet: "NASA launched Artemis 1 successfully.",
          domain: "nasa.gov",
          isAuthority: true,
        },
      ],
      verificationStatus: "supported",
      confidenceScore: 0,
      reasoning: "Confirmed by NASA",
      contradictions: [],
    };

    const { score } = calculateDeterministicConfidence(singleSourceClaim);
    assert(score <= 75, `Expected single-source score <= 75, got ${score}`);
    assert(score >= 50, `Expected score >= 50, got ${score}`);
  });

  it("rewards multi-domain authoritative corroboration up to 95% (never 100%)", () => {
    const wellSupportedClaim: PipelineClaim = {
      text: "Global sea levels rose during the 20th century according to multiple oceanographic surveys.",
      evidence: [
        "IPCC report documents mean sea level acceleration over 1901-2018.",
        "NOAA oceanographic data confirms tide gauge and satellite measurements.",
        "Nature Climate Change meta-analysis corroborates warming rate.",
      ],
      sources: [
        { title: "NOAA", url: "https://noaa.gov/data", snippet: "NOAA data", domain: "noaa.gov", isAuthority: true },
        { title: "Nature", url: "https://nature.com/articles/s41558", snippet: "Nature article", domain: "nature.com", isAuthority: true },
        { title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sea_level_rise", snippet: "Wiki summary", domain: "wikipedia.org", isAuthority: true },
      ],
      verificationStatus: "supported",
      confidenceScore: 0,
      reasoning: "Confirmed across NOAA, Nature, and IPCC",
      contradictions: [],
    };

    const { score, factors } = calculateDeterministicConfidence(wellSupportedClaim);
    assert(score >= 80, `Expected high confidence >= 80, got ${score}`);
    assert(score <= 95, `Expected score capped at 95%, got ${score}`);
    assert(factors.includes("authoritative"));
  });

  it("penalizes supported claims if contradictions were detected", () => {
    const claimWithConflict: PipelineClaim = {
      text: "The candidate won by an undisputed landslide margin.",
      evidence: ["Source A reports narrow recount victory.", "Source B reports conflicting recount tally."],
      sources: [
        { title: "News A", url: "https://reuters.com/a", snippet: "text", domain: "reuters.com", isAuthority: true },
        { title: "News B", url: "https://apnews.com/b", snippet: "text", domain: "apnews.com", isAuthority: true },
      ],
      verificationStatus: "supported",
      confidenceScore: 0,
      reasoning: "Sources confirm win but dispute margin",
      contradictions: ["Discrepancy in certified vote margin"],
    };

    const { score } = calculateDeterministicConfidence(claimWithConflict);
    // Should be penalized compared to a clean supported claim
    assert(score < 80, `Expected penalty to bring score below 80, got ${score}`);
  });

  it("scores contradicted claims based on strength of contradiction evidence", () => {
    const contradictedClaim: PipelineClaim = {
      text: "The Prime Minister officially resigned on Monday.",
      evidence: ["Official spokesperson confirms Prime Minister remains in office; denial issued."],
      sources: [
        { title: "BBC News", url: "https://bbc.com/news/123", snippet: "No resignation occurred", domain: "bbc.com", isAuthority: true },
        { title: "Reuters", url: "https://reuters.com/news/456", snippet: "Spokesperson refutes claims", domain: "reuters.com", isAuthority: true },
      ],
      verificationStatus: "contradicted",
      confidenceScore: 0,
      reasoning: "Official statements refute claim",
      contradictions: ["Sources confirm Prime Minister remains in office"],
    };

    const { score, factors } = calculateDeterministicConfidence(contradictedClaim);
    assert(score >= 70 && score <= 90, `Expected contradicted score between 70 and 90, got ${score}`);
    assert(factors.includes("Contradiction identified"));
  });
});
