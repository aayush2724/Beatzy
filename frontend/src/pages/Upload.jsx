import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { uploadAudio, pollForResults } from '../api/audio';
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
  const navigate = useNavigate();

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    try {
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setStep('analyzing');
      toast.success('Uploaded! Analyzing your audio...');
      await pollForResults(id);
      setStep('done');
      setTimeout(() => navigate(`/results/${id}`), 1200);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setStep('upload');
      setFile(null);
      setProgress(0);
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
  const visibleProgress = step === 'analyzing' || step === 'done'
    ? Math.max(progress, step === 'done' ? 99 : 68)
    : progress;

  return (
    <div className="min-h-full text-on-surface font-body-md overflow-x-hidden" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(195, 244, 0, 0.04) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    }}>
      <style>{`
        .glass-morphism {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glow-border-upload:hover {
          box-shadow: 0 0 30px rgba(195, 244, 0, 0.15);
          border-color: rgba(195, 244, 0, 0.4);
        }
        .sonic-glow-upload {
          filter: drop-shadow(0 0 15px rgba(215, 255, 90, 0.4));
        }
        .loader-ring-upload {
          border: 2px solid transparent;
          border-top-color: #abd600;
          border-radius: 50%;
          animation: spin-upload 1.5s linear infinite;
        }
        @keyframes spin-upload {
          to { transform: rotate(360deg); }
        }
        .upload-waveform-bar {
          animation: waveform-upload 1.2s ease-in-out infinite;
        }
        @keyframes waveform-upload {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        @keyframes pulse-ring-upload {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
        @keyframes scan-line-upload {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-on-surface mb-1">Analyze Audio</h1>
        <p className="text-outline text-sm">Upload a track to identify it and extract deep spectral insights.</p>
      </div>

      {/* Background accent */}
      <div className="relative">
        <div
          className="absolute inset-0 z-0 rounded-2xl opacity-30 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900 rounded-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center py-8">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Dropzone ── */}
            {step === 'upload' && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="w-full max-w-xl flex flex-col items-center"
              >
                <div
                  {...getRootProps()}
                  className={clsx(
                    'relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 w-full glass-morphism glow-border-upload',
                    isDragActive && !isDragReject && 'border-secondary-fixed bg-secondary-fixed/5 shadow-[0_0_30px_rgba(195,244,0,0.15)]',
                    isDragReject && 'border-red-500 bg-red-500/5',
                    !isDragActive && 'border-white/10 hover:border-secondary-fixed/50'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-secondary-fixed/10 border border-secondary-fixed/20 rounded-2xl flex items-center justify-center text-secondary-fixed shadow-[0_0_20px_rgba(195,244,0,0.1)]">
                      <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>upload_file</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface mb-2">
                        {isDragActive ? 'Drop the audio signature' : 'Load Audio Signature'}
                      </h2>
                      <p className="text-outline text-sm">Drag & drop your file, or click to browse</p>
                      <p className="text-outline/40 text-xs mt-4">MP3 · WAV · FLAC · OGG · M4A &nbsp;·&nbsp; Max 50 MB</p>
                    </div>
                    {rejected && <p className="text-red-400 text-sm">{rejected}</p>}
                  </div>
                </div>

                <p className="text-on-surface-variant text-sm text-center mt-8 max-w-md leading-relaxed">
                  Our spectral engine processes harmonics, rhythm, mood, and emotional metadata to deliver sub-millisecond classification.
                </p>
              </motion.div>
            )}

            {/* ── STEPS 2-4: Processing ── */}
            {step !== 'upload' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                {/* Pulsing rings */}
                <div className="relative mb-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-secondary-fixed/20"
                    style={{ animation: 'pulse-ring-upload 3s ease-out infinite' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-secondary-fixed/40"
                    style={{ animation: 'pulse-ring-upload 3s ease-out infinite 1s' }} />
                  <div className="relative w-40 h-40 flex items-center justify-center bg-surface-container-high/50 backdrop-blur-2xl rounded-full border-2 border-secondary-fixed/30 sonic-glow-upload overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary-fixed/30 to-transparent w-full h-[2px] z-10"
                      style={{ animation: 'scan-line-upload 2.5s linear infinite' }} />
                    <div className="flex items-end gap-1 h-12">
                      {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6].map((delay, i) => (
                        <div key={i} className="upload-waveform-bar w-1 bg-secondary-fixed rounded-t-full"
                          style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <span className="font-headline-xl text-headline-xl text-on-surface">{Math.floor(visibleProgress)}%</span>
                    <div className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-widest mt-1">
                      {step === 'uploading' ? 'Uploading Signal' : step === 'analyzing' ? 'Analyzing Signal' : 'Analysis Complete'}
                    </div>
                  </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { icon: 'search', title: 'Song Identification', sub: 'ACRCloud Engine', status: 'Verifying matches...', active: true },
                    { icon: 'equalizer', title: 'Tempo & Spectral', sub: 'librosa Toolkit', status: 'Extracting BPM...', active: true },
                    { icon: 'architecture', title: 'Audio Event Class', sub: 'YAMNet Neural Net', status: 'Queueing...', active: false },
                  ].map((card) => (
                    <div key={card.title}
                      className={clsx(
                        'glass-morphism p-6 rounded-xl flex flex-col gap-4 border-l-4 transition-all hover:-translate-y-0.5',
                        card.active ? 'border-l-secondary-fixed' : 'border-l-secondary-fixed/30 opacity-80'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-surface-container-highest rounded">
                          <span className={clsx('material-symbols-outlined', card.active ? 'text-secondary-fixed' : 'text-outline')}>
                            {card.icon}
                          </span>
                        </div>
                        {card.active
                          ? <div className="loader-ring-upload w-5 h-5" />
                          : <div className="w-5 h-5 border-2 border-outline/20 rounded-full" />
                        }
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-on-surface mb-0.5">{card.title}</h3>
                        <p className="text-xs text-outline">{card.sub}</p>
                      </div>
                      <div className="mt-auto pt-4 flex items-center gap-2">
                        <div className={clsx('w-2 h-2 rounded-full', card.active ? 'bg-secondary-fixed animate-pulse' : 'bg-outline/30')} />
                        <span className={clsx('text-[10px] uppercase tracking-wider', card.active ? 'text-secondary-fixed' : 'text-outline')}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="mt-10 w-full flex justify-between items-center px-2 text-xs text-outline font-mono">
                  <span>BUFFER: 2048 SAMPLES &nbsp;|&nbsp; ENGINE: V3-NEURAL</span>
                  <span>ELAPSED: {new Date().toISOString().substr(14, 5)}s</span>
                </div>

                {/* Upload progress */}
                {step === 'uploading' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-8 glass-morphism rounded-xl p-8 border border-glass-border w-full"
                  >
                    {file && <WaveformVisualizer file={file} />}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-on-surface-variant truncate max-w-xs">Uploading {file?.name}</span>
                        <span className="font-mono text-secondary-fixed ml-4">{progress}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-secondary-fixed rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Done */}
                {step === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 glass-morphism rounded-xl p-8 border border-glass-border text-center w-full"
                  >
                    <CheckCircle size={48} className="text-secondary-fixed mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Analysis complete!</h2>
                    <p className="text-on-surface-variant">Redirecting to results...</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
