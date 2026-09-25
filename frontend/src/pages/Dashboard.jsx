import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ArrowUpRight, Clock, Disc3, History as HistoryIcon, KeyRound, Music2, Waves } from 'lucide-react';
import { getHistory } from '../api/audio';
import { getSystemStatus } from '../api/public';
import { useAuthStore } from '../store/authStore';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SectionHeader,
  Skeleton,
  StatTile,
  StatusDot,
} from '../components/ui';
import { usePalette } from '../lib/palette';

function timeAgo(value) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function mostCommon(values) {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  let best = null;
  for (const [v, n] of counts) if (!best || n > best[1]) best = [v, n];
  return best?.[0] ?? null;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-raised px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="font-medium text-ink">{payload[0].payload.name}</p>
      <p className="mt-0.5 tabular-nums text-brand">{payload[0].value} BPM</p>
    </div>
  );
};

// `/api/public/status` reports strings for services and a boolean for storage.
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

const STATUS_ROWS = [
  ['backend', 'API'],
  ['database', 'Database'],
  ['redis', 'Queue'],
  ['ml', 'Analysis service'],
  ['ml_storage', 'Audio storage'],
];

export default function Dashboard() {
  const c = usePalette();
  const user = useAuthStore((s) => s.user);
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    getHistory(1, 8)
      .then(({ data }) => {
        setHistory(data.data.jobs);
        setTotal(data.data.pagination?.total ?? data.data.jobs.length);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load your dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    getSystemStatus()
      .then(({ data }) => setStatus(data.data))
      .catch(() => setStatus({ status: 'unreachable', checks: {} }));
  }, []);

  const completed = useMemo(() => history.filter((j) => j.status === 'completed'), [history]);

  const stats = useMemo(() => {
    const tempos = completed.map((j) => Number(j.bpm)).filter((n) => n > 0);
    const avgBpm = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null;
    const key = mostCommon(completed.map((j) => j.scale || j.key_signature));
    const last = history[0]?.created_at;
    return { avgBpm, key, last };
  }, [completed, history]);

  const chartData = useMemo(
    () =>
      completed
        .filter((j) => j.bpm)
        .map((j, i) => ({ name: j.song_title || `Track ${i + 1}`, bpm: Math.round(j.bpm) }))
        .reverse(),
    [completed],
  );

  const firstName = user?.name?.split(' ')[0];
  const overallTone = status ? toneFor(status.status === 'operational' ? 'ok' : status.status) : 'neutral';

  return (
    <PageWrapper className="space-y-10 pb-16">
      <PageHeader
        eyebrow="Dashboard"
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Your recent analyses, a read on the tempos you've been working with, and the state of the service."
        actions={
          <>
            <Link to="/history" className="btn-secondary inline-flex items-center gap-2 text-sm">
              <HistoryIcon className="h-4 w-4" /> History
            </Link>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Waves className="h-4 w-4" /> Analyze a track
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatTile label="Tracks analysed" value={total} icon={Disc3} hint="All time" />
            <StatTile
              label="Average tempo"
              value={stats.avgBpm ? `${stats.avgBpm} BPM` : '—'}
              icon={Activity}
              hint="Across your recent tracks"
            />
            <StatTile label="Most common key" value={stats.key || '—'} icon={KeyRound} hint="Across your recent tracks" />
            <StatTile label="Last analysis" value={timeAgo(stats.last) || '—'} icon={Clock} hint={stats.last ? new Date(stats.last).toLocaleDateString() : 'Nothing yet'} />
          </>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Recent */}
        <section className="col-span-12 space-y-5 xl:col-span-8">
          <SectionHeader
            title="Recent analyses"
            description="The last few tracks you ran through Beatzy."
            action={
              <Link to="/history" className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand hover:text-brand-hover">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : error ? (
            <EmptyState
              icon={Music2}
              title="Couldn't load your tracks"
              description={error}
              action={<button onClick={fetchDashboard} className="btn-secondary text-sm">Try again</button>}
            />
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {history.slice(0, 4).map((job) => <GlassRecordSleeve key={job.id} job={job} />)}
            </div>
          ) : (
            <EmptyState
              icon={Music2}
              title="No tracks yet"
              description="Upload a file, record a snippet, or search the catalog to run your first analysis."
              action={<Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-sm">Analyze a track</Link>}
            />
          )}
        </section>

        {/* Side column */}
        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <Card>
            <SectionHeader title="Tempo trend" description="BPM of your recent tracks, oldest to newest." />
            <div className="mt-5 h-44 w-full text-[0.625rem]">
              {chartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="dashBpm" x1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c.brand} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={c.brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.lineSubtle || c.line} vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: c.line }} />
                    <Area type="monotone" dataKey="bpm" stroke={c.brand} strokeWidth={2} fill="url(#dashBpm)" animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line-subtle text-[0.8125rem] text-ink-faint">
                  Analyse two or more tracks to see a trend
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <SectionHeader title="Service status" description="Live checks from the API." />
              <Badge variant={overallTone === 'ok' ? 'ok' : overallTone === 'neutral' ? 'neutral' : 'danger'} dot>
                {status ? (status.status === 'operational' ? 'Operational' : labelFor(status.status)) : 'Checking…'}
              </Badge>
            </div>
            <ul className="mt-4 divide-y divide-line-subtle">
              {STATUS_ROWS.map(([key, label]) => {
                const value = status?.checks?.[key];
                return (
                  <li key={key} className="flex items-center justify-between py-2.5 text-[0.8125rem]">
                    <span className="text-ink-muted">{label}</span>
                    <StatusDot tone={status ? toneFor(value) : 'neutral'}>
                      <span className="text-ink-muted">{status ? labelFor(value) : '…'}</span>
                    </StatusDot>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>

      {/* Call to action */}
      <Card padding="lg" className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Analyze a new track</h2>
          <p className="max-w-xl text-sm text-ink-muted">
            Upload up to 50 MB of audio. Beatzy identifies the song and returns tempo, key, chords, mood and lyrics in a few seconds.
          </p>
        </div>
        <Link to="/upload" className="btn-primary inline-flex shrink-0 items-center gap-2 text-sm">
          Start <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Card>
    </PageWrapper>
  );
}
