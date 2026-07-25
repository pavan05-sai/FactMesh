import React, { useState } from 'react';
import { CheckCircle, AlertCircle, XOctagon, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react';
import { Claim } from '../services/runService';

interface ClaimRowProps {
  claim: Claim;
  index: number;
}

export const ClaimRow: React.FC<ClaimRowProps> = ({ claim, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'contradicted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XOctagon className="w-3.5 h-3.5" />
            Contradicted
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Unsupported
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
            Pending
          </span>
        );
    }
  };

  const getConfidenceBarColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden transition-all duration-200 hover:border-border/80">
      {/* Header Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-start space-x-3 flex-1">
          <span className="font-mono text-xs font-bold text-muted-foreground border border-border rounded-md px-2 py-1 bg-muted">
            #{index + 1}
          </span>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground leading-relaxed">
              {claim.text}
            </h4>
            {claim.reasoning && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {claim.reasoning}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-6 border-t md:border-t-0 pt-3 md:pt-0 border-border">
          {/* Status */}
          <div className="flex items-center">{getStatusBadge(claim.verificationStatus)}</div>

          {/* Confidence score */}
          <div className="w-28 flex flex-col">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">Score</span>
              <span className="font-bold text-foreground">{claim.confidenceScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getConfidenceBarColor(claim.confidenceScore)}`}
                style={{ width: `${claim.confidenceScore}%` }}
              />
            </div>
          </div>

          {/* Expand toggle */}
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded evidence & sources details */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-border/60 bg-muted/30 space-y-4 text-xs">
          {/* Detailed Reasoning */}
          {claim.reasoning && (
            <div>
              <span className="font-semibold text-foreground block mb-1">Verification Rationale</span>
              <p className="text-muted-foreground leading-relaxed bg-card p-3 rounded-lg border border-border">
                {claim.reasoning}
              </p>
            </div>
          )}

          {/* Contradiction warning */}
          {claim.contradictions && claim.contradictions.length > 0 && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-300">
              <span className="font-semibold block mb-1 flex items-center gap-1.5">
                <XOctagon className="w-3.5 h-3.5 text-rose-400" />
                Detected Contradictions
              </span>
              <ul className="list-disc list-inside space-y-1">
                {claim.contradictions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          {claim.sources && claim.sources.length > 0 && (
            <div>
              <span className="font-semibold text-foreground block mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Verified Sources ({claim.sources.length})
              </span>
              <div className="grid gap-2">
                {claim.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-start justify-between group"
                  >
                    <div className="pr-4">
                      <span className="font-medium text-foreground group-hover:underline block">
                        {src.title || src.url}
                      </span>
                      {src.snippet && (
                        <p className="text-muted-foreground text-[11px] mt-1 line-clamp-2">
                          "{src.snippet}"
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
