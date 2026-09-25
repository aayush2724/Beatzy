import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  Activity,
  ArrowUpRight,
  Clock,
  Download,
  FileText,
  Hand,
  Heart,
  KeyRound,
  Music,
  Pause,
  Play,
  Plus,
  Radio,
  Share2,
  Sparkles,
} from 'lucide-react';
import { getResults, searchSongs } from '../api/audio';
import { enableShare, exportReport, addFavorite } from '../api/library';
import InstrumentChordPanel from '../components/InstrumentChordPanel';
import GestureChordStage from '../components/GestureChordStage';
import PageWrapper from '../components/PageWrapper';
import placeholderArt from '../assets/placeholder-art.svg';
import {
  Badge,
  Card,
  DataList,
  EmptyState,
  IconButton,
  Progress,
  SectionHeader,
  Skeleton,
  StatTile,
  StatusDot,
  Tabs,
} from '../components/ui';
import { usePalette } from '../lib/palette';

const MOOD_TONE = {
  happy: 'warm',
  energetic: 'warm',
  excited: 'warm',
  calm: 'brand',
  serene: 'brand',
  sad: 'neutral',
  melancholic: 'neutral',
  depressed: 'neutral',
  angry: 'danger',
  neutral: 'neutral',
};

const SOURCE_LABEL = {
  shazam: 'Shazam',
  acrcloud: 'ACRCloud',
  acoustid: 'AcoustID',
  itunes: 'iTunes catalog',
  filename: 'File name',
  microphone: 'Microphone',
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseJSON(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function Results() {
  const c = usePalette();
  const { jobId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [chordMode, setChordMode] = useState('view');
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      for (let attempt = 0; attempt < 40; attempt++) {
        // `status` and `error` live at the top level of the response, not in `data`.
        const { data } = await getResults(jobId);
        if (data.status === 'failed') {
          throw new Error(data.error || 'Analysis failed');
        }
        if (data.status === 'complete' && data.data) {
          setResult(data.data);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      throw new Error('Analysis is still in progress. Try again shortly.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const spotifyMeta = useMemo(() => parseJSON(result?.spotify_features), [result]);
  const mlData = useMemo(() => parseJSON(result?.raw_ml_response), [result]);

  // Source audio is deleted once the analysis is saved, so `audio_url` is
  // normally empty. The identified track's 30-second catalog preview is the
  // next best thing — and its CDN allows cross-origin playback. Enrichment
  // only stores one when it went through iTunes, so look it up when missing.
  const [lookedUpPreview, setLookedUpPreview] = useState(null);
  useEffect(() => {
    setLookedUpPreview(null);
    if (!result || result.audio_url || spotifyMeta?.preview_url) return;
    if (!result.song_title || result.song_title === 'Live Recording') return;
    let cancelled = false;
    searchSongs(`${result.song_title} ${result.song_artist || ''}`.trim(), 3)
      .then(({ data }) => {
        const hit = (data.data || []).find((t) => t.preview_url);
        if (!cancelled && hit) setLookedUpPreview(hit.preview_url);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [result, spotifyMeta]);

  const audioSrc = result?.audio_url || spotifyMeta?.preview_url || lookedUpPreview || null;
  const audioIsPreview = Boolean(audioSrc) && !result?.audio_url;

  useEffect(() => {
    if (!result || !waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: c.lineStrong,
      progressColor: c.brand,
      cursorColor: c.brand,
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 64,
      normalize: true,
    });
    wavesurfer.current = ws;
    setAudioReady(false);

    if (audioSrc) {
      ws.load(audioSrc).catch((err) => {
        console.warn('[results] audio unavailable', err?.message);
      });
    }

    ws.on('ready', () => {
      setAudioReady(true);
      setDuration(ws.getDuration());
    });
    ws.on('timeupdate', (t) => setCurrentTime(t));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => ws.destroy();
  }, [result, audioSrc, c.brand, c.lineStrong]);

  // Gesture mode plays chords over the track, so duck the track.
  useEffect(() => {
    wavesurfer.current?.setVolume(chordMode === 'play' ? 0.3 : 1);
  }, [chordMode]);

  const chords = useMemo(() => {
    const normalize = (segments) =>
      (Array.isArray(segments) ? segments : []).map((s) => ({
        chord: s.chord,
        start_time: s.start_time ?? s.start ?? 0,
        end_time: s.end_time ?? s.end ?? 0,
      }));
    const fromMl = normalize(mlData?.audio?.chord_timeline);
    if (fromMl.length) return fromMl;
    return normalize(parseJSON(result?.chords));
  }, [result, mlData]);

  const currentChord = useMemo(
    () => chords.find((s) => currentTime >= s.start_time && currentTime <= s.end_time)?.chord || null,
    [chords, currentTime],
  );

  const mlLyrics = mlData?.lyrics;
  const lyricsText = (mlLyrics && typeof mlLyrics === 'object' ? mlLyrics.plain : mlLyrics) || result?.lyrics || null;

  const lyricLines = useMemo(() => {
    if (result?.synced_lyrics) {
      return result.synced_lyrics
        .split('\n')
        .map((line) => {
          const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
          if (!match) return null;
          const time = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + parseInt(match[3], 10) / 100;
          return { time, text: match[4].trim() };
        })
        .filter((l) => l && l.text);
    }
    return (lyricsText || '')
      .split('\n')
      .map((text) => ({ time: null, text: text.trim() }))
      .filter((l) => l.text);
  }, [result, lyricsText]);

  const currentLyricIdx = useMemo(() => {
    if (!result?.synced_lyrics) return -1;
    let idx = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (currentTime >= lyricLines[i].time) idx = i;
      else break;
    }
    return idx;
  }, [lyricLines, currentTime, result]);

  const yamnet = useMemo(() => {
    const labels = parseJSON(result?.yamnet_labels) || [];
    const scores = parseJSON(result?.confidence_scores) || [];
    return labels.slice(0, 4).map((label, i) => ({ label, score: Math.round((scores[i] || 0) * 100) }));
  }, [result]);

  async function handleShare() {
    try {
      const { data } = await enableShare(jobId);
      await navigator.clipboard.writeText(data.data.shareUrl);
      toast.success('Share link copied');
    } catch {
      toast.error("Couldn't create a share link");
    }
  }

  async function handleExport() {
    try {
      const { data } = await exportReport(jobId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `beatzy-${jobId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error("Couldn't export the report");
    }
  }

  async function handleFavorite() {
    try {
      await addFavorite(jobId);
      toast.success('Saved to your library');
    } catch {
      toast.error("Couldn't save this track");
    }
  }

  if (loading) {
    return (
      <PageWrapper className="space-y-8 pb-16">
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 h-72 rounded-2xl xl:col-span-8" />
          <Skeleton className="col-span-12 h-72 rounded-2xl xl:col-span-4" />
        </div>
        <p className="text-center text-sm text-ink-muted">Loading the analysis…</p>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="py-24">
        <EmptyState
          icon={Radio}
          title="Couldn't load this analysis"
          description={error}
          className="mx-auto max-w-lg"
          action={
            <div className="flex gap-3">
              <button onClick={fetchResults} className="btn-secondary text-sm">Try again</button>
              <Link to="/upload" className="btn-primary inline-flex items-center text-sm">Analyze another track</Link>
            </div>
          }
        />
      </PageWrapper>
    );
  }

  if (!result) return null;

  const isLiveRecording = result.song_title === 'Live Recording' && result.song_artist === 'Unknown';
  const title = isLiveRecording ? 'Live recording' : result.song_title || 'Untitled track';
  const artist = isLiveRecording ? 'Not identified' : result.song_artist || 'Unknown artist';
  const coverUrl = spotifyMeta?.cover_url || placeholderArt;
  const source = mlData?.song?.source;
  const keyLabel = result.scale || result.key_signature || '—';
  const energy = Number.isFinite(Number(result.energy_level)) ? Math.round(Number(result.energy_level) * 100) : null;
  const analysedAt = result.job_created_at ? new Date(result.job_created_at).toLocaleString() : null;

  const detailRows = [
    { label: 'Album', value: result.song_album || '—' },
    { label: 'Released', value: result.song_release_year || spotifyMeta?.release_date?.slice(0, 4) || '—' },
    { label: 'Time signature', value: result.time_signature || '—' },
    { label: 'Identified via', value: SOURCE_LABEL[source] || (source ? source : '—') },
    { label: 'ISRC', value: result.isrc || '—' },
    { label: 'Lyrics from', value: result.lyrics_source || (lyricsText ? 'Analysis service' : '—') },
    { label: 'Analysed', value: analysedAt || '—' },
  ];

  return (
    <PageWrapper className="space-y-8 pb-16">
      {/* Header */}
      <Card padding="lg" className="overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
          <img src={coverUrl} alt="" className="h-full w-full scale-125 object-cover blur-[90px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/60" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end">
          <img
            src={coverUrl}
            alt=""
            className="h-36 w-36 shrink-0 rounded-xl border border-line object-cover shadow-[var(--shadow-md)] md:h-44 md:w-44"
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isLiveRecording ? 'neutral' : 'brand'} dot>{isLiveRecording ? 'Recording' : 'Identified'}</Badge>
              {result.mood && <Badge variant={MOOD_TONE[result.mood] || 'neutral'} className="capitalize">{result.mood}</Badge>}
              {source === 'microphone' && !isLiveRecording && <Badge variant="neutral">From microphone</Badge>}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">{title}</h1>
              <p className="mt-1 truncate text-lg text-ink-muted">{artist}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <IconButton aria-label="Save to library" onClick={handleFavorite}><Heart className="h-4 w-4" /></IconButton>
              <IconButton aria-label="Copy share link" onClick={handleShare}><Share2 className="h-4 w-4" /></IconButton>
              <IconButton aria-label="Download JSON report" onClick={handleExport}><Download className="h-4 w-4" /></IconButton>
              <Link to="/upload" className="btn-primary ml-1 inline-flex items-center gap-2 text-sm !px-5 !py-2.5">
                <Plus className="h-4 w-4" /> Analyze another
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Tempo" value={result.bpm ? Math.round(result.bpm) : '—'} hint="beats per minute" icon={Clock} />
        <StatTile label="Key" value={keyLabel} hint={result.key_signature && result.scale ? `Tonic ${result.key_signature}` : 'estimated from the harmonic content'} icon={KeyRound} />
        <StatTile label="Energy" value={energy != null ? `${energy}%` : '—'} hint="loudness relative to full scale" icon={Activity}>
          {energy != null && <Progress value={energy} tone={energy > 66 ? 'warm' : 'brand'} />}
        </StatTile>
        <StatTile label="Mood" value={<span className="capitalize">{result.mood || '—'}</span>} hint={result.mood_confidence ? `${Math.round(result.mood_confidence * 100)}% confidence` : 'from tempo, energy and timbre'} icon={Sparkles} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 space-y-6 xl:col-span-8">
          {/* Player */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <SectionHeader
                title="Playback"
                description={
                  !audioSrc
                    ? 'Source audio is deleted after analysis and no preview is available for this track.'
                    : audioIsPreview
                      ? '30-second catalog preview — chords and lyrics follow along.'
                      : 'Your uploaded audio.'
                }
              />
              {audioSrc && (
                <StatusDot tone={isPlaying ? 'brand' : 'neutral'}>
                  <span className="text-ink-muted">{isPlaying ? 'Playing' : audioReady ? 'Ready' : 'Loading…'}</span>
                </StatusDot>
              )}
            </div>

            <div className="mt-5 flex items-center gap-5">
              <button
                type="button"
                onClick={() => wavesurfer.current?.playPause()}
                disabled={!audioSrc || !audioReady}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              </button>
              <div className="min-w-0 flex-1">
                <div ref={waveformRef} className={clsx('w-full', audioSrc ? 'cursor-pointer' : 'hidden')} />
                {!audioSrc && (
                  <div className="flex h-16 items-center rounded-xl border border-dashed border-line px-4 text-sm text-ink-faint">
                    No audio to play
                  </div>
                )}
                <div className="mt-2 flex justify-between text-xs tabular-nums text-ink-muted">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : '–:––'}</span>
                </div>
              </div>
            </div>

            {/* Chord timeline */}
            <div className="mt-6 border-t border-line-subtle pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-ink-muted">Chord timeline</p>
                <p className="text-xs text-ink-faint">{chords.length ? `${chords.length} changes` : ''}</p>
              </div>
              {chords.length ? (
                <div className="relative overflow-hidden rounded-xl border border-line-subtle bg-veil-1 py-3">
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-brand/60" />
                  <div
                    className="flex gap-2 pl-[50%] transition-transform duration-150 ease-linear"
                    style={{ transform: `translateX(-${currentTime * 72}px)` }}
                  >
                    {chords.map((s, i) => {
                      const active = currentTime >= s.start_time && currentTime <= s.end_time;
                      return (
                        <div
                          key={`${s.chord}-${s.start_time}-${i}`}
                          className={clsx(
                            'flex shrink-0 flex-col items-center justify-center rounded-lg border px-3 py-2 transition-colors',
                            active ? 'border-brand/50 bg-brand/10 text-ink' : 'border-line-subtle bg-surface text-ink-muted',
                          )}
                          style={{ width: Math.max(72, (s.end_time - s.start_time) * 72) }}
                        >
                          <span className="font-display text-base font-semibold">{s.chord}</span>
                          <span className="text-[0.6875rem] tabular-nums text-ink-faint">{formatTime(s.start_time)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-faint">No chords were detected in this track.</p>
              )}
            </div>
          </Card>

          {/* Lyrics */}
          <Card className="flex max-h-[34rem] flex-col">
            <SectionHeader
              title="Lyrics"
              description={result.synced_lyrics ? 'Synced to playback.' : lyricsText ? 'Plain text — no timing available.' : undefined}
              action={lyricLines.length ? <span className="text-xs text-ink-faint">{lyricLines.length} lines</span> : null}
            />
            <div className="custom-scrollbar mt-5 flex-1 space-y-3 overflow-y-auto pr-3">
              {lyricLines.length ? (
                lyricLines.map((line, i) => (
                  <p
                    key={i}
                    className={clsx(
                      'text-lg leading-snug transition-colors duration-300 md:text-xl',
                      result.synced_lyrics
                        ? i === currentLyricIdx ? 'font-medium text-ink' : 'text-ink-faint'
                        : 'text-ink-muted',
                    )}
                  >
                    {line.text}
                  </p>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-ink-faint">No lyrics were found for this track.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <Card>
            <SectionHeader title="Current chord" description="Follows the playhead." />
            <div className="mt-4 flex items-center justify-between">
              <span className="font-display text-5xl font-semibold tracking-tight text-ink">{currentChord || '—'}</span>
              <StatusDot tone={isPlaying ? 'brand' : 'neutral'}>
                <span className="text-ink-muted">{isPlaying ? 'Live' : 'Paused'}</span>
              </StatusDot>
            </div>
          </Card>

          <Card padding="none">
            <div className="flex items-center justify-between gap-4 border-b border-line-subtle px-6 py-4">
              <SectionHeader title="Chord tools" />
              <Tabs
                aria-label="Chord tool mode"
                value={chordMode}
                onChange={setChordMode}
                items={[
                  { id: 'view', label: 'Shapes', icon: Music },
                  { id: 'play', label: 'Gestures', icon: Hand },
                ]}
              />
            </div>
            <div className="p-4">
              {chordMode === 'play' ? <GestureChordStage chords={chords} /> : <InstrumentChordPanel chords={chords} />}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Details" />
            <DataList rows={detailRows} className="mt-2" />
            {yamnet.length > 0 && (
              <div className="mt-5 border-t border-line-subtle pt-4">
                <p className="mb-3 text-xs font-medium text-ink-muted">What it sounds like</p>
                <div className="space-y-3">
                  {yamnet.map((t) => (
                    <Progress key={t.label} label={t.label} display={`${t.score}%`} value={t.score} tone="neutral" />
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary mt-5 inline-flex w-full items-center justify-center gap-2 text-sm"
            >
              <FileText className="h-4 w-4" /> Download JSON report <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint" />
            </button>
          </Card>
        </aside>
      </div>
    </PageWrapper>
  );
}
