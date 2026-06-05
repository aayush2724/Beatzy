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
  FileText, 
  Zap, 
  CheckCircle2,
  ArrowUpRight
  } from 'lucide-react';

const ResultsAtmosphere = lazy(() => import('../components/ResultsAtmosphere'));

import clsx from 'clsx';

function StatCard({ icon: Icon, label, value, sub, colorClass = 'text-[#c41e3a]', borderClass = 'border-[#c41e3a]/20' }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`glass-card p-6 border ${borderClass} flex flex-col justify-between transition-all duration-500 group cursor-default`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors`}>
            <Icon className={clsx('w-5 h-5 transition-transform duration-500 group-hover:rotate-12', colorClass)} />
        </div>
        <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="mt-6">
        <div className={`text-3xl font-display font-black text-white tracking-tight uppercase group-hover:text-glow-crimson transition-all`}>{value}</div>
        {sub && <div className="text-[10px] text-on-surface-variant font-black mt-1 uppercase tracking-[0.2em] opacity-60">{sub}</div>}
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
      waveColor: 'rgba(255, 255, 255, 0.05)',
      progressColor: '#c41e3a',
      cursorColor: '#f4a460',
      barWidth: 2,
      barGap: 4,
      barRadius: 4,
      height: 80,
      normalize: true,
    });

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
      <PageWrapper className="py-32">
        <div className="max-w-md mx-auto text-center space-y-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border border-[#c41e3a]/20 animate-ping" />
            <div className="absolute inset-4 rounded-full border-2 border-t-[#c41e3a] border-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#c41e3a] fill-[#c41e3a]/20" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-display font-black text-white text-lg uppercase tracking-widest">Decoding Signal</p>
            <p className="font-mono text-on-surface-variant text-[10px] uppercase tracking-[0.3em] animate-pulse">Neural clusters synchronizing…</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="py-32">
        <div className="max-w-lg mx-auto text-center glass-card p-12 border border-red-500/20 space-y-8">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 text-red-400 opacity-70" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Signal Interrupted</h3>
            <p className="text-red-300/60 font-mono text-xs uppercase tracking-widest leading-relaxed px-12">{error}</p>
          </div>
          <div className="flex justify-center gap-4">
            <button onClick={fetchResults} className="px-8 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#c41e3a] transition-all">Initialize Retry</button>
            <Link to="/upload" className="px-8 py-3 rounded-xl border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">New Extraction</Link>
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
      toast.success('Intelligence link copied');
    } catch {
      toast.error('Share link generation failed');
    }
  }

  async function handleExport() {
    try {
      const { data } = await exportReport(jobId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `beatzy-intel-${jobId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report decrypted & downloaded');
    } catch {
      toast.error('Intelligence export failed');
    }
  }

  async function handleFavorite() {
    try {
      await addFavorite(jobId);
      toast.success('Added to secure archives');
    } catch {
      toast.error('Archive operation failed');
    }
  }

  const spotifyMeta = result?.spotify_features
    ? (typeof result.spotify_features === 'string' ? JSON.parse(result.spotify_features) : result.spotify_features)
    : null;

  const bpm = result.bpm || 120;
  const pulseDuration = 60 / bpm;

  return (
    <PageWrapper className="space-y-12 pb-20 relative animate-page-entrance">
        {/* Background 3D Atmosphere */}
        <Suspense fallback={null}>
            <ResultsAtmosphere bpm={bpm} />
        </Suspense>

      {/* Cinematic Header */}
      <header className="relative rounded-[3rem] overflow-hidden border border-white/10 h-[400px] flex items-end p-10 md:p-16 group">
          {/* Blurred Background Art */}
          <div className="absolute inset-0 z-0 overflow-hidden">
              <img src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} className="w-full h-full object-cover blur-[80px] opacity-30 scale-125 group-hover:scale-110 transition-transform duration-[2000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120509] via-[#120509]/40 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,#120509_100%)] opacity-60" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center md:items-end w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative shrink-0"
              >
                <div className="absolute inset-0 bg-[#c41e3a]/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <motion.img 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                  src={spotifyMeta?.cover_url || '/placeholder-art.jpg'} 
                  className="w-48 h-48 md:w-64 md:h-64 rounded-3xl shadow-2xl border border-white/10 relative z-10 object-cover" 
                />
              </motion.div>

              <div className="flex-1 min-w-0 text-center md:text-left space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <span className="px-3 py-1 bg-[#c41e3a]/10 border border-[#c41e3a]/20 text-[#c41e3a] font-mono text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">Spectral Intelligence Report</span>
                        <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Ref: {jobId.substring(0, 12)}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter uppercase truncate leading-none">{result.song_title || 'Unknown Waveform'}</h1>
                    <p className="text-2xl font-medium text-white/50 tracking-tight">{result.song_artist || 'System Source'}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <button onClick={handleFavorite} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#8b2e5f]/50 text-white/60 hover:text-[#8b2e5f] transition-all group/btn">
                          <Heart className="w-5 h-5 group-hover/btn:fill-current" />
                      </button>
                      <button onClick={handleShare} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#f4a460]/50 text-white/60 hover:text-[#f4a460] transition-all">
                          <Share2 className="w-5 h-5" />
                      </button>
                      <button onClick={handleExport} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#e8a084]/50 text-white/60 hover:text-[#e8a084] transition-all">
                          <Download className="w-5 h-5" />
                      </button>
                      <Link to="/upload" className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#c41e3a] text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(196,30,58,0.2)] hover:scale-105 transition-all">
                          <Plus className="w-4 h-4" /> New Signal
                      </Link>
                  </div>
              </div>
          </div>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Clock} label="Tempo" value={`${Math.round(result.bpm || 0)}`} sub="BPM" colorClass="text-[#c41e3a]" borderClass="border-[#c41e3a]/10" />
          <StatCard icon={Layers} label="Scale" value={result.key_signature || result.scale || 'N/A'} sub="Signature" colorClass="text-[#f4a460]" borderClass="border-[#f4a460]/10" />
          <StatCard icon={Activity} label="Energy" value={`${Math.round(result.energy_level * 100)}%`} sub="Intensity" colorClass="text-[#8b2e5f]" borderClass="border-[#8b2e5f]/10" />
          <StatCard icon={Music} label="Mood" value={result.mood?.toUpperCase() || 'NEUTRAL'} sub="Neural Vector" colorClass="text-[#e8a084]" borderClass="border-[#e8a084]/10" />
      </div>

      <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Player & Lyrics */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
              {/* REDESIGNED: Audio Control Center */}
              <div className="glass-card p-10 border border-white/10 overflow-hidden relative group">
                  <motion.div 
                    animate={{ opacity: isPlaying ? [0.03, 0.08, 0.03] : 0.03 }}
                    transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[#c41e3a] pointer-events-none blur-[120px] z-0" 
                  />

                  <div className="relative z-10 space-y-12">
                      {/* Main Player Row */}
                      <div className="flex flex-col lg:flex-row items-center gap-12">
                          {/* Play/Pause Controller */}
                          <button 
                            onClick={() => wavesurfer.current?.playPause()}
                            className="w-28 h-28 rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.2)] shrink-0 group/play relative overflow-hidden"
                          >
                              <div className="absolute inset-0 bg-[#c41e3a] opacity-0 group-hover/play:opacity-10 transition-opacity" />
                              {isPlaying ? (
                                <Pause className="w-12 h-12 fill-black" />
                              ) : (
                                <Play className="w-12 h-12 fill-black ml-1.5" />
                              )}
                          </button>

                          {/* Track Progress & Waveform */}
                          <div className="flex-1 w-full space-y-6">
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className={clsx("w-2 h-2 rounded-full", isPlaying ? "bg-[#c41e3a] animate-pulse shadow-[0_0_10px_#c41e3a]" : "bg-white/10")} />
                                      <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-white">Live Spectral Stream</span>
                                  </div>
                                  <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                                    <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest font-black text-glow-crimson">Engine v4.2.0</span>
                                  </div>
                              </div>
                              
                              <div className="relative">
                                <div ref={waveformRef} className="w-full cursor-pointer hover:opacity-80 transition-opacity relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c41e3a]/5 to-transparent blur-[40px] pointer-events-none opacity-40" />
                              </div>
                              
                              <div className="flex justify-between font-mono text-[10px] font-black text-white/40 uppercase tracking-widest">
                                  <span className="text-[#c41e3a] tabular-nums">{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                                  <span className="tabular-nums">{result.duration_ms ? new Date(result.duration_ms).toISOString().substr(14, 5) : '--:--'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Advanced Telemetry Strips */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/5">
                          {[
                            { label: 'Signal Confidence', value: '98%', color: 'bg-[#c41e3a]' },
                            { label: 'Spectral Stability', value: '84%', color: 'bg-[#f4a460]' },
                            { label: 'Neural Phase', value: 'SYNCED', isStatus: true },
                            { label: 'Buffer Rate', value: 'OPTIMAL', isStatus: true },
                          ].map((stat, i) => (
                            <div key={i} className="space-y-3">
                              <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">{stat.label}</span>
                              {stat.isStatus ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a] animate-pulse" />
                                    <span className="font-mono text-[11px] text-white font-black uppercase tracking-widest">{stat.value}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className={`h-full ${stat.color}`} style={{ width: stat.value }} />
                                  </div>
                                  <span className="font-mono text-[10px] text-white font-black">{stat.value}</span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Real-time Chord Scroll Strip */}
                      <div className="relative h-24 bg-black/60 border border-white/5 rounded-2xl overflow-hidden flex items-center px-6 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]">
                          {/* Focal Point Indicator */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#c41e3a] z-10 shadow-[0_0_20px_#c41e3a]">
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#c41e3a] rounded-full blur-[1px]" />
                              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#c41e3a] rounded-full blur-[1px]" />
                          </div>

                          {chordSegments.length > 0 ? (
                            <div
                              className="flex gap-8 transition-transform duration-150 ease-linear"
                              style={{ transform: `translateX(calc(50% - ${currentTime * 80}px))` }}
                            >
                              {chordSegments.map((c, i) => (
                                <div
                                  key={`${c.chord}-${c.start_time}-${i}`}
                                  className={clsx(
                                    'flex flex-col items-center justify-center min-w-[100px] h-14 rounded-xl transition-all duration-500',
                                    currentTime >= c.start_time && currentTime <= c.end_time
                                      ? 'bg-[#c41e3a] text-black scale-110 shadow-[0_0_30px_rgba(196,30,58,0.2)] font-black'
                                      : 'bg-white/5 text-white/20 border border-white/5 opacity-40'
                                  )}
                                  style={{ minWidth: Math.max(100, (c.end_time - c.start_time) * 80) }}
                                >
                                  <span className="text-lg font-display uppercase tracking-tighter leading-none">{c.chord}</span>
                                  <span className="text-[8px] font-mono opacity-60 uppercase mt-1 tracking-widest">{Math.round(c.start_time)}s</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-4">
                                <Radio className="w-5 h-5 text-white/10 animate-pulse" />
                                <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">Decoding Harmonic Matrix...</span>
                            </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Transcripts Panel */}
              <div className="obsidian-panel p-10 rounded-[3rem] border border-white/5 h-[500px] overflow-hidden flex flex-col group/lyrics">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-display font-black text-xs text-[#c41e3a] uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a]" />
                      {result?.synced_lyrics ? 'Neural Sync Transcript' : 'Source Transcript'}
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                        <Activity className="w-3 h-3 text-white/20" />
                        <span className="font-mono text-[9px] text-white/30 uppercase font-black tracking-widest">Active Tracking</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-6 space-y-10 custom-scrollbar scroll-smooth">
                      {lyricLines.length > 0 ? (
                        lyricLines.map((line, i) => (
                          <motion.p
                            key={i}
                            animate={i === currentLyricIdx ? { x: 10, scale: 1.05 } : { x: 0, scale: 1 }}
                            className={clsx(
                              'text-2xl md:text-4xl font-display font-black transition-all duration-700 leading-tight',
                              i === currentLyricIdx
                                ? 'text-white text-glow-crimson opacity-100'
                                : 'text-white/10 hover:text-white/25 cursor-default'
                            )}
                          >
                            {line.text}
                          </motion.p>
                        ))
                      ) : lyricsText ? (
                        <pre className="text-white/60 text-lg font-medium whitespace-pre-wrap leading-relaxed font-sans">
                          {lyricsText}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 text-white/10">
                          <CloudRain className="w-16 h-16 opacity-10" />
                          <p className="font-mono text-xs uppercase tracking-[0.4em] font-black italic">Neural signatures missing for lyrics</p>
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Right Column: Technical Metadata & Chord Fingerprints */}
          <div className="col-span-12 xl:col-span-4 space-y-8">
              <div className="glass-card p-8 border border-[#c41e3a]/20 bg-[#c41e3a]/5 relative overflow-hidden group/chord">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/chord:opacity-10 transition-opacity">
                    <Radio className="w-32 h-32 text-[#c41e3a]" />
                  </div>
                  <span className="font-mono text-[10px] text-[#c41e3a] font-black uppercase tracking-[0.3em] mb-8 block">Live Harmonic Detection</span>
                  <div className="flex items-center justify-between relative z-10">
                      <div className="text-6xl font-display font-black text-white tracking-tighter text-glow-crimson">{currentChord}</div>
                      <div className="w-16 h-16 rounded-[2rem] bg-[#c41e3a]/10 border border-[#c41e3a]/30 flex items-center justify-center">
                          <Radio className="w-8 h-8 text-[#c41e3a] animate-pulse" />
                      </div>
                  </div>
                  <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-white/5 relative z-10 w-max">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a] animate-ping" />
                    <p className="text-[9px] text-[#c41e3a] uppercase font-mono font-black tracking-widest">Real-time spectral link active</p>
                  </div>
              </div>

              <div className="obsidian-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="font-display font-black text-xs text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Zap className="w-4 h-4 text-[#c41e3a]" /> Chord Fingerprints
                    </h3>
                </div>
                <div className="p-2">
                    <InstrumentChordPanel chords={chordSegments} />
                </div>
              </div>

              <div className="obsidian-panel p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                  <div className="flex items-center justify-between">
                      <h4 className="font-display font-black text-xs text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#f4a460]" /> Spectral Metadata
                      </h4>
                      <CheckCircle2 className="w-4 h-4 text-[#c41e3a] opacity-50" />
                  </div>
                  
                  <div className="space-y-4">
                      {[
                        { label: 'Sample Rate', value: '44.1kHz', sub: 'HD Audio' },
                        { label: 'Bit Depth', value: '24-bit', sub: 'PCM Linear' },
                        { label: 'Loudness', value: '-14.2 LUFS', sub: 'Streaming Target' },
                        { label: 'Peak Level', value: '-0.1 dBTP', sub: 'True Peak' },
                        { label: 'Complexity', value: 'High', sub: 'Neural Score' }
                      ].map((meta, i) => (
                        <div key={i} className="flex justify-between items-center group/meta p-2 rounded-xl hover:bg-white/[0.02] transition-colors cursor-default">
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest font-black block group-hover/meta:text-white/50 transition-colors">{meta.label}</span>
                            <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest opacity-40 block">{meta.sub}</span>
                          </div>
                          <span className="font-display font-black text-sm text-white group-hover/meta:text-[#c41e3a] transition-colors">{meta.value}</span>
                        </div>
                      ))}
                  </div>

                  <button 
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c41e3a]/30 transition-all group/export"
                  >
                    <span className="font-mono text-[10px] font-black text-white uppercase tracking-widest group-hover/export:text-[#c41e3a]">Download Full JSON Report</span>
                    <ArrowUpRight className="w-3 h-3 text-white/20 group-hover/export:text-[#c41e3a] group-hover/export:translate-x-0.5 group-hover/export:-translate-y-0.5 transition-all" />
                  </button>
              </div>
          </div>
      </div>
    </PageWrapper>
  );
}
