import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSystemStatus } from '../api/public';
import { usePageMeta } from '../hooks/usePageMeta';
import { Badge, Skeleton } from '../components/ui';

const STATUS_COLORS = {
  ok: 'success',
  operational: 'success',
  unavailable: 'warning',
  degraded: 'warning',
  error: 'danger',
  unknown: 'muted',
};

export default function Status() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMeta({ title: 'System Status', description: 'Beatzy platform health and service status.' });

  useEffect(() => {
    getSystemStatus()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Could not reach status endpoint'))
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      getSystemStatus().then(({ data: res }) => setData(res.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-accent font-body">
      <nav className="border-b border-glass-border px-6 py-6">
        <Link to="/" className="font-display tracking-[0.2em] text-sm">BEATZY</Link>
      </nav>
      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="font-display text-fluid-h1 uppercase tracking-tight mb-2">Status</h1>
        {loading ? (
          <Skeleton className="h-24 w-full mt-8" />
        ) : error ? (
          <p className="text-red-400 mt-8 font-mono text-sm">{error}</p>
        ) : (
          <>
            <Badge variant={STATUS_COLORS[data.status] || 'muted'} className="mt-6 mb-8 text-sm">
              {data.status}
            </Badge>
            <ul className="space-y-3">
              {Object.entries(data.checks || {}).map(([name, status]) => (
                <li key={name} className="glass-panel p-4 flex justify-between border border-glass-border">
                  <span className="font-mono text-xs uppercase tracking-widest">{name}</span>
                  <Badge variant={STATUS_COLORS[status] || 'muted'}>{status}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-mono text-[9px] text-muted uppercase">
              Updated {new Date(data.timestamp).toLocaleString()}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
