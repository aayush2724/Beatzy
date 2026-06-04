import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicResult } from '../api/public';
import { usePageMeta } from '../hooks/usePageMeta';
import { Badge, Skeleton } from '../components/ui';

export default function PublicResult() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPublicResult(shareToken)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Result not found'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const spotify = data?.spotify_features
    ? typeof data.spotify_features === 'string' ? JSON.parse(data.spotify_features) : data.spotify_features
    : null;

  usePageMeta({
    title: data?.song_title || 'Shared Analysis',
    description: data
      ? `${data.song_title} by ${data.song_artist} — ${Math.round(data.bpm || 0)} BPM, ${data.mood} mood on Beatzy`
      : 'Shared music analysis on Beatzy',
    image: spotify?.cover_url,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-6">
        <p className="text-red-400 font-mono text-sm mb-6">{error}</p>
        <Link to="/" className="btn-primary px-6 py-3 text-xs">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-accent font-body">
      <nav className="border-b border-glass-border px-6 py-6 flex justify-between items-center">
        <Link to="/" className="font-display tracking-[0.2em] text-sm">BEATZY</Link>
        <Link to="/register" className="btn-primary px-5 py-2 text-xs">Try Beatzy</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {spotify?.cover_url && (
          <img src={spotify.cover_url} alt="" className="w-48 h-48 rounded-xl shadow-2xl mb-8 border border-glass-border" />
        )}
        <Badge variant="accent" className="mb-4">Shared analysis</Badge>
        <h1 className="font-display text-fluid-h1 uppercase tracking-tight mb-2">{data.song_title}</h1>
        <p className="text-muted text-lg mb-10">{data.song_artist}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'BPM', value: Math.round(data.bpm || 0) },
            { label: 'Key', value: data.key_signature || '—' },
            { label: 'Scale', value: data.scale || '—' },
            { label: 'Mood', value: data.mood || '—' },
          ].map((s) => (
            <div key={s.label} className="glass-panel p-4 text-center">
              <p className="font-mono text-[9px] text-muted uppercase mb-1">{s.label}</p>
              <p className="font-display text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-muted text-xs font-mono uppercase tracking-widest">
          Analyze your own tracks at{' '}
          <Link to="/register" className="text-accent underline">beatzy.app</Link>
        </p>
      </main>
    </div>
  );
}
