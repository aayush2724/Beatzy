import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadProgressBar from '../components/UploadProgressBar';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { uploadAudio, pollForResults } from '../api/audio';
import { useJobSocket } from '../hooks/useJobSocket';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

const ACCEPTED = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
  'audio/mp4': ['.m4a'],
};

export default function Upload() {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [jobId, setJobId] = useState(null);
  const navigate = useNavigate();

  // Real-time socket progress
  const { status: socketStatus, progress: socketProgress } = useJobSocket(jobId);

  // Elapsed timer simulation for scanning feedback
  useEffect(() => {
    let timer;
    if (step === 'uploading' || step === 'analyzing') {
      timer = setInterval(() => {
        setElapsed(e => e + 0.1);
      }, 100);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [step]);

  // React to socket events for step transitions
  useEffect(() => {
    if (!jobId) return;
    if (socketStatus === 'completed') {
      setStep('done');
      setTimeout(() => navigate(`/results/${jobId}`), 1200);
    } else if (socketStatus === 'failed') {
      toast.error('Analysis pipeline failed');
      setStep('upload');
      setFile(null);
      setProgress(0);
      setJobId(null);
    } else if (socketStatus === 'analyzing' || socketStatus === 'saving') {
      setStep('analyzing');
    }
  }, [socketStatus, jobId, navigate]);

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    try {
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');
      toast.success('Signal captured! Syncing neural core...');
      // Polling as fallback if socket doesn't fire
      await pollForResults(id);
      setStep('done');
      setTimeout(() => navigate(`/results/${id}`), 1200);
    } catch (err) {
      toast.error(err.message || 'Signal transmission failed');
      setStep('upload');
      setFile(null);
      setProgress(0);
      setJobId(null);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled: step !== 'upload',
    onDropAccepted: ([acceptedFile]) => handleFile(acceptedFile),
  });

  const rejected = fileRejections[0]?.errors[0]?.message;
  
  // Progress calculations — use socket progress when available, else simulated
  const liveProgress = socketProgress > 0 ? socketProgress : null;
  const visibleProgress = step === 'done'
    ? 100
    : liveProgress != null
      ? liveProgress
      : step === 'analyzing'
        ? Math.min(99, Math.max(68, Math.floor(68 + (elapsed * 2.5))))
        : progress;

  return (
    <div className="space-y-gutter pb-16">
      {/* Dynamic Header */}
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Audio Extraction Engine</h1>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Transmit your sonic waves to the Neural Core for multi-dimensional stem analysis and identification.
        </p>
      </header>

      {/* Main Board Area with Cinematic Visual Backdrop */}
      <div className="relative glass-panel rounded-xl border border-glass-border overflow-hidden p-8 min-h-[460px] flex items-center justify-center">
        {/* Cinematic Backdrop Image Layer */}
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen bg-cover bg-center"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg')",
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: DROPZONE ── */}
            {step === 'upload' && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="w-full flex flex-col items-center"
              >
                <div
                  {...getRootProps()}
                  className={clsx(
                    'relative border border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 w-full bg-[#131313]/60 backdrop-blur-md select-none',
                    isDragActive && !isDragReject && 'border-sonic-lime bg-sonic-lime/5 shadow-[0_0_30px_rgba(215,255,90,0.1)]',
                    isDragReject && 'border-red-500 bg-red-500/5',
                    !isDragActive && 'border-white/10 hover:border-sonic-lime/40 hover:shadow-[0_0_25px_rgba(215,255,90,0.05)]'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-sonic-lime/10 border border-sonic-lime/20 rounded-lg flex items-center justify-center text-sonic-lime shadow-[0_0_15px_rgba(215,255,90,0.1)]">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1 tracking-tight">Load Audio Signature</h2>
                      <p className="text-xs text-on-surface-variant font-medium">Drag & drop your wave file here, or browse local volumes</p>
                      <p className="text-[10px] font-mono text-on-surface-variant/40 tracking-wider uppercase mt-4">
                        MP3 · WAV · FLAC · OGG · M4A &nbsp;·&nbsp; MAXIMUM SIZE 50 MB
                      </p>
                    </div>
                    {rejected && <p className="text-red-400 font-mono text-xs uppercase tracking-wider">{rejected}</p>}
                  </div>
                </div>

                <p className="text-on-surface-variant text-xs font-medium text-center mt-6 max-w-sm leading-relaxed">
                  Our system decodes signals at deep sub-millisecond levels, cataloging transient curves and key vectors.
                </p>
              </motion.div>
            )}

            {/* ── STEP 2 & 3: UPLOADING & ANALYZING ── */}
            {(step === 'uploading' || step === 'analyzing') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                {/* Immersive Pulse Scanning Core */}
                <div className="relative mb-16">
                  {/* Glowing orbital expanders */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-sonic-lime/15 animate-[ping_3s_ease-out_infinite]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-sonic-lime/25 animate-[ping_3s_ease-out_infinite_1.2s]" />

                  {/* Core Orb */}
                  <div className="relative w-28 h-28 flex items-center justify-center bg-[#131313]/90 backdrop-blur-2xl rounded-full border border-sonic-lime/30 shadow-[0_0_20px_rgba(215,255,90,0.15)] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sonic-lime/20 to-transparent w-full h-[1.5px] z-10 animate-[scan-line_2.2s_linear_infinite]" />
                    <div className="flex items-end gap-1 h-10">
                      {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6].map((delay, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-sonic-lime rounded-t-full animate-[waveform-upload_1.2s_ease-in-out_infinite]"
                          style={{ animationDelay: `${delay}s`, height: '8px' }} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dynamic percentage stats */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <span className="font-mono text-2xl font-bold text-white tracking-tight">{Math.floor(visibleProgress)}%</span>
                    <div className="font-mono text-[9px] text-sonic-lime uppercase tracking-[0.15em] mt-0.5">
                      {step === 'uploading' ? 'Transmitting Data' : 'Synthesizing Signal'}
                    </div>
                  </div>
                </div>

                {/* Sub-process telemetry grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full mt-4">
                  {[
                    { icon: 'search', title: 'Identification', engine: 'ACRCloud Core',
                      status: step === 'uploading' ? 'Buffered' : socketStatus === 'processing' ? 'Loading model...' : 'Matching signature...',
                      active: step === 'analyzing' && (socketStatus === 'processing' || socketStatus === 'analyzing') },
                    { icon: 'equalizer', title: 'Spectral DNA', engine: 'librosa engine',
                      status: step === 'uploading' ? 'Buffered' : socketStatus === 'analyzing' ? 'Extracting metrics...' : socketStatus === 'saving' ? 'Complete' : 'Queued',
                      active: step === 'analyzing' && socketStatus === 'analyzing' },
                    { icon: 'architecture', title: 'Classifiers', engine: 'YAMNet Array',
                      status: socketStatus === 'saving' ? 'Persisting results...' : socketStatus === 'completed' ? 'Complete' : 'Queued',
                      active: socketStatus === 'saving' },
                  ].map((card) => (
                    <div 
                      key={card.title}
                      className={clsx(
                        'glass-panel p-5 rounded-lg flex flex-col gap-3 border border-glass-border hover:border-sonic-lime/10 transition-all',
                        card.active ? 'border-l-2 border-l-sonic-lime bg-white/[0.01]' : 'opacity-60'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-1.5 bg-white/[0.03] border border-glass-border rounded">
                          <span className={clsx('material-symbols-outlined text-base', card.active ? 'text-sonic-lime' : 'text-on-surface-variant')}>
                            {card.icon}
                          </span>
                        </div>
                        {card.active ? (
                          <div className="w-4 h-4 border border-t-transparent border-sonic-lime rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 border border-white/10 rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">{card.title}</h4>
                        <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mt-0.5">{card.engine}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-glass-border flex items-center gap-1.5">
                        <div className={clsx('w-1.5 h-1.5 rounded-full', card.active ? 'bg-sonic-lime animate-pulse' : 'bg-white/10')} />
                        <span className={clsx('font-mono text-[8px] uppercase tracking-wider', card.active ? 'text-sonic-lime' : 'text-on-surface-variant')}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar visualizer */}
                {step === 'uploading' && (
                  <UploadProgressBar progress={visibleProgress} status={step} fileName={file?.name} />
                )}

                {/* Technical status bottom telemetry bar */}
                <div className="mt-8 w-full flex justify-between items-center px-1 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
                  <span>BUFFERED IN CORE: 2048 SAMPLES</span>
                  <span>ELAPSED: {elapsed.toFixed(1)}s</span>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: ANALYSIS COMPLETE ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-8 border border-glass-border rounded-xl text-center"
              >
                <div className="w-14 h-14 bg-sonic-lime/10 border border-sonic-lime/25 rounded-full flex items-center justify-center text-sonic-lime mx-auto mb-4 animate-bounce">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h3 className="font-headline text-lg font-bold text-white mb-1">Signal Aligned</h3>
                <p className="text-xs text-on-surface-variant font-medium">Telemetry matrices updated. Redirecting to spectral outputs...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes waveform-upload {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
      `}</style>
    </div>
  );
}
