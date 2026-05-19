import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
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
  const [jobId, setJobId] = useState(null);
  const navigate = useNavigate();

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    try {
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setJobId(id);
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

  const visibleProgress = step === 'analyzing' || step === 'done' ? Math.max(progress, step === 'done' ? 99 : 68) : progress;

  return (
    <div className="min-h-screen bg-deep-obsidian text-on-surface font-body-md waveform-bg overflow-x-hidden">
      <style>{`
        .waveform-bg {
          background-image: radial-gradient(circle at 2px 2px, rgba(195, 244, 0, 0.05) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .glass-morphism {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glow-border:hover {
          box-shadow: 0 0 30px rgba(195, 244, 0, 0.15);
          border-color: rgba(195, 244, 0, 0.4);
        }
        .animated-wave {
          height: 2px;
          background: #C3F400;
          box-shadow: 0 0 10px #C3F400;
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(3); opacity: 1; }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }

        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .sonic-glow {
          filter: drop-shadow(0 0 15px rgba(215, 255, 90, 0.4));
        }

        .loader-ring {
          border: 2px solid transparent;
          border-top-color: #abd600;
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .waveform-bar {
          animation: waveform 1.2s ease-in-out infinite;
        }

        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-glass-border shadow-[0_0_20px_rgba(0,245,255,0.05)]">
        <nav className="flex justify-between items-center px-margin-desktop py-4">
          <div className="flex items-center gap-8">
            <span className="font-display-lg text-headline-md tracking-tighter text-neon-cyan font-bold">Beatzy AI</span>
            <div className="hidden md:flex gap-6">
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed hover:backdrop-brightness-125 transition-all active:scale-95" href="#">Main Stage</a>
              <a className="font-body-md text-body-md text-neon-cyan border-b-2 border-neon-cyan pb-1 hover:backdrop-brightness-125 transition-all active:scale-95" href="#">Inside the Wave</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed hover:backdrop-brightness-125 transition-all active:scale-95" href="#">Artist Echoes</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed hover:backdrop-brightness-125 transition-all active:scale-95" href="#">Production Suite</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-neon-cyan cursor-pointer active:scale-95 transition-transform">account_circle</span>
          </div>
        </nav>
      </header>

      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[280px] z-40 bg-deep-obsidian/90 backdrop-blur-lg border-r border-glass-border flex-col pt-24 pb-8">
        <div className="px-8 mb-12">
          <h2 className="font-headline-md text-neon-cyan font-bold">Operator</h2>
          <p className="font-label-sm text-label-sm text-outline opacity-60">v2.4.0-Stable</p>
        </div>
        <div className="flex flex-col gap-2">
          <a className="flex items-center gap-4 px-8 py-4 font-label-md text-label-md text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-4 font-label-md text-label-md text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span>Spectral</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-4 font-label-md text-label-md text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">mic_external_on</span>
            <span>Studio</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-4 font-label-md text-label-md text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">library_music</span>
            <span>Library</span>
          </a>
        </div>
      </aside>

      <main className="ml-0 md:ml-[280px] min-h-screen pt-20 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-screen" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg')" }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-background"></div>

        <div className="relative z-10 w-full max-w-4xl px-margin-mobile md:px-0">
          <div className="flex flex-col items-center">
            <div className="relative mb-16">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-secondary-fixed/20" style={{ animation: 'pulse-ring 3s ease-out infinite' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-secondary-fixed/40" style={{ animation: 'pulse-ring 3s ease-out infinite 1s' }}></div>
              <div className="relative w-40 h-40 flex items-center justify-center bg-surface-container-high/50 backdrop-blur-2xl rounded-full border-2 border-secondary-fixed/30 sonic-glow overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary-fixed/30 to-transparent w-full h-[2px] z-10" style={{ animation: 'scan-line 2.5s linear infinite' }}></div>
                <div className="flex items-end gap-1 h-12">
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.1s' }}></div>
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.3s' }}></div>
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.5s' }}></div>
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.2s' }}></div>
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.4s' }}></div>
                  <div className="waveform-bar w-1 bg-secondary-fixed" style={{ animationDelay: '0.6s' }}></div>
                </div>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center">
                <span className="font-headline-xl text-headline-xl text-on-surface" id="progress-val">{Math.floor(visibleProgress)}%</span>
                <div className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-widest mt-1">
                  {step === 'uploading' ? 'Uploading Signal' : step === 'analyzing' ? 'Analyzing Signal' : 'Analysis Complete'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full">
              <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-l-4 border-l-secondary-fixed transition-all hover:translate-y-[-2px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-surface-container-highest rounded">
                    <span className="material-symbols-outlined text-secondary-fixed">search</span>
                  </div>
                  <div className="loader-ring w-5 h-5"></div>
                </div>
                <div>
                  <h3 className="font-headline-lg text-body-lg text-on-surface mb-1">Song identification</h3>
                  <p className="font-label-sm text-label-sm text-outline">ACRCloud Engine</p>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-fixed rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-label-md text-secondary-fixed uppercase tracking-wider">Verifying matches...</span>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-l-4 border-l-secondary-fixed transition-all hover:translate-y-[-2px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-surface-container-highest rounded">
                    <span className="material-symbols-outlined text-secondary-fixed">equalizer</span>
                  </div>
                  <div className="loader-ring w-5 h-5"></div>
                </div>
                <div>
                  <h3 className="font-headline-lg text-body-lg text-on-surface mb-1">Tempo & spectral</h3>
                  <p className="font-label-sm text-label-sm text-outline">librosa Toolkit</p>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-fixed rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-label-md text-secondary-fixed uppercase tracking-wider">Extracting BPM...</span>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-l-4 border-l-secondary-fixed/30 opacity-80 transition-all hover:translate-y-[-2px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-surface-container-highest rounded">
                    <span className="material-symbols-outlined text-outline">architecture</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-outline/20 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-headline-lg text-body-lg text-on-surface mb-1">Audio event class</h3>
                  <p className="font-label-sm text-label-sm text-outline">YAMNet Neural Net</p>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-outline/30 rounded-full"></div>
                  <span className="text-[10px] font-label-md text-outline uppercase tracking-wider">Queueing...</span>
                </div>
              </div>
            </div>

            <div className="mt-12 w-full flex justify-between items-center px-4 font-label-sm text-label-sm text-outline">
              <div className="flex gap-4">
                <span>BUFFER: 2048 SAMPLES</span>
                <span>|</span>
                <span>ENGINE: V3-NEURAL</span>
              </div>
              <div className="flex gap-4">
                <span id="elapsed-time">ELAPSED: 00:12.4s</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'uploading' && (
                <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 glass-morphism rounded-xl p-8 border border-glass-border max-w-3xl mx-auto w-full">
                  {file && <WaveformVisualizer file={file} />}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-on-surface-variant">Uploading {file?.name}</span>
                      <span className="font-mono text-sonic-lime">{progress}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <motion.div className="h-full bg-secondary-fixed rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 glass-morphism rounded-xl p-8 border border-glass-border text-center py-12 max-w-3xl mx-auto w-full">
                  <CheckCircle size={48} className="text-secondary-fixed mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Analysis complete!</h2>
                  <p className="text-on-surface-variant">Redirecting to results...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mb-8 md:mb-0 mt-10">
              <div className="max-w-2xl mx-auto text-on-surface-variant font-body-lg text-body-lg">
                Upload an audio file to identify the song and get deep AI insights. Our spectral engine processes harmonics, rhythm, and emotional metadata.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 border-t border-glass-border bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-headline-md text-on-surface font-bold">Beatzy AI</span>
            <span className="font-code-sm text-code-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</span>
          </div>
          <div className="flex gap-8">
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Architecture</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Privacy</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">API Documentation</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Terms of Resonance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
