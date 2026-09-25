import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, PageHeader, Tabs } from '../components/ui';

// Keep the aliases browsers actually report — Chrome calls .m4a `audio/x-m4a`,
// not `audio/mp4`. Listing only the canonical types made the dropzone and the
// API disagree about the same file.
const ACCEPTED = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav', '.wave'],
  'audio/ogg': ['.ogg', '.oga', '.opus'],
  'audio/flac': ['.flac'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/x-m4a': ['.m4a'],
  'audio/aac': ['.aac'],
  'audio/webm': ['.webm'],
};

// A slow, deterministic wave. Random per-bar heights and durations read as
// flicker; a phase-shifted sine reads as one motion.
function AudioWave({ active, bars = 12 }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const peak = 14 + 26 * Math.abs(Math.sin((i + 1) * 0.9));
        return (
          <motion.div
            key={i}
            animate={active ? { height: [8, peak, 8] } : { height: 4 }}
            transition={active ? {
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.09,
            } : {}}
            className="w-1 rounded-full bg-brand"
            style={{ opacity: active ? 0.9 : 0.2 }}
          />
        );
      })}
    </div>
  );
}

export default function Upload() {
  const [tab, setTab] = useState('file'); // 'file' | 'mic' | 'search'
  const [step, setStep] = useState('upload'); // 'upload' | 'uploading' | 'analyzing' | 'error'
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
        navigate(`/results/${jobId}`);
      } else if (socketStatus === 'failed') {
        // Stop the polling loop first, or it reports the same failure again.
        abortRef.current = true;
        toast.dismiss('polling-status');
        // The results endpoint returns `{ status: 'failed', error }` at the top level
        getResults(jobId).then(({ data }) => {
            toast.error(data?.error || 'Analysis pipeline failed');
        }).catch(() => {
            toast.error('Analysis pipeline failed');
        }).finally(() => {
            setStep('error');
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

  // Poll until the job completes (navigates to the report) or fails (throws).
  // Six minutes covers the worker's 4-minute ML timeout plus a retry; the old
  // three-minute cap declared "timed out" on jobs that were still running.
  const pollUntilDone = useCallback(async (id) => {
    let errorCount404 = 0;
    for (let i = 0; i < 120; i++) {
      if (abortRef.current) return;
      await new Promise(r => setTimeout(r, 3000));
      if (abortRef.current) return;
      try {
        const { data: rd } = await getResults(id);
        errorCount404 = 0;
        toast.dismiss('polling-status');

        if (rd.status === 'complete') {
          navigate(`/results/${id}`);
          return;
        }
        if (rd.status === 'failed') {
          throw new Error(rd.error || 'Analysis failed');
        }
      } catch (pollErr) {
        if (pollErr?.response?.status === 404) {
          errorCount404++;
          if (errorCount404 > 10) {
            throw new Error('Analysis job could not be found');
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
  }, [navigate]);

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
        style: { background: 'var(--surface)', color: 'var(--brand)', border: '1px solid var(--line)' },
      });

      await pollUntilDone(id);
    } catch (err) {
      if (abortRef.current) return;
      toast.dismiss('polling-status');
      toast.error(err.response?.data?.error?.message || err.message || 'Signal transmission failed');
      setStep('error');
    }
  }, [pollUntilDone]);

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

      await pollUntilDone(id);
    } catch (err) {
      if (abortRef.current) return;
      toast.dismiss('polling-status');
      toast.error(err.response?.data?.error?.message || err.message || 'Signal transmission failed');
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
  const visibleProgress = liveProgress != null
      ? liveProgress
      : step === 'analyzing'
        ? Math.min(99, Math.max(68, Math.floor(68 + elapsed * 2.5)))
        : progress;

  const stageCards = [
    {
      icon: SearchCode,
      title: 'Identify',
      engine: 'Shazam · AcoustID',
      status: step === 'uploading' ? 'Waiting' : socketStatus === 'processing' ? 'Matching…' : 'Running…',
      active: step === 'analyzing' && ['processing', 'analyzing'].includes(socketStatus),
    },
    {
      icon: Activity,
      title: 'Audio features',
      engine: 'Tempo · key · chords',
      status: step === 'uploading' ? 'Queued' : socketStatus === 'analyzing' ? 'Extracting…' : socketStatus === 'saving' ? 'Done' : 'Queued',
      active: step === 'analyzing' && socketStatus === 'analyzing',
    },
    {
      icon: Cpu,
      title: 'Classify',
      engine: 'YAMNet',
      status: socketStatus === 'saving' ? 'Saving…' : socketStatus === 'completed' ? 'Done' : 'Queued',
      active: socketStatus === 'saving',
    },
  ];

  return (
    <PageWrapper className="space-y-10 pb-16 animate-page-entrance">
      <PageHeader
        eyebrow="Analyze"
        title="Analyze a track"
        description="Upload a file, record a snippet, or search the catalog. Beatzy identifies the song and returns tempo, key, chords, mood and lyrics."
        actions={
          step === 'upload' && (
            <Tabs
              aria-label="Audio source"
              value={tab}
              onChange={(id) => { setTab(id); stopPreview(); }}
              items={[
                { id: 'file', label: 'Upload file', icon: UploadIcon },
                { id: 'mic', label: 'Record', icon: Mic },
                { id: 'search', label: 'Search catalog', icon: Search },
              ]}
            />
          )
        }
      />

      <div className="relative rounded-3xl border border-line bg-surface overflow-hidden p-8 md:p-12 min-h-[35rem] flex items-center justify-center">
        {/* Soft glow behind the content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

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
                      'relative group cursor-pointer rounded-3xl border p-10 md:p-14 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-center w-full',
                      isDragActive && !isDragReject
                        ? 'border-brand/50 bg-brand/5 shadow-[0_0_80px_color-mix(in_oklab,var(--brand)_10%,transparent)] scale-[1.02]'
                        : 'border-line-subtle bg-ink/[0.02] hover:bg-ink/[0.04] hover:border-line',
                      isDragReject && 'border-red-500/50 bg-red-500/5',
                      disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <input {...getInputProps()} />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                      {/* Large Animated Icon */}
                      <div className={clsx(
                        'w-20 h-20 rounded-3xl border flex items-center justify-center transition-all duration-300',
                        isDragActive && !isDragReject ? 'bg-brand/20 border-brand rotate-180' : 'bg-ink/5 border-line group-hover:scale-110 group-hover:bg-ink/10',
                        isDragReject && 'bg-red-500/20 border-red-500/50'
                      )}>
                        {isDragReject ? (
                          <X className="w-8 h-8 text-red-400" />
                        ) : isDragActive ? (
                          <ArrowUpRight className="w-8 h-8 text-brand animate-bounce" />
                        ) : (
                          <UploadIcon className="w-8 h-8 text-ink/40 group-hover:text-ink transition-colors" />
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                          {isDragReject ? 'That file type isn’t supported' : isDragActive ? 'Drop to analyze' : 'Drop an audio file'}
                        </h3>
                        <p className="text-[0.9375rem] text-ink-muted">
                          Drag a track here, or <span className="text-ink underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand">browse your files</span>
                        </p>
                        {rejected && <p className="mt-3 text-[0.8125rem] text-danger">{rejected}</p>}
                      </div>

                      {/* Accepted formats */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {['MP3', 'WAV', 'FLAC', 'M4A', 'OGG'].map(ext => (
                          <span key={ext} className="rounded-md border border-line-subtle bg-veil-1 px-2.5 py-1 text-[0.6875rem] font-medium text-ink-muted">
                            {ext}
                          </span>
                        ))}
                        <span className="px-1 text-[0.6875rem] text-ink-faint">up to 50 MB</span>
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
                      <div className="relative flex items-center">
                        <Search className="pointer-events-none absolute left-5 h-5 w-5 text-ink-faint" />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search for a song, artist or album"
                          className="h-14 w-full rounded-xl border border-line bg-surface pl-14 pr-6 text-[0.9375rem] text-ink placeholder:text-ink-faint transition-colors focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                        {searching && (
                          <div className="absolute right-6">
                            <div className="w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </form>

                    {query.trim().length > 0 && query.trim().length < 3 && (
                      <p className="text-center text-[0.8125rem] text-ink-faint">Type at least 3 characters to search</p>
                    )}

                    <div className="grid gap-3 max-h-[24rem] overflow-y-auto pr-2 custom-scrollbar">
                      {tracks.map((track) => (
                        <div key={track.spotify_id} className={clsx(
                          "flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong/60 group/item",
                          !track.preview_url && "opacity-50"
                        )}>
                          <div className="flex items-center gap-4 min-w-0">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt={track.album} className="w-12 h-12 rounded-xl object-cover border border-line-subtle flex-shrink-0 shadow-lg" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-ink/5 border border-line-subtle flex items-center justify-center flex-shrink-0">
                                <Music className="w-5 h-5 text-on-surface-variant" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-medium text-ink">{track.title}</h4>
                              <p className="truncate text-xs text-ink-muted">{track.artist} · {track.album}</p>
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
                                      ? 'bg-brand border-brand text-brand-ink'
                                      : 'bg-ink/5 border-line text-on-surface-variant hover:text-ink hover:bg-ink/10'
                                  )}
                                >
                                  {playingUrl === track.preview_url ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                </button>

                                <button
                                  onClick={() => handleAnalyzeUrl(track)}
                                  className="rounded-lg bg-brand px-4 py-2 text-[0.8125rem] font-semibold text-brand-ink transition-colors hover:bg-brand-hover"
                                >
                                  Analyze
                                </button>
                              </>
                            ) : (
                              <span className="px-2 text-xs text-ink-faint select-none">No preview</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {tracks.length === 0 && !searching && (
                        <div className="rounded-2xl border border-dashed border-line py-12 text-center">
                          <Waves className="mx-auto mb-3 h-6 w-6 text-ink-faint" />
                          <p className="text-[0.8125rem] text-ink-muted">Results will appear here</p>
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
                  {/* One still ring and one slowly turning dashed ring — motion
                      you can sense, not a strobe. */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-brand/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-dashed border-brand/25 animate-[spin_24s_linear_infinite]" />

                  <div className="relative w-36 h-36 flex items-center justify-center bg-surface/70 backdrop-blur-xl rounded-3xl border border-brand/30 shadow-[0_0_40px_color-mix(in_oklab,var(--brand)_8%,transparent)] overflow-hidden">
                    <AudioWave active bars={12} />
                  </div>

                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center whitespace-nowrap space-y-2">
                    <span className="font-display text-4xl font-semibold tabular-nums tracking-tight text-ink">{Math.floor(visibleProgress)}%</span>
                    <div className="text-[0.8125rem] font-medium text-brand">
                      {step === 'uploading' ? 'Uploading' : 'Analyzing'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mb-12">
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden border border-line-subtle">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand via-brand to-accent-warm"
                      initial={{ width: 0 }}
                      animate={{ width: `${visibleProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {file && (
                    <p className="mt-3 truncate text-center text-xs text-ink-muted">
                      {file.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  {stageCards.map((card) => (
                    <div
                      key={card.title}
                      className={clsx(
                        'p-5 rounded-2xl flex flex-col gap-3 border transition-all duration-500',
                        card.active
                          ? 'border-brand/40 bg-brand/5'
                          : 'border-line bg-surface opacity-60'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className={clsx(
                          'p-2 rounded-xl border transition-colors',
                          card.active ? 'bg-brand/10 border-brand/20' : 'bg-ink/[0.02] border-line-subtle'
                        )}>
                          <card.icon className={clsx('w-4 h-4', card.active ? 'text-brand' : 'text-on-surface-variant')} />
                        </div>
                        {card.active ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-brand rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 border border-line rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[0.8125rem] font-medium text-ink">{card.title}</h4>
                        <p className="mt-0.5 text-xs text-ink-muted">{card.engine}</p>
                      </div>
                      <div className="pt-3 border-t border-line-subtle flex items-center gap-2">
                        <div className={clsx('w-1.5 h-1.5 rounded-full', card.active ? 'bg-brand shadow-[0_0_8px_var(--brand)]' : 'bg-ink/10')} />
                        <span className={clsx('text-xs font-medium', card.active ? 'text-brand' : 'text-ink-muted')}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex w-full justify-between px-1 text-xs text-ink-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    Processing
                  </div>
                  <span className="tabular-nums">Elapsed {elapsed.toFixed(1)}s</span>
                </div>

                <button
                  onClick={() => { abortRef.current = true; resetState(); }}
                  className="btn-secondary mt-6 text-[0.8125rem] !px-5 !py-2"
                >
                  Cancel
                </button>
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
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
                  <ShieldCode className="h-8 w-8" />
                </div>
                <h3 className="mb-2 font-display text-2xl font-semibold tracking-tight text-ink">Analysis failed</h3>
                <p className="max-w-md text-[0.9375rem] text-ink-muted">Something went wrong while analyzing this track. The error was shown in the notification; you can try again or pick a different file.</p>
                <button onClick={resetState} className="btn-primary mt-6 text-sm">
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Good to know */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Formats', text: 'MP3, WAV, FLAC, M4A, OGG and WebM, up to 50 MB per file.', icon: Database },
          { title: 'Recordings', text: 'Capture at least a few seconds of clear audio. Noisy rooms are fine; silence is not.', icon: Mic },
          { title: 'Privacy', text: 'Source audio is deleted from storage as soon as the analysis is saved.', icon: ShieldCheck },
        ].map((item) => (
          <Card key={item.title} padding="sm" className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-subtle bg-veil-1">
              <item.icon className="h-4 w-4 text-ink-muted" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[0.8125rem] font-medium text-ink">{item.title}</h4>
              <p className="text-xs leading-relaxed text-ink-muted">{item.text}</p>
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}


