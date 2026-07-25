import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Search, CheckCircle2, Zap, Layers } from 'lucide-react';
import { SearchInput } from '../components/SearchInput';
import { createRun } from '../services/runService';
import { useAppDispatch } from '../hooks/useRedux';
import { setCurrentRun, resetRunState } from '../store/runSlice';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);

  const handleStartResearch = async (topic: string) => {
    try {
      setLoading(true);
      dispatch(resetRunState());
      const run = await createRun(topic);
      dispatch(setCurrentRun(run));
      navigate(`/research/${run._id}`);
    } catch (err: any) {
      console.error('Failed to create research run:', err);
      alert(err.response?.data?.error || 'Failed to start research run. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Search,
      title: 'Claim Extraction Agent',
      desc: 'Deconstructs complex research topics into discrete, verifiable factual claims.',
    },
    {
      icon: Cpu,
      title: 'Tavily & Wiki Search Agent',
      desc: 'Scours web sources and authoritative repositories for corroborating evidence.',
    },
    {
      icon: CheckCircle2,
      title: 'Verification Agent',
      desc: 'Cross-evaluates claim semantics against source snippets to classify support level.',
    },
    {
      icon: Zap,
      title: 'Hallucination Agent',
      desc: 'Detects unsupported assertions, inter-claim conflicts, and source discrepancies.',
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Autonomous Multi-Agent Fact Verification Mesh
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Verify Claims with <br />
          <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
            Autonomous AI Agents
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Input any complex topic, hypothesis, or news story. FactMesh orchestrates 6 specialized AI agents to extract statements, pull live web evidence, audit hallucinations, and compile citation-backed reports.
        </p>

        {/* Search Input */}
        <div className="pt-4">
          <SearchInput onSubmit={handleStartResearch} loading={loading} />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto space-y-8 border-t border-border pt-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <Layers className="w-5 h-5 text-muted-foreground" />
            6-Stage Agent Pipeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Linear consensus graph executing real-time fact checking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-xl border border-border bg-card/60 hover:bg-card transition-all duration-200 space-y-3"
              >
                <div className="p-2.5 rounded-lg border border-border bg-muted w-fit text-foreground">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
