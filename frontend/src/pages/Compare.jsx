import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getResults } from '../api/audio';
import PageWrapper from '../components/PageWrapper';
import { Button, Input, CardPanel } from '../components/ui';

function TrackPanel({ label, data, loading, error }) {
  if (loading) return <CardPanel><p className="font-mono text-xs text-muted animate-pulse">Loading…</p></CardPanel>;
  if (error) return <CardPanel><p className="text-red-400 text-sm">{error}</p></CardPanel>;
  if (!data) return <CardPanel><p className="text-muted text-sm">Enter a job ID</p></CardPanel>;

  return (
    <CardPanel>
      <p className="font-mono text-[10px] text-muted uppercase mb-2">{label}</p>
      <h3 className="font-display text-xl font-bold mb-1">{data.song_title || 'Unknown'}</h3>
      <p className="text-muted text-sm mb-6">{data.song_artist}</p>
      <dl className="grid grid-cols-2 gap-4 font-mono text-xs">
        <div><dt className="text-muted">BPM</dt><dd className="text-accent font-bold text-lg">{Math.round(data.bpm || 0)}</dd></div>
        <div><dt className="text-muted">Key</dt><dd className="text-accent font-bold">{data.key_signature || data.scale || '—'}</dd></div>
        <div><dt className="text-muted">Mood</dt><dd className="text-accent font-bold capitalize">{data.mood || '—'}</dd></div>
        <div><dt className="text-muted">Energy</dt><dd className="text-accent font-bold">{Math.round((data.energy_level || 0) * 100)}%</dd></div>
      </dl>
      <Link to={`/results/${data.job_id}`} className="inline-block mt-6 text-xs font-mono text-muted hover:text-accent uppercase tracking-widest">
        Full report →
      </Link>
    </CardPanel>
  );
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const [idA, setIdA] = useState(params.get('a') || '');
  const [idB, setIdB] = useState(params.get('b') || '');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ a: null, b: null });

  async function compare(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({ a: null, b: null });
    setParams({ a: idA, b: idB });

    const load = async (id) => {
      const { data } = await getResults(id);
      return data.data;
    };

    try {
      const [a, b] = await Promise.all([
        load(idA).catch((err) => { setErrors((e) => ({ ...e, a: err.message })); return null; }),
        load(idB).catch((err) => { setErrors((e) => ({ ...e, b: err.message })); return null; }),
      ]);
      setDataA(a);
      setDataB(b);
    } finally {
      setLoading(false);
    }
  }

  const bpmDiff = dataA?.bpm && dataB?.bpm ? Math.abs(dataA.bpm - dataB.bpm) : null;

  return (
    <PageWrapper className="space-y-10 pb-20">
      <header>
        <h1 className="font-display text-fluid-h1 uppercase tracking-tight">Compare</h1>
        <p className="text-muted text-sm mt-2">Side-by-side tempo, key, and mood — useful for harmonic mixing.</p>
      </header>

      <form onSubmit={compare} className="flex flex-wrap gap-4 items-end">
        <Input label="Track A (job ID)" value={idA} onChange={(e) => setIdA(e.target.value)} className="max-w-xs" />
        <Input label="Track B (job ID)" value={idB} onChange={(e) => setIdB(e.target.value)} className="max-w-xs" />
        <Button type="submit" disabled={!idA || !idB || loading}>{loading ? 'Comparing…' : 'Compare'}</Button>
      </form>

      {bpmDiff != null && (
        <p className="font-mono text-xs text-muted uppercase tracking-widest">
          Tempo delta: <span className="text-accent font-bold">{Math.round(bpmDiff)} BPM</span>
          {bpmDiff <= 6 && ' — compatible for beatmatching'}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <TrackPanel label="Track A" data={dataA} loading={loading} error={errors.a} />
        <TrackPanel label="Track B" data={dataB} loading={loading} error={errors.b} />
      </div>
    </PageWrapper>
  );
}
