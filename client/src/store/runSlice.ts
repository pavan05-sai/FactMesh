import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Run, Claim, Report } from '../services/runService';

export interface AgentStatusEvent {
  agentName: string;
  status: 'pending' | 'thinking' | 'done' | 'error';
  log: string;
  timestamp: string;
}

interface RunState {
  currentRun: Run | null;
  agentStatuses: Record<string, { status: string; log: string }>;
  claims: Claim[];
  report: Report | null;
  loading: boolean;
  error: string | null;
}

const initialState: RunState = {
  currentRun: null,
  agentStatuses: {
    research: { status: 'pending', log: '' },
    search: { status: 'pending', log: '' },
    verification: { status: 'pending', log: '' },
    hallucination: { status: 'pending', log: '' },
    confidence: { status: 'pending', log: '' },
    report: { status: 'pending', log: '' },
  },
  claims: [],
  report: null,
  loading: false,
  error: null,
};

const runSlice = createSlice({
  name: 'run',
  initialState,
  reducers: {
    setCurrentRun: (state, action: PayloadAction<Run>) => {
      state.currentRun = action.payload;
      state.claims = action.payload.claims || [];
      state.report = action.payload.report || null;
      if (action.payload.agentStates) {
        Object.entries(action.payload.agentStates).forEach(([key, val]) => {
          state.agentStatuses[key] = {
            status: val.status,
            log: val.log,
          };
        });
      }
    },
    updateAgentStatus: (state, action: PayloadAction<AgentStatusEvent>) => {
      const { agentName, status, log } = action.payload;
      state.agentStatuses[agentName] = { status, log };
    },
    setRunLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRunError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetRunState: (state) => {
      state.currentRun = null;
      state.agentStatuses = {
        research: { status: 'pending', log: '' },
        search: { status: 'pending', log: '' },
        verification: { status: 'pending', log: '' },
        hallucination: { status: 'pending', log: '' },
        confidence: { status: 'pending', log: '' },
        report: { status: 'pending', log: '' },
      };
      state.claims = [];
      state.report = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setCurrentRun,
  updateAgentStatus,
  setRunLoading,
  setRunError,
  resetRunState,
} = runSlice.actions;

export default runSlice.reducer;
