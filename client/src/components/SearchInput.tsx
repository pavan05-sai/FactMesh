import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface SearchInputProps {
  onSubmit: (topic: string) => void;
  loading?: boolean;
}

const EXAMPLE_TOPICS = [
  'James Webb Space Telescope discoveries about early galaxies',
  'Impact of Solid-State Batteries on EV energy density and safety',
  'CRISPR gene editing applications in sickle cell anemia treatments',
  'Quantum computing supremacy claims vs classical supercomputers',
];

export const SearchInput: React.FC<SearchInputProps> = ({ onSubmit, loading = false }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !loading) {
      onSubmit(topic.trim());
    }
  };

  const handleChipClick = (example: string) => {
    setTopic(example);
    onSubmit(example);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl focus-within:border-foreground/40 transition-all duration-300 overflow-hidden">
          <div className="pl-5 text-muted-foreground group-focus-within:text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter any claim, topic, or hypothesis to fact-check..."
            disabled={loading}
            className="w-full py-5 px-4 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />

          <div className="pr-3">
            <button
              type="submit"
              disabled={!topic.trim() || loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  Verify
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Or test with a sample topic:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TOPICS.map((example, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(example)}
              disabled={loading}
              className="text-left text-xs px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 border-dashed"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
