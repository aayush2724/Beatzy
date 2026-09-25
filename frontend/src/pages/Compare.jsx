import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRightLeft, ArrowUpRight } from 'lucide-react';
import { getHistory, getResults } from '../api/audio';
import PageWrapper from '../components/PageWrapper';
import { Badge, Button, Card, DataList, EmptyState, PageHeader, SectionHeader, Skeleton } from '../components/ui';

const selectClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20';

function trackLabel(job) {
  const title = job.song_title || job.original_filename || 'Untitled';
  return job.song_artist ? `${title} — ${job.song_artist}` : title;
}

function TrackCard({ label, data, loading, error }) {
  if (loading) return <Skeleton className="h-72 rounded-2xl" />;
  if (error) return <EmptyState title={`${label}: couldn't load`} description={error} />;
  if (!data) return <EmptyState title={label} description="Pick a track above." />;

  const rows = [
    { label: 'Tempo', value: data.bpm ? `${Math.round(data.bpm)} BPM` : '—' },
    { label: 'Key', value: data.scale || data.key_signature || '—' },
    { label: 'Mood', value: <span className="capitalize">{data.mood || '—'}</span> },
    { label: 'Energy', value: data.energy_level != null ? `${Math.round(data.energy_level * 100)}%` : '—' },
    { label: 'Time signature', value: data.time_signature || '—' },
  ];

  return (
    <Card>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <h3 className="mt-1 truncate font-display text-xl font-semibold tracking-tight text-ink">{data.song_title || 'Untitled track'}</h3>
      <p className="truncate text-sm text-ink-muted">{data.song_artist || 'Unknown artist'}</p>
      <DataList rows={rows} className="mt-4" />
      <Link to={`/results/${data.job_id}`} className="mt-4 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand hover:text-brand-hover">
        Full analysis <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const [tracks, setTracks] = useState([]);
  const [idA, setIdA] = useState(params.get('a') || '');
  const [idB, setIdB] = useState(params.get('b') || '');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ a: null, b: null });

  useEffect(() => {
    getHistory(1, 50)
      .then(({ data }) => setTracks(data.data.jobs.filter((j) => j.status === 'completed')))
      .catch(() => setTracks([]));
  }, []);

  async function compare(e) {
    e?.preventDefault();
    if (!idA || !idB) return;
    setLoading(true);
    setErrors({ a: null, b: null });
    setParams({ a: idA, b: idB });

    const load = async (id) => {
      const { data } = await getResults(id);
      if (data.status === 'failed') throw new Error(data.error || 'Analysis failed');
      if (data.status !== 'complete') throw new Error('Analysis is still in progress');
      return data.data;
    };

    try {
      const [a, b] = await Promise.all([
        load(idA).catch((err) => { setErrors((s) => ({ ...s, a: err.message })); return null; }),
        load(idB).catch((err) => { setErrors((s) => ({ ...s, b: err.message })); return null; }),
      ]);
      setDataA(a);
      setDataB(b);
    } finally {
      setLoading(false);
    }
  }

  // Deep links (`?a=…&b=…`) load straight away. Runs once on mount by design.
  useEffect(() => {
    if (params.get('a') && params.get('b') && !dataA && !dataB) compare();
  }, []);

  const summary = useMemo(() => {
    if (!dataA?.bpm || !dataB?.bpm) return null;
    const delta = Math.abs(dataA.bpm - dataB.bpm);
    const sameKey = (dataA.scale || dataA.key_signature) === (dataB.scale || dataB.key_signature);
    return { delta: Math.round(delta), beatmatch: delta <= 6, sameKey };
  }, [dataA, dataB]);

  return (
    <PageWrapper className="space-y-8 pb-16">
      <PageHeader
        eyebrow="Compare"
        title="Compare two tracks"
        description="Tempo, key and mood side by side — handy for harmonic mixing and set planning."
      />

      <Card>
        <form onSubmit={compare} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Track A</span>
            <select className={selectClass} value={idA} onChange={(e) => setIdA(e.target.value)}>
              <option value="">Choose a track</option>
              {tracks.map((j) => <option key={j.id} value={j.id}>{trackLabel(j)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Track B</span>
            <select className={selectClass} value={idB} onChange={(e) => setIdB(e.target.value)}>
              <option value="">Choose a track</option>
              {tracks.map((j) => <option key={j.id} value={j.id}>{trackLabel(j)}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!idA || !idB || idA === idB || loading} className="!h-11 !py-0">
            <ArrowRightLeft className="mr-2 inline h-4 w-4" />{loading ? 'Comparing…' : 'Compare'}
          </Button>
        </form>
        {tracks.length === 0 && (
          <p className="mt-3 text-xs text-ink-faint">You need at least two completed analyses to compare.</p>
        )}
      </Card>

      {summary && (
        <Card padding="sm" className="flex flex-wrap items-center gap-3">
          <SectionHeader title="Verdict" />
          <Badge variant={summary.beatmatch ? 'ok' : 'neutral'} dot>
            {summary.delta} BPM apart{summary.beatmatch ? ' — beatmatchable' : ''}
          </Badge>
          <Badge variant={summary.sameKey ? 'ok' : 'neutral'} dot>{summary.sameKey ? 'Same key' : 'Different keys'}</Badge>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <TrackCard label="Track A" data={dataA} loading={loading} error={errors.a} />
        <TrackCard label="Track B" data={dataB} loading={loading} error={errors.b} />
      </div>
    </PageWrapper>
  );
}
