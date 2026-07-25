import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from './useRedux';
import { updateAgentStatus, AgentStatusEvent } from '../store/runSlice';
import { getRunById } from '../services/runService';
import { setCurrentRun } from '../store/runSlice';

export function useSocket(runId?: string) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!runId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected, joining run room:', runId);
      socket.emit('join:run', runId);
    });

    socket.on('agent:status', (data: AgentStatusEvent) => {
      console.log('Agent status update received:', data);
      dispatch(updateAgentStatus(data));
    });

    socket.on('run:complete', async () => {
      console.log('Run complete notification received for:', runId);
      try {
        const updatedRun = await getRunById(runId);
        dispatch(setCurrentRun(updatedRun));
      } catch (err) {
        console.error('Failed to refetch completed run details:', err);
      }
    });

    socket.on('run:error', async () => {
      console.log('Run error notification received for:', runId);
      try {
        const updatedRun = await getRunById(runId);
        dispatch(setCurrentRun(updatedRun));
      } catch (err) {
        console.error('Failed to refetch failed run details:', err);
      }
    });

    return () => {
      socket.emit('leave:run', runId);
      socket.disconnect();
    };
  }, [runId, dispatch]);

  return socketRef.current;
}
