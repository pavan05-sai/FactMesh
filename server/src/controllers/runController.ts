import { Response } from "express";
import PDFDocument from "pdfkit";
import { AuthRequest } from "../middleware/auth";
import { Run } from "../models/Run";
import { Claim } from "../models/Claim";
import { Report } from "../models/Report";
import { runPipeline } from "../agents/pipeline";

export async function createRun(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      res.status(400).json({ error: "Research topic is required" });
      return;
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      res.status(400).json({ error: "Research topic must be at least 3 characters long" });
      return;
    }
    if (trimmedTopic.length > 500) {
      res.status(400).json({ error: "Research topic cannot exceed 500 characters" });
      return;
    }

    // Guard against rapid duplicate submissions
    const recentRun = await Run.findOne({
      userId: req.userId,
      topic: trimmedTopic,
      status: { $in: ["pending", "running"] },
      createdAt: { $gte: new Date(Date.now() - 15000) },
    });

    if (recentRun) {
      res.status(409).json({
        error: "A research run with this exact topic is already in progress. Please wait for it to complete.",
        runId: recentRun._id,
      });
      return;
    }

    const run = new Run({
      userId: req.userId,
      topic: trimmedTopic,
      status: "pending",
    });
    await run.save();

    const io = req.app.locals.io;
    // Trigger pipeline asynchronously in background
    runPipeline(topic.trim(), (run._id as any).toString(), io).catch((err) => {
      console.error(`Pipeline execution error for run ${run._id}:`, err);
    });

    res.status(201).json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create research run" });
  }
}

export async function getRuns(req: AuthRequest, res: Response): Promise<void> {
  try {
    const runs = await Run.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("claims")
      .populate("report");

    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch runs" });
  }
}

export async function getRunById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const run = await Run.findOne({ _id: req.params.id, userId: req.userId })
      .populate("claims")
      .populate("report");

    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch run details" });
  }
}

export async function getReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const run = await Run.findOne({ _id: req.params.id, userId: req.userId });
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    const report = await Report.findOne({ runId: run._id });
    if (!report) {
      res.status(404).json({ error: "Report not found or not yet generated" });
      return;
    }

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch report" });
  }
}

export async function exportPdf(req: AuthRequest, res: Response): Promise<void> {
  try {
    const run = await Run.findOne({ _id: req.params.id, userId: req.userId });
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    const report = await Report.findOne({ runId: run._id });
    const claims = await Claim.find({ runId: run._id });

    if (!report) {
      res.status(404).json({ error: "Report not yet generated for this run" });
      return;
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `FactMesh_Report_${run._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(22).text("FactMesh — Verification Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Topic: ${run.topic}`, { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1.5);

    // Executive Summary
    doc.fontSize(16).text("Executive Summary");
    doc.fontSize(10).text(report.executiveSummary || "N/A");
    doc.moveDown(1.5);

    // Verified Claims
    doc.fontSize(16).text("Verified Claims");
    if (report.verifiedClaims.length > 0) {
      report.verifiedClaims.forEach((claim) => {
        doc.fontSize(10).text(`• ${claim}`);
      });
    } else {
      doc.fontSize(10).text("None");
    }
    doc.moveDown(1.5);

    // Unsupported Claims
    doc.fontSize(16).text("Unsupported Claims");
    if (report.unsupportedClaims.length > 0) {
      report.unsupportedClaims.forEach((claim) => {
        doc.fontSize(10).text(`• ${claim}`);
      });
    } else {
      doc.fontSize(10).text("None");
    }
    doc.moveDown(1.5);

    // Contradictions / Hallucinations
    doc.fontSize(16).text("Contradictions & Hallucinations");
    if (report.contradictions.length > 0) {
      report.contradictions.forEach((item) => {
        doc.fontSize(10).text(`• ${item}`);
      });
    } else {
      doc.fontSize(10).text("None detected");
    }
    doc.moveDown(1.5);

    // Confidence Table
    doc.fontSize(16).text("Claim Confidence Scores");
    claims.forEach((c) => {
      doc.fontSize(10).text(`Claim: ${c.text}`);
      doc.fontSize(9).text(`Status: ${c.verificationStatus.toUpperCase()} | Confidence: ${c.confidenceScore}%`);
      if (c.reasoning) {
        doc.fontSize(9).text(`Reasoning: ${c.reasoning}`);
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(1);

    // References
    doc.fontSize(16).text("References & Sources");
    if (report.references.length > 0) {
      report.references.forEach((ref) => {
        doc.fontSize(9).text(`• ${ref}`);
      });
    } else {
      doc.fontSize(10).text("None");
    }

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to export PDF" });
  }
}

export async function exportMarkdown(req: AuthRequest, res: Response): Promise<void> {
  try {
    const run = await Run.findOne({ _id: req.params.id, userId: req.userId });
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    const report = await Report.findOne({ runId: run._id });
    const claims = await Claim.find({ runId: run._id });

    if (!report) {
      res.status(404).json({ error: "Report not yet generated for this run" });
      return;
    }

    let md = `# FactMesh Fact Verification Report\n\n`;
    md += `**Topic:** ${run.topic}\n`;
    md += `**Date:** ${new Date(run.createdAt).toLocaleString()}\n\n`;
    md += `## Executive Summary\n\n${report.executiveSummary}\n\n`;

    md += `## Verified Claims\n\n`;
    if (report.verifiedClaims.length === 0) {
      md += `*No verified claims.*\n\n`;
    } else {
      report.verifiedClaims.forEach((c) => (md += `- ${c}\n`));
      md += `\n`;
    }

    md += `## Unsupported Claims\n\n`;
    if (report.unsupportedClaims.length === 0) {
      md += `*No unsupported claims.*\n\n`;
    } else {
      report.unsupportedClaims.forEach((c) => (md += `- ${c}\n`));
      md += `\n`;
    }

    md += `## Contradictions & Hallucinations\n\n`;
    if (report.contradictions.length === 0) {
      md += `*No contradictions detected.*\n\n`;
    } else {
      report.contradictions.forEach((c) => (md += `- ${c}\n`));
      md += `\n`;
    }

    md += `## Detailed Claims & Confidence\n\n`;
    md += `| Claim | Status | Confidence | Reasoning |\n`;
    md += `| --- | --- | --- | --- |\n`;
    claims.forEach((c) => {
      md += `| ${c.text.replace(/\|/g, "\\|")} | ${c.verificationStatus} | ${c.confidenceScore}% | ${c.reasoning.replace(/\|/g, "\\|")} |\n`;
    });
    md += `\n`;

    md += `## References\n\n`;
    report.references.forEach((ref) => (md += `- ${ref}\n`));

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="FactMesh_Report_${run._id}.md"`);
    res.send(md);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to export Markdown" });
  }
}

export async function exportJson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const run = await Run.findOne({ _id: req.params.id, userId: req.userId });
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    const report = await Report.findOne({ runId: run._id });
    const claims = await Claim.find({ runId: run._id });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="FactMesh_Report_${run._id}.json"`);
    res.json({
      run,
      report,
      claims,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to export JSON" });
  }
}
