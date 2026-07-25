import api from './api';
import { Run } from './runService';

export interface DashboardStats {
  totalRuns: number;
  completedRuns: number;
  totalClaims: number;
  verifiedClaims: number;
  unsupportedClaims: number;
  contradictedClaims: number;
  verifiedPercentage: number;
  avgConfidence: number;
  recentRuns: Run[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/api/dashboard/stats');
  return res.data;
}
