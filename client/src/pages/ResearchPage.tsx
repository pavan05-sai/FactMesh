import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Activity, Terminal } from 'lucide-react';
import { AgentCard } from '../components/AgentCard';
import { useSocket } from '../hooks/useSocket';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { getRunById } from '../services/runService';
import { setCurrentRun } from '../store/runSlice';

const PIPELINE_STEPS = [
  {
    name: 'research',
    title: 'Research Agent',
    description: 'Deconstructs topic into 5-10 discrete checkable claims',
  },
  {
    name: 'search',
    title: 'Search Agent',
    description: 'Searches Tavily & Wikipedia for web evidence & sources',
  },
  {
    name: 'verification',
    title: 'Verification Agent',
    description: 'Evaluates claim support level against fetched evidence',
  },
  {
    name: 'hallucination',
    title: 'Hallucination Agent',
    description: 'Detects unsupported statements and contradictions',
  },
  {
    name: 'confidence',
    title: 'Confidence Agent',
    description: 'Calculates 0-100% confidence scores for each claim',
  },
  {
    name: 'report',
    title: 'Report Agent',
    description: 'Compiles final citation-backed structured report',
  },
];

export const ResearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentRun, agentStatuses } = useAppSelector((state) => state.run);

  // Subscribe to real-time Socket.IO events for this run
  useSocket(id);

  useEffect(() => {
    if (id) {
      getRunById(id)
        .then((run) => {
          dispatch(setCurrentRun(run));
        })
        .catch((err) => {
          console.error('Failed to fetch run details:', err);
        });
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentRun?.status === 'completed') {
      const timer = setTimeout(() => {
        navigate(`/verification/${id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentRun?.status, id, navigate]);

  const calculateProgress = () => {
    const total = PIPELINE_STEPS.length;
    let completed = 0;
    PIPELINE_STEPS.forEach((step) => {
      if (agentStatuses[step.name]?.status === 'done') {
        completed += 1;
      }
    });
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Run Header */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>ACTIVE RESEARCH RUN #{id?.slice(-6)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              "{currentRun?.topic || 'Researching topic...'}"
            </h1>
          </div>

          {currentRun?.status === 'completed' && (
            <button
              onClick={() => navigate(`/verification/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              View Verification Matrix
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Pipeline Progress</span>
            <span className="font-bold text-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agents Pipeline Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            Multi-Agent Agentic Execution Graph
          </h2>
          {currentRun?.status === 'running' && (
            <span className="text-xs font-mono text-amber-500 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Live Socket.IO Stream Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PIPELINE_STEPS.map((step, index) => {
            const agentState = agentStatuses[step.name] || { status: 'pending', log: '' };
            return (
              <AgentCard
                key={step.name}
                name={step.name}
                title={step.title}
                description={step.description}
                stepNumber={index + 1}
                status={agentState.status}
                log={agentState.log}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
