import api from './api';

export interface Source {
  title: string;
  url: string;
  snippet: string;
}

export interface Claim {
  _id: string;
  runId: string;
  text: string;
  evidence: string[];
  sources: Source[];
  verificationStatus: 'verified' | 'unsupported' | 'contradicted' | 'pending';
  confidenceScore: number;
  reasoning: string;
  contradictions: string[];
  createdAt: string;
}

export interface ConfidenceEntry {
  claimText: string;
  score: number;
  factors: string;
}

export interface Report {
  _id: string;
  runId: string;
  executiveSummary: string;
  verifiedClaims: string[];
  unsupportedClaims: string[];
  contradictions: string[];
  confidenceTable: ConfidenceEntry[];
  references: string[];
  generatedAt: string;
}

export interface AgentState {
  status: 'pending' | 'thinking' | 'done' | 'error';
  log: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Run {
  _id: string;
  userId: string;
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentStates: Record<string, AgentState>;
  claims: Claim[];
  report?: Report;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export async function createRun(topic: string): Promise<Run> {
  const res = await api.post<Run>('/api/runs', { topic });
  return res.data;
}

export async function getRuns(): Promise<Run[]> {
  const res = await api.get<Run[]>('/api/runs');
  return res.data;
}

export async function getRunById(id: string): Promise<Run> {
  const res = await api.get<Run>(`/api/runs/${id}`);
  return res.data;
}

export async function getReport(runId: string): Promise<Report> {
  const res = await api.get<Report>(`/api/runs/${runId}/report`);
  return res.data;
}

export function getExportUrl(runId: string, format: 'pdf' | 'markdown' | 'json'): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}/api/runs/${runId}/export/${format}`;
}
