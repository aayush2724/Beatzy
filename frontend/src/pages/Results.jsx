import { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';
import { enableShare, exportReport, addFavorite } from '../api/library';
import InstrumentChordPanel from '../components/InstrumentChordPanel';
import PageWrapper from '../components/PageWrapper';

import { 
  Heart, 
  Share2, 
  Download, 
  Plus, 
  Music, 
  Activity, 
  Play, 
  Pause,
  CloudRain,
  Radio,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

const ResultsAtmosphere = lazy(() => import('../components/ResultsAtmosphere'));

import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <motion.div
      className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-white/20 transition-all group cursor-default"
    >
      <div className="flex justify-between items-start">
        <Icon className={clsx('w-5 h-5 group-hover:scale-110 transition-transform', color)} />
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

  const bpm = result.bpm || 120;
  const pulseDuration = 60 / bpm;

  return (
    <PageWrapper className="space-y-8 pb-20 relative">
        {/* Background 3D Atmosphere */}
        <Suspense fallback={null}>
            <ResultsAtmosphere bpm={bpm} />
        </Suspense>

      {/* Dynamic Header */}
      <header className="relative rounded-2xl overflow-hidden border border-glass-border h-64 flex items-end p-8 group">
          {/* Blurred Background Art */}
          <div className="absolute inset-0 z-0">
              <img src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} className="w-full h-full object-cover blur-3xl opacity-40 scale-110 group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex gap-8 items-end w-full">
              <motion.img 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} 
                className="w-40 h-40 rounded-lg shadow-2xl border border-white/10" 
              />
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
                          <Heart className="w-4 h-4" />
                      </button>
                      <button onClick={handleShare} className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                          <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={handleExport} className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                          <Download className="w-4 h-4" />
                      </button>
                      <Link to="/upload" className="btn-secondary px-5 py-2.5 text-xs flex items-center gap-2">
                          <Plus className="w-4 h-4" /> New Signal
                      </Link>
                  </div>
          </div>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Tempo" value={`${Math.round(result.bpm || 0)}`} sub="BPM" color="text-primary" />
          <StatCard icon={Layers} label="Key" value={result.key_signature || result.scale || 'N/A'} sub="Signature" color="text-secondary" />
          <StatCard icon={Activity} label="Energy" value={`${Math.round(result.energy_level * 100)}%`} color="text-tertiary" />
          <StatCard icon={Music} label="Mood" value={result.mood?.toUpperCase() || 'NEUTRAL'} color="text-quaternary" />
      </div>

      <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Player & Lyrics */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
              {/* REDESIGNED: Audio Control Center */}
              <div className="glass-panel p-8 border border-glass-border overflow-hidden relative group">
                  {/* Subtle background glow that pulses with the beat */}
                  <motion.div 
                    animate={{ opacity: isPlaying ? [0.05, 0.12, 0.05] : 0.05 }}
                    transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary pointer-events-none blur-[100px] z-0" 
                  />

                  <div className="relative z-10 space-y-8">
                      {/* Main Player Row */}
                      <div className="flex flex-col md:flex-row items-center gap-8">
                          {/* Play/Pause Large Controller */}
                          <button 
                            onClick={() => wavesurfer.current?.playPause()}
                            className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] shrink-0 group/play"
                          >
                              {isPlaying ? (
                                <Pause className="w-10 h-10 fill-black" />
                              ) : (
                                <Play className="w-10 h-10 fill-black ml-1.5" />
                              )}
                          </button>

                          {/* Track Progress & Waveform */}
                          <div className="flex-1 w-full">
                              <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className={clsx("w-2 h-2 rounded-full", isPlaying ? "bg-primary animate-pulse" : "bg-white/20")} />
                                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">Live Stream Detection</span>
                                  </div>
                                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Engine v4.2.0</span>
                              </div>
                              
                              <div ref={waveformRef} className="w-full cursor-pointer hover:opacity-80 transition-opacity" />
                              
                              <div className="flex justify-between mt-4 font-mono text-xs text-white/50">
                                  <span className="text-primary tabular-nums">{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                                  <span className="tabular-nums">{result.duration_ms ? new Date(result.duration_ms).toISOString().substr(14, 5) : '--:--'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Advanced Controls Strip */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                          <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Confidence</span>
                              <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: '98%' }} />
                                  </div>
                                  <span className="font-mono text-[10px] text-primary">98%</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Spectral Stability</span>
                              <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-secondary" style={{ width: '84%' }} />
                                  </div>
                                  <span className="font-mono text-[10px] text-secondary">84%</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Neural Phase</span>
                              <span className="font-mono text-[11px] text-white font-bold uppercase">Sychronized</span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Buffer Status</span>
                              <span className="font-mono text-[11px] text-white font-bold uppercase">Optimized</span>
                          </div>
                      </div>

                      {/* Real-time Chord Scroll Strip */}
                      <div className="relative h-20 bg-black/40 border border-white/5 rounded-xl overflow-hidden flex items-center px-4 shadow-inner">
                          {/* Focal Point Indicator */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary z-10 shadow-[0_0_15px_var(--color-primary)]">
                              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full blur-[2px]" />
                              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full blur-[2px]" />
                          </div>

                          {chordSegments.length > 0 ? (
                            <div
                              className="flex gap-6 transition-transform duration-150 ease-linear"
                              style={{ transform: `translateX(calc(50% - ${currentTime * 80}px))` }}
                            >
                              {chordSegments.map((c, i) => (
                                <div
                                  key={`${c.chord}-${c.start_time}-${i}`}
                                  className={clsx(
                                    'flex flex-col items-center justify-center min-w-[80px] h-12 rounded-lg transition-all duration-300',
                                    currentTime >= c.start_time && currentTime <= c.end_time
                                      ? 'bg-primary text-black scale-110 shadow-lg font-bold'
                                      : 'bg-white/5 text-white/30 border border-white/5'
                                  )}
                                  style={{ minWidth: Math.max(80, (c.end_time - c.start_time) * 80) }}
                                >
                                  <span className="text-sm font-display uppercase tracking-tight">{c.chord}</span>
                                  <span className="text-[8px] font-mono opacity-60 uppercase">{Math.round(c.start_time)}s</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-3">
                                <Radio className="w-4 h-4 text-white/20 animate-pulse" />
                                <span className="font-mono text-xs text-white/30 uppercase tracking-[0.3em]">Decoding spectral harmony...</span>
                            </div>
                          )}
                      </div>
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
                          <CloudRain className="w-5 h-5 mr-3 opacity-40" /> Lyrics not found for this track
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
                          <Radio className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                  </div>
                  <p className="mt-4 text-[10px] text-white/40 uppercase font-mono tracking-widest">Real-time chord tracking active</p>
              </div>

              <InstrumentChordPanel chords={chordSegments} />

              <div className="glass-panel p-6 border border-glass-border">
                  <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-4 h-4 text-secondary" />
                      <h4 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Spectral Metadata</h4>
                  </div>
                  <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="font-mono text-[9px] text-white/30 uppercase">Sample Rate</span>
                          <span className="font-mono text-xs text-white">44.1kHz</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="font-mono text-[9px] text-white/30 uppercase">Bit Depth</span>
                          <span className="font-mono text-xs text-white">24-bit PCM</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="font-mono text-[9px] text-white/30 uppercase">Loudness</span>
                          <span className="font-mono text-xs text-white">-14.2 LUFS</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </PageWrapper>
  );
}
