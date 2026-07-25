import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Run } from "../models/Run";
import { Claim } from "../models/Claim";

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const runs = await Run.find({ userId: req.userId });
    const runIds = runs.map((r) => r._id);

    const totalRuns = runs.length;
    const completedRuns = runs.filter((r) => r.status === "completed").length;

    const claims = await Claim.find({ runId: { $in: runIds } });
    const totalClaims = claims.length;

    const verifiedClaims = claims.filter((c) => c.verificationStatus === "verified").length;
    const unsupportedClaims = claims.filter((c) => c.verificationStatus === "unsupported").length;
    const contradictedClaims = claims.filter((c) => c.verificationStatus === "contradicted").length;

    const verifiedPercentage = totalClaims > 0 ? Math.round((verifiedClaims / totalClaims) * 100) : 0;

    const totalConfidence = claims.reduce((acc, c) => acc + (c.confidenceScore || 0), 0);
    const avgConfidence = totalClaims > 0 ? Math.round(totalConfidence / totalClaims) : 0;

    const recentRuns = await Run.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("claims")
      .populate("report");

    res.json({
      totalRuns,
      completedRuns,
      totalClaims,
      verifiedClaims,
      unsupportedClaims,
      contradictedClaims,
      verifiedPercentage,
      avgConfidence,
      recentRuns,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch dashboard stats" });
  }
}
