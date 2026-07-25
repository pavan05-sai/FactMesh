import React, { useState } from 'react';
import { Download, FileText, Code, Check, Copy } from 'lucide-react';
import { getExportUrl } from '../services/runService';

interface ExportButtonsProps {
  runId: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ runId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={getExportUrl(runId, 'pdf')}
        download
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-sm"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        PDF Report
      </a>

      <a
        href={getExportUrl(runId, 'markdown')}
        download
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4 text-blue-400" />
        Markdown
      </a>

      <a
        href={getExportUrl(runId, 'json')}
        download
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-sm"
      >
        <Code className="w-4 h-4 text-purple-400" />
        JSON Data
      </a>

      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-sm"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-muted-foreground" />
            Share Link
          </>
        )}
      </button>
    </div>
  );
};
