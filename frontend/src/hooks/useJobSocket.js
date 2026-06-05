/**
 * useJobSocket — connects to the backend Socket.IO server and
 * subscribes to real‑time job progress events.
 *
 * Usage:
 *   const { status, progress, error } = useJobSocket(jobId);
 *
 * The hook automatically connects/disconnects with the component lifecycle
 * and updates the global audioStore.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useAudioStore } from '../store/audioStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useJobSocket(jobId) {
  const token = useAuthStore((s) => s.token);
  const setIsAnalyzing = useAudioStore((s) => s.setIsAnalyzing);
  const setAnalysisResult = useAudioStore((s) => s.setAnalysisResult);
  const socketRef = useRef(null);
  const pollRef = useRef(null);

  const [status, setStatus] = useState('connecting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!jobId || pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/results/${jobId}`);
        const { status: s, data, progress: p, error: e } = res.data;

        if (s === 'processing') {
          setStatus('analyzing');
          setProgress(prev => Math.max(prev, p?.percent || 30));
        }

        if (s === 'complete') {
          clearPolling();
          setStatus('completed');
          setProgress(100);
          setIsAnalyzing(false);
          setAnalysisResult(data);
          toast.dismiss('socket-reconnecting');
        }

        if (s === 'failed') {
          clearPolling();
          setStatus('failed');
          setError(e || 'Analysis failed');
          setIsAnalyzing(false);
        }
      } catch (err) {
        // ignore poll errors silently
      }
    }, 3000);
  }, [jobId, setIsAnalyzing, setAnalysisResult, clearPolling]);

  const connect = useCallback(() => {
    if (!token) return;

    // Disconnect any existing socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });

    socket.on('connect', () => {
      setStatus('connected');
      toast.dismiss('socket-reconnecting');
    });

    socket.on('job:progress', (data) => {
      if (data.jobId !== jobId) return;
      setStatus(data.status);
      setProgress(data.progress);
      if (data.status === 'analyzing') setIsAnalyzing(true);
    });

    socket.on('job:completed', (data) => {
      if (data.jobId !== jobId) return;
      clearPolling();
      setStatus('completed');
      setProgress(100);
      setIsAnalyzing(false);
    });

    socket.on('job:failed', (data) => {
      if (data.jobId !== jobId) return;
      clearPolling();
      setStatus('failed');
      setError(data.error);
      setIsAnalyzing(false);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err.message);
      setStatus('polling');
    });

    socket.on('reconnect_failed', () => {
      toast.error('Failed to connect to real-time server', { id: 'socket-reconnecting' });
    });

    socketRef.current = socket;
  }, [token, jobId, setIsAnalyzing, clearPolling]);

  useEffect(() => {
    if (jobId) startPolling();
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [jobId, startPolling]);

  useEffect(() => {
    connect();
    return () => {
      clearPolling();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect, clearPolling]);

  // Return a getter function instead of the stale ref value
  return { status, progress, error, getSocket: () => socketRef.current };
}