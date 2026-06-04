import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import toast from 'react-hot-toast';
import { uploadAudio, getResults, searchSongs, analyzeUrl } from '../api/audio';
import { useJobSocket } from '../hooks/useJobSocket';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import MicRecorder from '../components/MicRecorder';
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
  useFrame((state) => {
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
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
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
    <div className="flex items-end gap-1 h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="rounded-t-full transition-all"
          style={{
            width: '5px',
            background: i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.2)',
            animation: active ? `bar-pulse-css ${0.8 + Math.random() * 0.8}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.07}s`,
            height: active ? undefined : '6px',
          }}
        />
      ))}
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function Upload() {
  const [tab, setTab] = useState('file'); // 'file' | 'mic' | 'search'
  const [step, setStep] = useState('upload'); // 'upload' | 'uploading' | 'analyzing' | 'done'
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
        toast.error('Analysis pipeline failed', { style: { background: 'var(--color-surface-container)', color: '#fff' } });
        resetState();
      } else if (['analyzing', 'saving', 'processing'].includes(socketStatus || '')) {
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

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    abortRef.current = false;

    try {
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');

      toast.success('Signal captured! Neural core syncing...', {
        style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' },
        iconTheme: { primary: 'var(--color-primary)', secondary: '#000' },
      });

      for (let i = 0; i < 60; i++) {
        if (abortRef.current) return;
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { data: rd } = await getResults(id);
          if (rd.data?.song_title !== undefined || rd.data?.bpm !== undefined) {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
          if (rd.data?.status === 'failed') throw new Error('Analysis failed');
          if (rd.data?.status === 'completed') {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
        } catch (pollErr) {
          if (pollErr?.response?.status === 404) continue;
          throw pollErr;
        }
      }
      throw new Error('Analysis timed out');
    } catch (err) {
      if (abortRef.current) return;
      toast.error(err.message || 'Signal transmission failed');
      resetState();
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
    setProgress(50);
    abortRef.current = false;

    try {
      const { data } = await analyzeUrl(track.preview_url, track.title, track.artist);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');

      toast.success('Remote track cached! Analyzing...', {
        style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' },
        iconTheme: { primary: 'var(--color-primary)', secondary: '#000' },
      });

      for (let i = 0; i < 60; i++) {
        if (abortRef.current) return;
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { data: rd } = await getResults(id);
          if (rd.data?.song_title !== undefined || rd.data?.bpm !== undefined) {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
          if (rd.data?.status === 'failed') throw new Error('Analysis failed');
          if (rd.data?.status === 'completed') {
            setStep('done');
            setTimeout(() => navigate(`/results/${id}`), 1200);
            return;
          }
        } catch (pollErr) {
          if (pollErr?.response?.status === 404) continue;
          throw pollErr;
        }
      }
      throw new Error('Analysis timed out');
    } catch (err) {
      if (abortRef.current) return;
      toast.error(err.message || 'Signal transmission failed');
      resetState();
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
      icon: 'search',
      title: 'Song ID',
      engine: 'ACRCloud Core',
      status: step === 'uploading' ? 'Buffered' : socketStatus === 'processing' ? 'Matching...' : 'Scanning...',
      active: step === 'analyzing' && ['processing', 'analyzing'].includes(socketStatus),
    },
    {
      icon: 'equalizer',
      title: 'Spectral DNA',
      engine: 'librosa + ML',
      status: step === 'uploading' ? 'Queued' : socketStatus === 'analyzing' ? 'Extracting...' : socketStatus === 'saving' ? 'Complete' : 'Queued',
      active: step === 'analyzing' && socketStatus === 'analyzing',
    },
    {
      icon: 'architecture',
      title: 'Classifiers',
      engine: 'YAMNet Array',
      status: socketStatus === 'saving' ? 'Persisting...' : socketStatus === 'completed' ? 'Complete' : 'Queued',
      active: socketStatus === 'saving',
    },
  ];

  return (
    <PageWrapper className="space-y-gutter pb-16">
      <header className="mb-6">
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" }}>Extraction Engine</h1>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Upload audio, use your microphone to listen, or search songs directly to identify tempo, mood, and spectral characteristics.
        </p>
      </header>

      {/* Modern Tabs */}
      {step === 'upload' && (
        <div className="flex gap-2 p-1 glass-panel rounded-xl border border-glass-border w-max mb-6">
          {[
            { id: 'file', label: 'File Upload', icon: 'upload_file' },
            { id: 'mic', label: 'Listen Live', icon: 'mic' },
            { id: 'search', label: 'Song Search', icon: 'search' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); stopPreview(); }}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all duration-300',
                tab === t.id
                  ? 'bg-primary text-surface font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              )}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative glass-panel rounded-xl border border-glass-border overflow-hidden p-8 min-h-[500px] flex items-center justify-center">
        {/* Interactive 3D Vinyl Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 1, 8]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <VinylRecord spinning={step !== 'upload'} drop={step === 'analyzing'} />
                {step === 'analyzing' && <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={2} />}
            </Canvas>
        </div>

        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/3 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
          <AnimatePresence mode="wait">

            {/* STEP 1: Upload / Mic / Search Modes */}
            {step === 'upload' && (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="w-full"
              >
                {/* File Upload Mode */}
                {tab === 'file' && (
                  <motion.div
                    {...getRootProps()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'relative overflow-hidden group cursor-pointer rounded-[2.5rem] border p-12 md:p-20 transition-all duration-500 ease-out shadow-2xl text-center w-full backdrop-blur-2xl',
                      // Glassmorphism effects
                      'bg-white/[0.03]',
                      isDragActive && !isDragReject
                        ? 'border-primary/50 bg-primary/10 shadow-[0_0_80px_rgba(255,255,255,0.1)]'
                        : 'border-white/10 hover:bg-white/[0.05] hover:border-white/25',
                      isDragReject && 'border-red-500/50 bg-red-500/10',
                      disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <input {...getInputProps()} />

                    <div className="relative z-10 flex flex-col items-center gap-6">
                      {/* Large Animated Icon */}
                      <div className={clsx(
                        'w-24 h-24 rounded-full border flex items-center justify-center transition-all duration-500',
                        isDragActive && !isDragReject ? 'bg-primary/20 border-primary scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 group-hover:scale-110 group-hover:bg-white/10',
                        isDragReject && 'bg-red-500/20 border-red-500/50'
                      )}>
                        {isDragReject ? (
                          <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                        ) : isDragActive ? (
                          <span className="material-symbols-outlined text-primary text-4xl animate-pulse">download</span>
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 text-4xl group-hover:text-white transition-colors">upload_file</span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-headline text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
                          {isDragReject ? 'Unsupported Format' : isDragActive ? 'Drop audio to extract' : 'Load Audio Signature'}
                        </h3>
                        <p className="text-gray-400 text-lg font-light">
                          Drag & drop your file, or <span className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all">browse files</span>
                        </p>
                        {rejected && <p className="text-red-400 text-sm mt-4 font-mono">{rejected}</p>}
                      </div>

                      {/* Format Pills */}
                      <div className="flex justify-center gap-3 mt-4">
                        {['MP3', 'WAV', 'FLAC', 'OGG', 'M4A'].map(ext => (
                          <span key={ext} className="text-[10px] font-mono text-gray-500 border border-white/10 rounded-md px-4 py-1.5 bg-black/40">
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mic Listen Mode */}
                {tab === 'mic' && (
                  <MicRecorder onRecorded={handleFile} disabled={step !== 'upload'} />
                )}

                {/* Spotify Song Search Mode */}
                {tab === 'search' && (
                  <div className="w-full flex flex-col gap-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search for a song, artist, or album..."
                          className="input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={searching || !query.trim()}
                        className="btn-primary"
                      >
                        {searching ? '...' : 'Search'}
                      </button>
                    </form>

                    <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                      {tracks.map((track) => (
                        <div key={track.spotify_id} className="flex items-center justify-between p-3 glass-card hover:border-white/20 transition-all gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt={track.album} className="w-10 h-10 rounded object-cover border border-glass-border flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-white/5 border border-glass-border flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-lg text-on-surface-variant">music_note</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                              <p className="text-xs text-on-surface-variant truncate">{track.artist} • {track.album}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {track.preview_url ? (
                              <>
                                <button
                                  onClick={() => togglePreview(track.preview_url)}
                                  className={clsx(
                                    'w-8 h-8 rounded-full flex items-center justify-center border transition-all',
                                    playingUrl === track.preview_url
                                      ? 'bg-primary/20 border-primary text-primary'
                                      : 'bg-white/5 border-glass-border text-on-surface-variant hover:text-white hover:bg-white/10'
                                  )}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {playingUrl === track.preview_url ? 'pause' : 'play_arrow'}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleAnalyzeUrl(track)}
                                  className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-surface font-mono text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all"
                                >
                                  Analyze
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-on-surface-variant/40 uppercase select-none px-2">No Preview</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {tracks.length === 0 && !searching && (
                        <div className="text-center py-8 border border-dashed border-glass-border rounded-lg bg-black/10">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">queue_music</span>
                          <p className="text-xs text-on-surface-variant">Your search results will appear here</p>
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
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative mb-16">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />

                  <div className="relative w-32 h-32 flex items-center justify-center bg-surface-container/90 backdrop-blur-2xl rounded-full border border-primary/30 glow-pulse overflow-hidden">
                    <div
                      className="absolute w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent scan-line-anim"
                      style={{ top: 0 }}
                    />
                    <AudioWave active bars={10} />
                  </div>

                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <span className="font-mono text-3xl font-bold text-white tracking-tight">{Math.floor(visibleProgress)}%</span>
                    <div className="font-mono text-[9px] text-primary uppercase tracking-[0.2em] mt-0.5">
                      {step === 'uploading' ? 'Transmitting Data' : 'Neural Analysis Active'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mb-8">
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      style={{ boxShadow: '0 0 10px rgba(255,255,255,0.2)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${visibleProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {file && (
                    <p className="font-mono text-[9px] text-on-surface-variant text-center mt-2 truncate">
                      {file.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                  {stageCards.map((card) => (
                    <div
                      key={card.title}
                      className={clsx(
                        'glass-panel p-4 rounded-lg flex flex-col gap-2 border transition-all duration-500',
                        card.active
                          ? 'border-l-2 border-l-primary border-primary/20 bg-primary/[0.02]'
                          : 'border-glass-border opacity-50'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className={clsx(
                          'p-1.5 rounded border',
                          card.active ? 'bg-primary/10 border-primary/20' : 'bg-white/[0.02] border-glass-border'
                        )}>
                          <span className={clsx('material-symbols-outlined text-base', card.active ? 'text-primary' : 'text-on-surface-variant')}>
                            {card.icon}
                          </span>
                        </div>
                        {card.active ? (
                          <div className="w-4 h-4 border border-t-transparent border-primary rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 border border-white/10 rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">{card.title}</h4>
                        <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">{card.engine}</p>
                      </div>
                      <div className="pt-2 border-t border-glass-border flex items-center gap-1.5">
                        <div className={clsx('w-1.5 h-1.5 rounded-full', card.active ? 'bg-primary animate-pulse' : 'bg-white/10')} />
                        <span className={clsx('font-mono text-[8px] uppercase tracking-wider', card.active ? 'text-primary' : 'text-on-surface-variant')}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 w-full flex justify-between font-mono text-[9px] text-on-surface-variant uppercase tracking-widest px-1">
                  <span>Neural Core: Active</span>
                  <span>Elapsed: {elapsed.toFixed(1)}s</span>
                </div>

                <button
                  onClick={() => { abortRef.current = true; resetState(); }}
                  className="mt-4 text-[10px] font-mono text-on-surface-variant hover:text-red-400 transition-colors uppercase tracking-widest"
                >
                  Cancel
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
                  className="w-16 h-16 bg-primary/15 border-2 border-primary/40 rounded-full flex items-center justify-center text-primary mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </motion.div>
                <h3 className="font-headline text-2xl font-bold text-white mb-2">Analysis Complete</h3>
                <p className="text-sm text-on-surface-variant">Redirecting to your spectral report...</p>
                <div className="mt-4 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
