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
import { useAuthStore } from '../store/authStore';
import { useAudioStore } from '../store/audioStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useJobSocket(jobId) {
  const token = useAuthStore((s) => s.token);
  const setIsAnalyzing = useAudioStore((s) => s.setIsAnalyzing);
  const socketRef = useRef(null);

  const [status, setStatus] = useState('connecting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

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
      setStatus('completed');
      setProgress(100);
      setIsAnalyzing(false);
    });

    socket.on('job:failed', (data) => {
      if (data.jobId !== jobId) return;
      setStatus('failed');
      setError(data.error);
      setIsAnalyzing(false);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err.message);
      setStatus('error');
      setError(err.message);
      toast.loading('Connecting to server...', { id: 'socket-reconnecting' });
    });

    socket.on('reconnect_failed', () => {
      toast.error('Failed to connect to real-time server', { id: 'socket-reconnecting' });
    });

    socketRef.current = socket;
  }, [token, jobId, setIsAnalyzing]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  // Return a getter function instead of the stale ref value
  return { status, progress, error, getSocket: () => socketRef.current };
}