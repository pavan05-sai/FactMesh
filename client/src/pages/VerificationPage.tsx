import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowRight, ShieldCheck, Filter, AlertTriangle, CheckCircle, XOctagon } from 'lucide-react';
import { ClaimRow } from '../components/ClaimRow';
import { getRunById, Run } from '../services/runService';

export const VerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'supported' | 'insufficient_evidence' | 'contradicted' | 'error'>('all');

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
        Loading verification matrix...
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-muted-foreground">Run not found.</p>
        <Link to="/" className="text-sm underline">
          Return home
        </Link>
      </div>
    );
  }

  const claims = run.claims || [];

  const isSupported = (status: string) => status === 'supported' || status === 'verified';
  const isInsufficient = (status: string) => status === 'insufficient_evidence' || status === 'unsupported';
  const isContradicted = (status: string) => status === 'contradicted';
  const isError = (status: string) => status === 'verification_error';

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'supported') return isSupported(c.verificationStatus);
    if (filter === 'contradicted') return isContradicted(c.verificationStatus);
    if (filter === 'insufficient_evidence') return isInsufficient(c.verificationStatus);
    if (filter === 'error') return isError(c.verificationStatus);
    return true;
  });

  const supportedCount = claims.filter((c) => isSupported(c.verificationStatus)).length;
  const insufficientCount = claims.filter((c) => isInsufficient(c.verificationStatus)).length;
  const contradictedCount = claims.filter((c) => isContradicted(c.verificationStatus)).length;
  const errorCount = claims.filter((c) => isError(c.verificationStatus)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CLAIM VERIFICATION MATRIX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            "{run.topic}"
          </h1>
        </div>

        <Link
          to={`/report/${id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity w-fit"
        >
          <FileText className="w-4 h-4" />
          View Full Report & Exports
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Verification Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter by Status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === 'all'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({claims.length})
          </button>

          <button
            onClick={() => setFilter('supported')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filter === 'supported'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Supported ({supportedCount})
          </button>

          <button
            onClick={() => setFilter('insufficient_evidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filter === 'insufficient_evidence'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Insufficient Evidence ({insufficientCount})
          </button>

          <button
            onClick={() => setFilter('contradicted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filter === 'contradicted'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <XOctagon className="w-3.5 h-3.5" />
            Contradicted ({contradictedCount})
          </button>

          {errorCount > 0 && (
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                filter === 'error'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <XOctagon className="w-3.5 h-3.5" />
              Errors ({errorCount})
            </button>
          )}
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center border border-border rounded-xl bg-card text-muted-foreground text-sm">
            No claims found matching filter "{filter}".
          </div>
        ) : (
          filteredClaims.map((claim, index) => (
            <ClaimRow key={claim._id || index} claim={claim} index={index} />
          ))
        )}
      </div>
    </div>
  );
};
