import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle, AlertTriangle, XOctagon, BookOpen, ShieldCheck } from 'lucide-react';
import { ExportButtons } from '../components/ExportButtons';
import { getRunById, Run } from '../services/runService';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRunById(id)
        .then((data) => setRun(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground font-mono text-sm animate-pulse">
        Loading compiled research report...
      </div>
    );
  }

  if (!run || !run.report) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-muted-foreground">Report not found or not yet generated.</p>
        <Link to="/" className="text-sm underline">
          Return home
        </Link>
      </div>
    );
  }

  const report = run.report;
  const claims = run.claims || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <Link
          to={`/verification/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Verification Matrix
        </Link>

        {id && <ExportButtons runId={id} />}
      </div>

      {/* Report Container */}
      <article className="p-8 sm:p-10 rounded-2xl border border-border bg-card space-y-8 shadow-md">
        {/* Document Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>FACTMESH VERIFIED RESEARCH REPORT</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {run.topic}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
            <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
            <span>•</span>
            <span>Verified Claims: {report.verifiedClaims.length}</span>
            <span>•</span>
            <span>Sources Cited: {report.references.length}</span>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Executive Summary
          </h2>
          <div className="p-5 rounded-xl border border-border bg-muted/40 text-sm text-foreground leading-relaxed whitespace-pre-line">
            {report.executiveSummary}
          </div>
        </section>

        {/* Verified Claims */}
        {report.verifiedClaims.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Verified Findings
            </h2>
            <ul className="space-y-2">
              {report.verifiedClaims.map((claim, i) => (
                <li key={i} className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-foreground flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold">✓</span>
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contradictions & Hallucinations */}
        {report.contradictions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <XOctagon className="w-4 h-4 text-rose-400" />
              Detected Contradictions & Hallucinations
            </h2>
            <ul className="space-y-2">
              {report.contradictions.map((item, i) => (
                <li key={i} className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs text-rose-300 flex items-start gap-2">
                  <span className="font-mono text-rose-400 font-bold">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Unsupported Claims */}
        {report.unsupportedClaims.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Unsupported & Insufficient Evidence Statements
            </h2>
            <ul className="space-y-2">
              {report.unsupportedClaims.map((claim, i) => (
                <li key={i} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-foreground flex items-start gap-2">
                  <span className="font-mono text-amber-400 font-bold">?</span>
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Confidence Matrix Table */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">
            Claim Confidence & Source Rationale
          </h2>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-mono uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="p-3">Claim</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map((c, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="p-3 text-foreground font-medium">{c.text}</td>
                    <td className="p-3 capitalize font-mono text-muted-foreground">
                      {c.verificationStatus.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      {c.confidenceScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* References */}
        {report.references && report.references.length > 0 && (
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Cited References & External Web Sources
            </h2>
            <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
              {report.references.map((ref, i) => (
                <li key={i} className="truncate hover:text-foreground">
                  [{i + 1}] <a href={ref} target="_blank" rel="noopener noreferrer" className="underline">{ref}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
};
