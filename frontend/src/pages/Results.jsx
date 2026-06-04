import { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';
import { enableShare, exportReport, addFavorite } from '../api/library';
import InstrumentChordPanel from '../components/InstrumentChordPanel';
import PageWrapper from '../components/PageWrapper';

const ResultsAtmosphere = lazy(() => import('../components/ResultsAtmosphere'));

import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

function StatCard({ icon, label, value, sub, color = 'text-primary' }) {
  return (
    <motion.div
      className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-white/20 transition-all group cursor-default"
    >
      <div className="flex justify-between items-start">
        <span className={`material-symbols-outlined text-xl ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </span>
        <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-4">
        <div className={`text-2xl font-mono font-bold text-white tracking-tight`}>{value}</div>
        {sub && <div className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function Results() {
  const { jobId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      for (let attempt = 0; attempt < 40; attempt++) {
        const { data } = await getResults(jobId);
        const payload = data.data;
        if (payload?.status === 'processing' || payload?.status === 'queued') {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        if (payload?.song_title != null || payload?.bpm != null || payload?.raw_ml_response) {
          setResult(payload);
          return;
        }
        if (payload?.status === 'failed') {
          throw new Error(payload.error_message || 'Analysis failed');
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

  useEffect(() => {
    if (!result || !waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'var(--color-primary)',
      cursorColor: 'var(--color-secondary)',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 60,
      normalize: true,
    });

    // In a real app, we'd use the stored audio URL. For demo, we might use a placeholder or need the actual file.
    // If the result has an S3 URL or similar, use it.
    if (result.audio_url) {
        wavesurfer.current.load(result.audio_url);
    }

    wavesurfer.current.on('timeupdate', (t) => setCurrentTime(t));
    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => wavesurfer.current.destroy();
  }, [result]);

  const mlData = useMemo(() => {
    try {
      const raw = result?.raw_ml_response;
      if (!raw) return null;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }, [result]);

  const normalizeChords = (segments) =>
    (Array.isArray(segments) ? segments : []).map((c) => ({
      chord: c.chord,
      start_time: c.start_time ?? c.start ?? 0,
      end_time: c.end_time ?? c.end ?? 0,
    }));

  const chords = useMemo(() => {
    const fromMl = normalizeChords(mlData?.audio?.chord_timeline);
    if (fromMl.length) return fromMl;
    try {
      const raw = result?.chords;
      if (!raw) return [];
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return normalizeChords(parsed);
    } catch {
      return [];
    }
  }, [result, mlData]);

  const lyricsText = mlData?.lyrics || result?.lyrics || null;
  const chordSegments = chords;

  const currentChord = useMemo(() => {
    return chords.find(c => currentTime >= c.start_time && currentTime <= c.end_time)?.chord || 'N.C.';
  }, [chords, currentTime]);

  const lyricLines = useMemo(() => {
    const raw = result?.synced_lyrics || lyricsText || '';
    if (result?.synced_lyrics) {
        // Parse LRC format: [mm:ss.xx] Lyrics
        return raw.split('\n').map(line => {
            const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
            if (match) {
                const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
                return { time, text: match[4].trim() };
            }
            return null;
        }).filter(Boolean);
    }
    return raw.split('\n').map(text => ({ time: 0, text: text.trim() })).filter(l => l.text);
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

  if (loading) {
    return (
      <PageWrapper className="py-24">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/3 animate-pulse rounded-full" />
          </div>
          <p className="font-mono text-primary text-xs uppercase tracking-widest animate-pulse">Loading analysis…</p>
        </div>
      </PageWrapper>
    );
  }
  if (error) {
    return (
      <PageWrapper className="py-24">
        <div className="max-w-md mx-auto text-center glass-panel p-10 border border-red-500/20 space-y-6">
          <span className="material-symbols-outlined text-4xl text-red-400/70">error</span>
          <p className="text-red-300 font-mono text-sm">{error}</p>
          <div className="flex justify-center gap-4">
            <button onClick={fetchResults} className="btn-primary px-6 py-2 text-xs">Retry</button>
            <Link to="/upload" className="btn-secondary px-6 py-2 text-xs">Upload again</Link>
          </div>
        </div>
      </PageWrapper>
    );
  }
  if (!result) return null;

  async function handleShare() {
    try {
      const { data } = await enableShare(jobId);
      await navigator.clipboard.writeText(data.data.shareUrl);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not create share link');
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
      toast.error('Export failed');
    }
  }

  async function handleFavorite() {
    try {
      await addFavorite(jobId);
      toast.success('Added to library');
    } catch {
      toast.error('Could not save favorite');
    }
  }

  const spotifyMeta = result?.spotify_features
    ? (typeof result.spotify_features === 'string' ? JSON.parse(result.spotify_features) : result.spotify_features)
    : null;

  return (
    <PageWrapper className="space-y-8 pb-20 relative">
        {/* Background 3D Atmosphere */}
        <Suspense fallback={null}>
            <ResultsAtmosphere bpm={result.bpm} />
        </Suspense>

      {/* Dynamic Header */}
      <header className="relative rounded-2xl overflow-hidden border border-glass-border h-64 flex items-end p-8 group">
          {/* Blurred Background Art */}
          <div className="absolute inset-0 z-0">
              <img src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} className="w-full h-full object-cover blur-3xl opacity-40 scale-110 group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex gap-8 items-end w-full">
              <img src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} className="w-40 h-40 rounded-lg shadow-2xl border border-white/10" />
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-mono text-[9px] rounded uppercase tracking-widest">Spectral Report</span>
                      <span className="font-mono text-[10px] text-white/40">#{jobId.substring(0, 8)}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tight mb-2 truncate" style={SG}>{result.song_title || 'Unknown Waveform'}</h1>
                  <p className="text-xl font-medium text-white/60 mb-4">{result.song_artist || 'System Source'}</p>
                  
                  <div className="flex gap-6">
                      <div className="flex flex-col">
                          <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">Tempo</span>
                          <span className="text-lg font-mono font-bold text-primary">{Math.round(result.bpm || 0)} BPM</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">Scale</span>
                          <span className="text-lg font-mono font-bold text-secondary">{result.scale || 'N/A'}</span>
                      </div>
                  </div>
              </div>
                  <div className="flex items-center gap-3">
                      <button onClick={handleFavorite} className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm">favorite</span>
                      </button>
                      <button onClick={handleShare} className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm">share</span>
                      </button>
                      <button onClick={handleExport} className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                      <Link to="/upload" className="btn-secondary px-5 py-2.5 text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">add</span> New Signal
                      </Link>
                  </div>
          </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Player & Lyrics */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
              {/* Audio Player Card */}
              <div className="glass-panel p-6 border border-glass-border">
                  <div className="flex items-center gap-6 mb-6">
                      <button 
                        onClick={() => wavesurfer.current?.playPause()}
                        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-surface hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                          <span className="material-symbols-outlined text-3xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                      </button>
                      <div className="flex-1">
                          <div ref={waveformRef} />
                          <div className="flex justify-between mt-2 font-mono text-[10px] text-white/30">
                              <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                              <span>{result.duration_ms ? new Date(result.duration_ms).toISOString().substr(14, 5) : '--:--'}</span>
                          </div>
                      </div>
                  </div>

                  {/* Chord timeline from ML analysis */}
                  <div className="relative h-12 bg-white/[0.02] border border-glass-border rounded-lg overflow-hidden flex items-center px-4">
                      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary z-10 shadow-[0_0_10px_var(--color-primary)]" />
                      {chordSegments.length > 0 ? (
                        <div
                          className="flex gap-4 transition-transform duration-100"
                          style={{ transform: `translateX(calc(50% - ${currentTime * 60}px))` }}
                        >
                          {chordSegments.map((c, i) => (
                            <div
                              key={`${c.chord}-${c.start_time}-${i}`}
                              className={clsx(
                                'px-4 py-1 rounded font-mono font-bold text-xs transition-all duration-300 whitespace-nowrap',
                                currentTime >= c.start_time && currentTime <= c.end_time
                                  ? 'bg-primary text-surface scale-110'
                                  : 'text-white/40'
                              )}
                              style={{ minWidth: Math.max(48, (c.end_time - c.start_time) * 60) }}
                            >
                              {c.chord}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="mx-auto font-mono text-[10px] text-white/30 uppercase tracking-widest">
                          Chord timeline unavailable
                        </span>
                      )}
                  </div>
              </div>

              {/* Lyrics from ML / lyrics provider */}
              <div className="glass-panel p-8 border border-glass-border h-[400px] overflow-hidden flex flex-col">
                  <h3 className="font-headline font-bold text-sm text-primary uppercase tracking-widest mb-8">
                    {result?.synced_lyrics ? 'Synced Transcript' : 'Lyrics'}
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-4 space-y-6 scroll-smooth">
                      {lyricLines.length > 0 ? (
                        lyricLines.map((line, i) => (
                          <p
                            key={i}
                            className={clsx(
                              'text-xl md:text-2xl font-medium transition-all duration-500',
                              i === currentLyricIdx
                                ? 'text-white opacity-100 translate-x-2'
                                : 'text-white/20 hover:text-white/40'
                            )}
                          >
                            {line.text}
                          </p>
                        ))
                      ) : lyricsText ? (
                        <pre className="text-white/80 text-sm md:text-base font-medium whitespace-pre-wrap leading-relaxed font-sans">
                          {lyricsText}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/20 font-mono text-sm uppercase tracking-widest italic">
                          Lyrics not found for this track
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Right Column: Musician Corner */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 border border-primary/20 bg-primary/5">
                  <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 block">Neural Identification</span>
                  <div className="flex items-center justify-between">
                      <div className="text-4xl font-headline font-extrabold text-white">{currentChord}</div>
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                      </div>
                  </div>
                  <p className="mt-4 text-[10px] text-white/40 uppercase font-mono tracking-widest">Real-time chord tracking active</p>
              </div>

              <InstrumentChordPanel chords={chordSegments} />

              <div className="grid grid-cols-2 gap-4">
                  <StatCard icon="bolt" label="Energy" value={`${Math.round(result.energy_level * 100)}%`} color="text-secondary" />
                  <StatCard icon="mood" label="Mood" value={result.mood?.toUpperCase()} color="text-primary" />
              </div>
          </div>
      </div>
    </PageWrapper>
  );
}
