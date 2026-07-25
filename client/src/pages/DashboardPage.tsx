import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck2, AlertTriangle, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { getDashboardStats } from '../services/dashboardService';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { setStats, setDashboardLoading } from '../store/dashboardSlice';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(setDashboardLoading(true));
    getDashboardStats()
      .then((data) => {
        dispatch(setStats(data));
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
      })
      .finally(() => {
        dispatch(setDashboardLoading(false));
      });
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div className="py-20 text-center text-muted-foreground font-mono text-sm animate-pulse">
        Loading analytics & research history...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Dashboard Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-muted-foreground" />
          Verification Analytics & History
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggregate metrics across your multi-agent research runs
        </p>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Runs"
          value={stats?.totalRuns || 0}
          subtitle={`${stats?.completedRuns || 0} completed`}
          icon={Clock}
        />
        <StatCard
          title="Verified Claim Rate"
          value={`${stats?.verifiedPercentage || 0}%`}
          subtitle={`${stats?.verifiedClaims || 0} of ${stats?.totalClaims || 0} claims`}
          icon={FileCheck2}
          trend={stats?.verifiedPercentage ? `${stats.verifiedPercentage}%` : undefined}
          trendPositive={true}
        />
        <StatCard
          title="Hallucinations Detected"
          value={stats?.contradictedClaims || 0}
          subtitle={`${stats?.unsupportedClaims || 0} unsupported`}
          icon={AlertTriangle}
          trend={stats?.contradictedClaims ? `${stats.contradictedClaims}` : '0'}
          trendPositive={false}
        />
        <StatCard
          title="Avg Confidence Score"
          value={`${stats?.avgConfidence || 0}%`}
          subtitle="Cross-agent consensus"
          icon={ShieldCheck}
        />
      </div>

      {/* Recent Research Runs */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Research Runs</h2>

        {!stats?.recentRuns || stats.recentRuns.length === 0 ? (
          <div className="p-8 text-center border border-border rounded-xl bg-card text-muted-foreground text-sm">
            No research runs recorded yet.{' '}
            <Link to="/" className="underline text-foreground">
              Start your first run.
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentRuns.map((run) => (
              <div
                key={run._id}
                className="p-5 rounded-xl border border-border bg-card hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
                    <span>{new Date(run.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="capitalize">{run.status}</span>
                  </div>
                  <h3 className="font-semibold text-base text-foreground leading-snug">
                    {run.topic}
                  </h3>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <Link
                    to={`/verification/${run._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-muted hover:bg-card text-xs font-semibold text-foreground transition-colors"
                  >
                    Matrix
                  </Link>
                  {run.report && (
                    <Link
                      to={`/report/${run._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Report
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
