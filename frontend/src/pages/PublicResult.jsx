import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Clock, KeyRound, Sparkles } from 'lucide-react';
import { getPublicResult } from '../api/public';
import { usePageMeta } from '../hooks/usePageMeta';
import PublicShell from '../components/PublicShell';
import placeholderArt from '../assets/placeholder-art.svg';
import { Badge, Card, EmptyState, Skeleton, StatTile } from '../components/ui';

export default function PublicResult() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPublicResult(shareToken)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'This shared result was not found'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const meta = data?.spotify_features
    ? typeof data.spotify_features === 'string' ? JSON.parse(data.spotify_features) : data.spotify_features
    : null;

  usePageMeta({
    title: data?.song_title || 'Shared analysis',
    description: data ? `${data.song_title} by ${data.song_artist} — ${Math.round(data.bpm || 0)} BPM, ${data.scale || data.key_signature || ''}, ${data.mood || ''} on Beatzy` : 'A shared music analysis on Beatzy',
    image: meta?.cover_url,
  });

  return (
    <PublicShell width="max-w-4xl">
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        </div>
      ) : error ? (
        <EmptyState title="Nothing here" description={error} action={<Link to="/" className="btn-primary inline-flex items-center text-sm">Go to Beatzy</Link>} />
      ) : (
        <div className="space-y-6">
          <Card padding="lg" className="flex flex-col gap-6 md:flex-row md:items-end">
            <img src={meta?.cover_url || placeholderArt} alt="" className="h-40 w-40 shrink-0 rounded-xl border border-line object-cover shadow-[var(--shadow-md)]" />
            <div className="min-w-0 flex-1">
              <Badge variant="brand" dot>Shared analysis</Badge>
              <h1 className="mt-3 truncate font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{data.song_title || 'Untitled track'}</h1>
              <p className="mt-1 truncate text-lg text-ink-muted">{data.song_artist || 'Unknown artist'}</p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile label="Tempo" value={data.bpm ? Math.round(data.bpm) : '—'} hint="beats per minute" icon={Clock} />
            <StatTile label="Key" value={data.scale || data.key_signature || '—'} icon={KeyRound} />
            <StatTile label="Energy" value={data.energy_level != null ? `${Math.round(data.energy_level * 100)}%` : '—'} icon={Activity} />
            <StatTile label="Mood" value={<span className="capitalize">{data.mood || '—'}</span>} icon={Sparkles} />
          </div>

          <Card className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-medium text-ink">Analyse your own tracks</p>
              <p className="text-sm text-ink-muted">Identification, tempo, key, chords, mood and lyrics — free to start.</p>
            </div>
            <Link to="/register" className="btn-primary inline-flex items-center text-sm">Try Beatzy</Link>
          </Card>
        </div>
      )}
    </PublicShell>
  );
}
