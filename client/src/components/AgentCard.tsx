import React from 'react';
import { Search, Brain, CheckCircle2, AlertTriangle, BarChart2, FileText, Loader2, Clock, XCircle } from 'lucide-react';

interface AgentCardProps {
  name: string;
  title: string;
  description: string;
  stepNumber: number;
  status: 'pending' | 'thinking' | 'done' | 'error' | string;
  log?: string;
}

const getAgentIcon = (name: string) => {
  switch (name) {
    case 'research':
      return Brain;
    case 'search':
      return Search;
    case 'verification':
      return CheckCircle2;
    case 'hallucination':
      return AlertTriangle;
    case 'confidence':
      return BarChart2;
    case 'report':
      return FileText;
    default:
      return Brain;
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({
  name,
  title,
  description,
  stepNumber,
  status,
  log,
}) => {
  const Icon = getAgentIcon(name);

  const getStatusBadge = () => {
    switch (status) {
      case 'thinking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Working
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getCardBorder = () => {
    switch (status) {
      case 'thinking':
        return 'border-amber-500/40 shadow-lg shadow-amber-500/5 bg-card';
      case 'done':
        return 'border-emerald-500/30 bg-card';
      case 'error':
        return 'border-rose-500/40 bg-card';
      default:
        return 'border-border bg-card/50 opacity-70';
    }
  };

  return (
    <div className={`p-5 rounded-xl border transition-all duration-300 ${getCardBorder()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`p-2.5 rounded-lg border ${
              status === 'thinking' 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : status === 'done'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-muted border-border text-muted-foreground'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-background border border-border text-[10px] font-mono flex items-center justify-center font-bold text-muted-foreground">
              {stepNumber}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {log && (
        <div className="mt-4 pt-3 border-t border-border/50 font-mono text-xs text-muted-foreground flex items-center justify-between">
          <span className="truncate max-w-[90%]">&gt; {log}</span>
        </div>
      )}
    </div>
  );
};
