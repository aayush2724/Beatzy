import { useEffect, useState } from 'react';
import { getSystemStatus } from '../api/public';
import { usePageMeta } from '../hooks/usePageMeta';
import PublicShell from '../components/PublicShell';
import { Badge, Card, EmptyState, Skeleton, StatusDot } from '../components/ui';

const ROWS = [
  ['backend', 'API'],
  ['database', 'Database'],
  ['redis', 'Queue'],
  ['ml', 'Analysis service'],
  ['ml_storage', 'Audio storage'],
];

function toneFor(value) {
  if (value === 'ok' || value === true) return 'ok';
  if (value === 'unavailable' || value == null) return 'neutral';
  return 'danger';
}

function labelFor(value) {
  if (value === true) return 'Reachable';
  if (value === false) return 'Unreachable';
  if (value == null) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Status() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageMeta({ title: 'Status', description: 'Beatzy service status.' });

  useEffect(() => {
    const load = () =>
      getSystemStatus()
        .then(({ data: res }) => { setData(res.data); setError(null); })
        .catch(() => setError("Couldn't reach the status endpoint"))
        .finally(() => setLoading(false));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const operational = data?.status === 'operational';

  return (
    <PublicShell width="max-w-2xl">
      <header>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Status</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Service status</h1>
        <p className="mt-3 text-[0.9375rem] text-ink-muted">Live checks against each part of the service, refreshed every 30 seconds.</p>
      </header>

      <div className="mt-10">
        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : error ? (
          <EmptyState title="Status unavailable" description={error} />
        ) : (
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-line-subtle px-6 py-4">
              <p className="font-medium text-ink">{operational ? 'All systems operational' : 'Some systems are degraded'}</p>
              <Badge variant={operational ? 'ok' : 'danger'} dot>{operational ? 'Operational' : labelFor(data.status)}</Badge>
            </div>
            <ul className="divide-y divide-line-subtle px-6">
              {ROWS.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between py-3.5 text-sm">
                  <span className="text-ink">{label}</span>
                  <StatusDot tone={toneFor(data.checks?.[key])}>
                    <span className="text-ink-muted">{labelFor(data.checks?.[key])}</span>
                  </StatusDot>
                </li>
              ))}
            </ul>
            <p className="border-t border-line-subtle px-6 py-3 text-xs text-ink-faint">Updated {new Date(data.timestamp).toLocaleString()}</p>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
