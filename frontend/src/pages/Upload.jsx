import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import toast from 'react-hot-toast';
import { uploadAudio, getResults, searchSongs, analyzeUrl, getHealth } from '../api/audio';
import { useJobSocket } from '../hooks/useJobSocket';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import MicRecorder from '../components/MicRecorder';
import { 
  Search, 
  Waves, 
  Mic, 
  Music, 
  Upload as UploadIcon, 
  X, 
  CheckCircle2, 
  SearchCode, 
  Activity, 
  Cpu, 
  Database,
  Play,
  Pause,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert as ShieldCode
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const ACCEPTED = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
  'audio/mp4': ['.m4a'],
};

function VinylRecord({ spinning, drop }) {
  const mesh = useRef();
  useFrame(() => {
    if (!mesh.current) return;
    if (spinning) {
      mesh.current.rotation.y += 0.15;
    } else {
      mesh.current.rotation.y += 0.01;
    }
    if (drop) {
        mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, -4, 0.05);
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, Math.PI / 2, 0.05);
    } else {
        mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, 0, 0.05);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={mesh} rotation={[Math.PI / 3, 0, 0]}>
        {/* Main Vinyl Disc */}
        <mesh>
            <cylinderGeometry args={[2.5, 2.5, 0.05, 64]} />
            <meshStandardMaterial color="#080808" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Groove texture effect (simplified with rings) */}
        {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8 + i * 0.15, 0.82 + i * 0.15, 64]} />
                <meshStandardMaterial color="#1a1a1a" transparent opacity={0.3} />
            </mesh>
        ))}
        {/* Center Label */}
        <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.02, 32]} />
            <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.2} />
        </mesh>
        {/* Center Hole */}
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </Float>
  );
}

function AudioWave({ active, bars = 12 }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={active ? {
            height: [10, Math.random() * 40 + 10, 10],
          } : { height: 4 }}
          transition={active ? {
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05
          } : {}}
          className="w-1 rounded-full bg-gradient-to-t from-[#FF6B35] to-[#FF6B35]"
          style={{
            opacity: active ? 1 : 0.2
          }}
        />
      ))}
    </div>
  );
}

export default function Upload() {
  const [tab, setTab] = useState('file'); // 'file' | 'mic' | 'search'
  const [step, setStep] = useState('upload'); // 'upload' | 'uploading' | 'analyzing' | 'done' | 'error'
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [jobId, setJobId] = useState(null);
  const navigate = useNavigate();
  const abortRef = useRef(false);

  // Spotify Search States
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [playingUrl, setPlayingUrl] = useState(null);
  const audioRef = useRef(null);

  // Debounced search logic for suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 3 && tab === 'search') {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setTracks([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, tab]);

  const performSearch = async (searchTerm) => {
    setSearching(true);
    try {
      const { data } = await searchSongs(searchTerm);
      setTracks(data.data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const { status: socketStatus, progress: socketProgress } = useJobSocket(jobId);

  useEffect(() => {
    let timer;
    if (step === 'uploading' || step === 'analyzing') {
      timer = setInterval(() => setElapsed(e => e + 0.1), 100);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
      if (!jobId) return;
      if (socketStatus === 'completed') {
        setStep('done');
        setTimeout(() => navigate(`/results/${jobId}`), 1200);
      } else if (socketStatus === 'failed') {
        // Try to fetch the specific error message from the job record
        getResults(jobId).then(({ data }) => {
            const msg = data.data?.error_message || 'Analysis pipeline failed';
            toast.error(msg);
        }).catch(() => {
            toast.error('Analysis pipeline failed');
        }).finally(() => {
            resetState();
        });
      }
 else if (['analyzing', 'saving', 'processing'].includes(socketStatus || '')) {
        setStep('analyzing');
      }
  }, [socketStatus, jobId, navigate]);

  function resetState() {
    setStep('upload');
    setFile(null);
    setProgress(0);
    setJobId(null);
    abortRef.current = false;
  }

  const waitForServer = async () => {
    for (let i = 0; i < 10; i++) {
      try {
        await getHealth();
        toast.dismiss('wake-up');
        return true;
      } catch (err) {
        toast.loading('Server is waking up, please wait...', { id: 'wake-up' });
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    toast.dismiss('wake-up');
    throw new Error('Server failed to wake up. Please try again later.');
  };

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    abortRef.current = false;

    try {
      await waitForServer();
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');

      toast.success('Signal captured! Neural core syncing...', {
        id: 'upload-success',
        style: { background: '#1A1010', color: '#FF6B35', border: '1px solid rgba(255,255,255,0.1)' },
      });

      let errorCount404 = 0;
      for (let i = 0; i < 60; i++) {
        if (abortRef.current) return;
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { data: rd } = await getResults(id);
          errorCount404 = 0;
          toast.dismiss('polling-status');

          if (rd.status === 'complete' || rd.data?.song_title !== undefined) {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
          if (rd.status === 'failed') {
            throw new Error(rd.error || 'Analysis failed');
          }
        } catch (pollErr) {
          if (pollErr?.response?.status === 404) {
            errorCount404++;
            if (errorCount404 > 10) {
              setStep('error');
              return;
            }
            if (errorCount404 > 3) {
              toast.loading('Analysis is taking longer than usual, please wait...', { id: 'polling-status' });
            }
            continue;
          }
          toast.dismiss('polling-status');
          throw pollErr;
        }
      }
      throw new Error('Analysis timed out');
    } catch (err) {
      if (abortRef.current) return;
      toast.dismiss('polling-status');
      toast.error(err.message || 'Signal transmission failed');
      setStep('error');
    }
  }, [navigate]);

  const handleAnalyzeUrl = async (track) => {
    if (!track.preview_url) {
      toast.error('No preview available for this track.');
      return;
    }
    stopPreview();
    setFile({ name: `${track.title} - ${track.artist} (Preview)` });
    setStep('uploading');
    setProgress(10);
    abortRef.current = false;

    try {
      await waitForServer();
      setProgress(50);
      const { data } = await analyzeUrl(track.preview_url, track.title, track.artist);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');

      toast.success('Remote track cached! Analyzing...');

      let errorCount404 = 0;
      for (let i = 0; i < 60; i++) {
        if (abortRef.current) return;
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { data: rd } = await getResults(id);
          errorCount404 = 0;
          toast.dismiss('polling-status');

          if (rd.status === 'complete' || rd.data?.song_title !== undefined) {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
          if (rd.status === 'failed') {
            throw new Error(rd.error || 'Analysis failed');
          }
        } catch (pollErr) {
          if (pollErr?.response?.status === 404) {
            errorCount404++;
            if (errorCount404 > 10) {
              setStep('error');
              return;
            }
            if (errorCount404 > 3) {
              toast.loading('Analysis is taking longer than usual, please wait...', { id: 'polling-status' });
            }
            continue;
          }
          toast.dismiss('polling-status');
          throw pollErr;
        }
      }
      throw new Error('Analysis timed out');
    } catch (err) {
      if (abortRef.current) return;
      toast.dismiss('polling-status');
      toast.error(err.message || 'Signal transmission failed');
      setStep('error');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await searchSongs(query);
      setTracks(data.data || []);
      if ((data.data || []).length === 0) {
        toast.error('No songs found matching your query.');
      }
    } catch (err) {
      toast.error('Failed to search songs');
    } finally {
      setSearching(false);
    }
  };

  const togglePreview = (url) => {
    if (playingUrl === url) {
      stopPreview();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingUrl(null);
      audioRef.current = audio;
      setPlayingUrl(url);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingUrl(null);
  };

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const disabled = step !== 'upload';
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled,
    onDropAccepted: ([f]) => handleFile(f),
  });

  const rejected = fileRejections[0]?.errors[0]?.message;
  const liveProgress = socketProgress > 0 ? socketProgress : null;
  const visibleProgress = step === 'done'
    ? 100
    : liveProgress != null
      ? liveProgress
      : step === 'analyzing'
        ? Math.min(99, Math.max(68, Math.floor(68 + elapsed * 2.5)))
        : progress;

  const stageCards = [
    {
      icon: SearchCode,
      title: 'Song ID',
      engine: 'AcoustID',
      status: step === 'uploading' ? 'Buffered' : socketStatus === 'processing' ? 'Matching...' : 'Scanning...',
      active: step === 'analyzing' && ['processing', 'analyzing'].includes(socketStatus),
    },
    {
      icon: Activity,
      title: 'Spectral DNA',
      engine: 'librosa + ML',
      status: step === 'uploading' ? 'Queued' : socketStatus === 'analyzing' ? 'Extracting...' : socketStatus === 'saving' ? 'Complete' : 'Queued',
      active: step === 'analyzing' && socketStatus === 'analyzing',
    },
    {
      icon: Cpu,
      title: 'Classifiers',
      engine: 'YAMNet Array',
      status: socketStatus === 'saving' ? 'Persisting...' : socketStatus === 'completed' ? 'Complete' : 'Queued',
      active: socketStatus === 'saving',
    },
  ];

  return (
    <PageWrapper className="space-y-10 pb-16 animate-page-entrance">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] font-mono text-[11px] uppercase tracking-[0.15em]">
            <Database className="w-3 h-3" /> Neural Core V4.2
        </div>
        <h1 className="text-5xl font-display font-black text-[#FFFFFF] tracking-tight uppercase">
          Spectral <span className="text-[#FF6B35] text-glow-orange">Engine</span>
        </h1>
        <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
          Initialize track analysis. Upload raw audio, capture live signals, or search the global database to extract musical intelligence.
        </p>
      </header>

      {/* Modern Tabs */}
      {step === 'upload' && (
        <div className="flex gap-2 p-1 obsidian-panel rounded-2xl border border-[#0D0808]/5 w-max mb-8">
          {[
            { id: 'file', label: 'File Upload', icon: UploadIcon },
            { id: 'mic', label: 'Listen Live', icon: Mic },
            { id: 'search', label: 'Global Search', icon: Search },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); stopPreview(); }}
              className={clsx(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all duration-300',
                tab === t.id
                  ? 'bg-[#FF6B35] text-black font-black shadow-[0_0_20px_rgba(255,107,53,0.15)]'
                  : 'text-on-surface-variant hover:text-[#FFFFFF] hover:bg-white/5'
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative glass-card rounded-[3rem] border border-[#0D0808]/10 overflow-hidden p-8 md:p-12 min-h-[600px] flex items-center justify-center">
        {/* Interactive 3D Vinyl Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 1, 8]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <VinylRecord spinning={step !== 'upload'} drop={step === 'analyzing'} />
                {step === 'analyzing' && <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={2} />}
            </Canvas>
        </div>

        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B35]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
          <AnimatePresence mode="wait">

            {/* STEP 1: Upload / Mic / Search Modes */}
            {step === 'upload' && (
              <motion.div
                key={tab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full"
              >
                {/* File Upload Mode */}
                {tab === 'file' && (
                  <motion.div
                    {...getRootProps()}
                    className={clsx(
                      'relative group cursor-pointer rounded-[3rem] border p-12 md:p-16 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] text-center w-full',
                      isDragActive && !isDragReject
                        ? 'border-[#FF6B35]/50 bg-[#FF6B35]/5 shadow-[0_0_80px_rgba(255,107,53,0.1)] scale-[1.02]'
                        : 'border-[#0D0808]/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#0D0808]/20',
                      isDragReject && 'border-red-500/50 bg-red-500/5',
                      disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <input {...getInputProps()} />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                      {/* Large Animated Icon */}
                      <div className={clsx(
                        'w-24 h-24 rounded-[2.5rem] border flex items-center justify-center transition-all duration-500',
                        isDragActive && !isDragReject ? 'bg-[#FF6B35]/20 border-[#FF6B35] rotate-180' : 'bg-white/5 border-[#0D0808]/10 group-hover:scale-110 group-hover:bg-white/10',
                        isDragReject && 'bg-red-500/20 border-red-500/50'
                      )}>
                        {isDragReject ? (
                          <X className="w-8 h-8 text-red-400" />
                        ) : isDragActive ? (
                          <ArrowUpRight className="w-8 h-8 text-[#FF6B35] animate-bounce" />
                        ) : (
                          <UploadIcon className="w-8 h-8 text-[#FFFFFF]/40 group-hover:text-[#FFFFFF] transition-colors" />
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-4xl font-display font-black text-[#FFFFFF] tracking-tight uppercase">
                          {isDragReject ? 'Invalid Format' : isDragActive ? 'Drop to Extract' : 'Load Signal'}
                        </h3>
                        <p className="text-on-surface-variant text-base font-medium">
                          Drag audio signature here, or <span className="text-[#FFFFFF] underline decoration-[#FF6B35]/30 underline-offset-4 hover:decoration-[#FF6B35] transition-all cursor-pointer">browse workspace</span>
                        </p>
                        {rejected && <p className="text-red-400 text-xs mt-4 font-mono uppercase tracking-widest">{rejected}</p>}
                      </div>

                      {/* Format Pills */}
                      <div className="flex justify-center gap-2 mt-2">
                        {['MP3', 'WAV', 'FLAC', 'OGG'].map(ext => (
                          <span key={ext} className="text-[10px] font-mono text-[#FFFFFF]/30 border border-[#0D0808]/5 rounded-lg px-4 py-2 bg-white/5 tracking-[0.15em]">
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mic Listen Mode */}
                {tab === 'mic' && (
                  <div className="w-full flex flex-col items-center">
                    <MicRecorder onRecorded={handleFile} disabled={step !== 'upload'} />
                  </div>
                )}

                {/* Spotify Song Search Mode */}
                {tab === 'search' && (
                  <div className="w-full flex flex-col gap-8">
                    <form onSubmit={handleSearch} className="relative group">
                      <div className="absolute inset-0 bg-[#FF6B35]/10 blur-[20px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <div className="relative flex items-center">
                        <Search className="absolute left-6 text-[#FFFFFF]/20 w-5 h-5" />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search database for a song, artist, or album..."
                          className="w-full h-16 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-16 pr-6 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/50 transition-all font-medium"
                        />
                        {searching && (
                          <div className="absolute right-6">
                            <div className="w-5 h-5 border-2 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </form>

                    {query.trim().length > 0 && query.trim().length < 3 && (
                      <p className="text-[11px] text-on-surface-variant/40 font-mono uppercase tracking-widest text-center">Spectral signature too short...</p>
                    )}

                    <div className="grid gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                      {tracks.map((track) => (
                        <div key={track.spotify_id} className={clsx(
                          "flex items-center justify-between p-4 obsidian-panel rounded-2xl border border-[#0D0808]/5 hover:border-[#0D0808]/20 transition-all gap-4 group/item",
                          !track.preview_url && "opacity-40"
                        )}>
                          <div className="flex items-center gap-4 min-w-0">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt={track.album} className="w-12 h-12 rounded-xl object-cover border border-[#0D0808]/5 flex-shrink-0 shadow-lg" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#0D0808]/5 flex items-center justify-center flex-shrink-0">
                                <Music className="w-5 h-5 text-on-surface-variant" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[#FFFFFF] truncate group-hover/item:text-[#FF6B35] transition-colors">{track.title}</h4>
                              <p className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider truncate">{track.artist} • {track.album}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {track.preview_url ? (
                              <>
                                <button
                                  onClick={() => togglePreview(track.preview_url)}
                                  className={clsx(
                                    'w-10 h-10 rounded-full flex items-center justify-center border transition-all',
                                    playingUrl === track.preview_url
                                      ? 'bg-[#FF6B35] border-[#FF6B35] text-black'
                                      : 'bg-white/5 border-[#0D0808]/10 text-on-surface-variant hover:text-[#FFFFFF] hover:bg-white/10'
                                  )}
                                >
                                  {playingUrl === track.preview_url ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                </button>

                                <button
                                  onClick={() => handleAnalyzeUrl(track)}
                                  className="px-5 py-2.5 bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-black font-mono text-[9px] uppercase tracking-[0.15em] font-black rounded-xl transition-all"
                                >
                                  Analyze
                                </button>
                              </>
                            ) : (
                              <div className="px-4 py-2 rounded-xl bg-white/5 border border-[#0D0808]/5">
                                  <span className="text-[10px] font-mono text-[#FFFFFF]/20 uppercase tracking-widest select-none">No Preview</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {tracks.length === 0 && !searching && (
                        <div className="text-center py-12 obsidian-panel rounded-[2rem] border border-dashed border-[#0D0808]/5">
                          <Waves className="mx-auto w-8 h-8 text-[#FFFFFF]/10 mb-4" />
                          <p className="text-[11px] font-mono text-[#FFFFFF]/30 uppercase tracking-[0.15em]">Enter query to scan global archives</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2 & 3: Processing */}
            {(step === 'uploading' || step === 'analyzing') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative mb-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#FF6B35]/10 animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#FF6B35]/20 animate-ping" style={{ animationDuration: '3s' }} />

                  <div className="relative w-36 h-36 flex items-center justify-center bg-[#1A1010]/60 backdrop-blur-3xl rounded-[2.5rem] border border-[#FF6B35]/30 shadow-[0_0_50px_rgba(255,107,53,0.1)] overflow-hidden">
                    <div
                      className="absolute w-full h-[2px] bg-[#FF6B35] shadow-[0_0_15px_#FF6B35] scan-line-anim"
                      style={{ top: 0, opacity: 0.5 }}
                    />
                    <AudioWave active bars={12} />
                  </div>

                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center whitespace-nowrap space-y-2">
                    <span className="font-display text-5xl font-black text-[#FFFFFF] tracking-tighter">{Math.floor(visibleProgress)}%</span>
                    <div className="font-mono text-[10px] text-[#FF6B35] font-black uppercase tracking-[0.3em]">
                      {step === 'uploading' ? 'Transmitting Core' : 'Neural Core Active'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mb-12">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-[#0D0808]/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FF6B35] via-[#FF6B35] to-[#FFDAB9]"
                      initial={{ width: 0 }}
                      animate={{ width: `${visibleProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {file && (
                        <p className="font-mono text-[11px] text-on-surface-variant text-center mt-3 uppercase tracking-widest opacity-60 truncate">
                      Source: {file.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  {stageCards.map((card) => (
                    <div
                      key={card.title}
                      className={clsx(
                        'p-5 rounded-2xl flex flex-col gap-3 border transition-all duration-700',
                        card.active
                          ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5'
                          : 'border-[#0D0808]/5 obsidian-panel opacity-40'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className={clsx(
                          'p-2 rounded-xl border transition-colors',
                          card.active ? 'bg-[#FF6B35]/10 border-[#FF6B35]/20' : 'bg-white/[0.02] border-[#0D0808]/5'
                        )}>
                          <card.icon className={clsx('w-4 h-4', card.active ? 'text-[#FF6B35]' : 'text-on-surface-variant')} />
                        </div>
                        {card.active ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-[#FF6B35] rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 border border-[#0D0808]/10 rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-[#FFFFFF] uppercase tracking-wider">{card.title}</h4>
                        <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">{card.engine}</p>
                      </div>
                      <div className="pt-3 border-t border-[#0D0808]/5 flex items-center gap-2">
                        <div className={clsx('w-1.5 h-1.5 rounded-full', card.active ? 'bg-[#FF6B35] animate-pulse shadow-[0_0_10px_#FF6B35]' : 'bg-white/10')} />
                        <span className={clsx('font-mono text-[10px] font-black uppercase tracking-widest', card.active ? 'text-[#FF6B35]' : 'text-on-surface-variant')}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 w-full flex justify-between font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.15em] px-2 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-ping" />
                    Neural Core Online
                  </div>
                  <span>Uptime: {elapsed.toFixed(1)}s</span>
                </div>

                <button
                  onClick={() => { abortRef.current = true; resetState(); }}
                  className="mt-6 px-6 py-2 rounded-lg border border-[#0D0808]/5 text-[10px] font-mono text-on-surface-variant hover:text-[#FFFFFF] hover:border-[#0D0808]/20 transition-all uppercase tracking-widest"
                >
                  Terminate Process
                </button>
              </motion.div>
            )}

            {/* STEP 4: Done */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-[2rem] flex items-center justify-center text-[#FF6B35] mb-8 shadow-[0_0_50px_rgba(255,107,53,0.1)]"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h3 className="text-4xl font-display font-black text-[#FFFFFF] tracking-tight uppercase mb-3">Analysis Secured</h3>
                <p className="text-on-surface-variant font-medium">Decoding spectral report... Prepare for initialization.</p>
                <div className="mt-8 flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i} 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full" 
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: Error */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center relative z-20"
              >
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-[2rem] flex items-center justify-center text-red-500 mb-8">
                  <ShieldCode className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-display font-black text-[#FFFFFF] tracking-tight uppercase mb-3">System Malfunction</h3>
                <p className="text-on-surface-variant font-medium max-w-md">Something went wrong during the analysis process. This might be due to a server timeout or invalid signal.</p>
                <button
                  onClick={resetState}
                  className="mt-8 px-8 py-3 bg-[#FF6B35] text-black font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,107,53,0.3)]"
                >
                  Retry Initialization
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Secure Transfer', text: 'All signals are encrypted using industry standard protocols during transmission.', icon: ShieldCode },
          { title: 'Real-time Processing', text: 'Our neural cluster processes audio in parallel for sub-3-second results.', icon: Cpu },
          { title: 'Global Database', text: 'Access millions of acoustic fingerprints through our identification layer.', icon: Database }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-[2rem] border border-[#0D0808]/5 bg-white/[0.02] space-y-4 hover:border-[#0D0808]/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#0D0808]/10 flex items-center justify-center">
               {i === 0 ? <ShieldCheck className="w-5 h-5 text-[#FFFFFF]/40" /> : i === 1 ? <Cpu className="w-5 h-5 text-[#FFFFFF]/40" /> : <Database className="w-5 h-5 text-[#FFFFFF]/40" />}
            </div>
            <h4 className="font-display font-bold text-sm text-[#FFFFFF] uppercase tracking-widest">{item.title}</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">{item.text}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}


