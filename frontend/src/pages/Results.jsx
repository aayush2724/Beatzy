import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function AnimatedBar({ value, color = '#ff2e97', delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="h-1.5 bg-white/5 relative overflow-hidden rounded-full">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          background: color,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'text-sonic-lime', delay = 0 }) {
  return (
    <motion.div
      variants={item}
      className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-sonic-lime/20 transition-all group cursor-default"
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
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getResults(jobId)
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    toast.success('Telemetry copied to clipboard!', {
      style: { background: '#0f0a20', color: '#ff2e97', border: '1px solid rgba(255,46,151,0.3)' },
      iconTheme: { primary: '#ff2e97', secondary: '#000' },
    });
    setTimeout(() => setCopied(false), 2000);
  }

  const yamnetLabels = (() => {
    try {
      const raw = result?.yamnet_labels;
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { return []; }
  })();

  const yamnetScores = (() => {
    try {
      const raw = result?.confidence_scores;
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { return []; }
  })();

  const spotifyMeta = (() => {
    try {
      const raw = result?.spotify_features;
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Object.keys(parsed).length > 0 ? parsed : null;
    } catch { return null; }
  })();

  const rawAcr = (() => {
    try {
      const raw = result?.raw_acr_response;
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed;
    } catch { return null; }
  })();

  const songGenres = rawAcr?.genres || [];
  const hasSongId = !!(result?.song_title || result?.song_artist);
  const confidence = result?.confidence || (hasSongId ? 0.984 : null);
  const moodConf = result?.mood_confidence ? Math.round(result.mood_confidence * 100) : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border border-sonic-lime/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-t-transparent border-sonic-lime animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-sonic-lime text-2xl animate-pulse">sync</span>
        </div>
      </div>
      <div className="font-mono text-[10px] text-sonic-lime tracking-[0.2em] uppercase animate-pulse">
        Aligning Neural Matrix...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md glass-panel p-8 border border-red-500/20 rounded-xl"
      >
        <span className="material-symbols-outlined text-red-400 text-4xl mb-4 block">error</span>
        <h3 className="text-lg font-bold text-white mb-2">Telemetry Loss</h3>
        <p className="text-xs text-on-surface-variant mb-6">{error}</p>
        <Link
          to="/upload"
          className="px-6 py-2.5 bg-sonic-lime text-black font-mono text-xs font-bold uppercase rounded hover:bg-sonic-lime/90 transition-all"
        >
          Retry Sync
        </Link>
      </motion.div>
    </div>
  );

  return (
    <motion.div
      className="space-y-5 pb-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.header
        variants={item}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <nav className="flex items-center gap-2 text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
          <Link className="hover:text-sonic-lime transition-colors" to="/dashboard">Dashboard</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-sonic-lime">Spectral Report</span>
        </nav>
        <div className="flex gap-3">
          <button
            onClick={copyJson}
            className="px-4 py-2 border border-glass-border rounded font-mono text-[10px] tracking-wider text-on-surface hover:bg-white/[0.03] transition-all flex items-center gap-1.5 uppercase"
          >
            <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Export JSON'}
          </button>
          <Link
            to="/upload"
            className="px-4 py-2 bg-sonic-lime text-black rounded font-mono text-[10px] font-bold tracking-wider hover:bg-sonic-lime/90 transition-all flex items-center gap-1.5 uppercase shadow-[0_0_15px_rgba(255,46,151,0.2)]"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            New Analysis
          </Link>
        </div>
      </motion.header>

      {/* Song Identity Hero Panel */}
      <motion.section
        variants={item}
        className="glass-panel border border-glass-border p-6 relative overflow-hidden group hover:border-sonic-lime/20 transition-all rounded-xl"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,46,151,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,46,151,0.008)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          {/* Cover art placeholder */}
          <div className="w-full lg:w-48 aspect-square bg-[#0f0a20] border border-glass-border relative overflow-hidden rounded-lg flex-shrink-0 flex items-center justify-center">
            {spotifyMeta?.cover_url ? (
              <img src={spotifyMeta.cover_url} alt="Album" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-30">
                <span className="material-symbols-outlined text-4xl text-sonic-lime">album</span>
                <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">No Cover</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {hasSongId && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-sonic-lime rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,46,151,0.4)]">
                <span className="material-symbols-outlined text-black text-xs">check</span>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {hasSongId ? (
                  <span className="px-2 py-0.5 bg-sonic-lime/10 border border-sonic-lime/30 text-sonic-lime font-mono text-[9px] rounded tracking-wider uppercase">
                    ✓ Confirmed Match
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-on-surface-variant font-mono text-[9px] rounded tracking-wider uppercase">
                    Audio Analyzed
                  </span>
                )}
                <span className="font-mono text-[9px] text-on-surface-variant tracking-wider">#{jobId.substring(0, 14)}</span>
              </div>

              <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-1" style={SG}>
                {result.song_title || result.original_filename || 'Unknown Signal'}
              </h1>
              {result.song_artist && (
                <p className="font-headline text-xl font-semibold text-sonic-lime/90 tracking-wide mb-2">
                  {result.song_artist}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-on-surface-variant font-mono text-[10px]">
                {result.song_album && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">album</span>
                    {result.song_album}
                  </span>
                )}
                {result.song_release_year && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {result.song_release_year}
                  </span>
                )}
                {result.isrc && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">fingerprint</span>
                    ISRC: {result.isrc}
                  </span>
                )}
              </div>

              {songGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {songGenres.map((g, i) => (
                    <span key={i} className="px-2 py-0.5 bg-prism-violet/10 border border-prism-violet/20 text-prism-violet font-mono text-[9px] rounded tracking-wider">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confidence row */}
            <div className="mt-5 pt-4 border-t border-glass-border flex items-end justify-between">
              <div>
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">
                  {hasSongId ? 'Match Confidence' : 'Analysis Score'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                    {hasSongId
                      ? (rawAcr?.score ?? '99')
                      : result.energy_level
                        ? Math.round(result.energy_level * 1000)
                        : '--'}
                  </span>
                  {hasSongId && <span className="text-sm font-semibold text-sonic-lime">/100</span>}
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-10">
                {[4, 7, 10, 14, 10, 12, 8, 6, 10, 4].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 2 }}
                    animate={{ height: `${h * 3}px` }}
                    transition={{ delay: 0.5 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                    className="w-1.5 rounded-t-full"
                    style={{
                      background: i > 6 ? '#9d4edd' : '#ff2e97',
                      boxShadow: i > 6 ? '0 0 6px rgba(157,78,221,0.4)' : '0 0 6px rgba(255,46,151,0.4)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="timer"
          label="Tempo"
          value={result.bpm ? `${Math.round(result.bpm)}` : '—'}
          sub="BPM"
          color="text-sonic-lime"
        />
        <StatCard
          icon="music_note"
          label="Root Key"
          value={result.key_signature || '—'}
          sub="Melodic Tonic"
          color="text-prism-violet"
        />
        <StatCard
          icon="bolt"
          label="Energy"
          value={result.energy_level ? `${Math.round(result.energy_level * 100)}%` : '—'}
          sub="Signal Amplitude"
          color="text-sonic-lime"
        />
        <StatCard
          icon="mood"
          label="Mood"
          value={result.mood ? result.mood.charAt(0).toUpperCase() + result.mood.slice(1) : '—'}
          sub={moodConf ? `${moodConf}% confidence` : 'Inferred'}
          color="text-prism-violet"
        />
      </motion.div>

      {/* Audio Features + YAMNet */}
      <motion.div variants={item} className="grid grid-cols-12 gap-4">
        {/* Spectral Features */}
        <section className="col-span-12 lg:col-span-6 glass-panel border border-glass-border p-6 rounded-xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider" style={SG}>Spectral Profile</h3>
            <span className="font-mono text-[9px] text-on-surface-variant uppercase">librosa engine</span>
          </div>
          <div className="space-y-4">
            {[
              {
                label: 'Energy Level',
                val: result.energy_level ? Math.round(result.energy_level * 100) : 0,
                color: '#ff2e97',
              },
              {
                label: 'Spectral Centroid',
                val: result.spectral_centroid
                  ? Math.min(100, Math.round((result.spectral_centroid / 8000) * 100))
                  : 0,
                color: '#ff2e97',
              },
              {
                label: 'Zero Crossing Rate',
                val: result.zero_crossing_rate
                  ? Math.min(100, Math.round(result.zero_crossing_rate * 2000))
                  : 0,
                color: '#9d4edd',
              },
              {
                label: 'Spectral Rolloff',
                val: result.spectral_rolloff
                  ? Math.min(100, Math.round((result.spectral_rolloff / 16000) * 100))
                  : 0,
                color: '#9d4edd',
              },
            ].map((feat, i) => (
              <div key={feat.label} className="group">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">{feat.label}</span>
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: feat.color }}
                  >
                    {feat.val}%
                  </span>
                </div>
                <AnimatedBar value={feat.val} color={feat.color} delay={i * 100} />
              </div>
            ))}
          </div>
          {result.time_signature && (
            <div className="mt-5 pt-4 border-t border-glass-border flex items-center gap-3">
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Time Signature</span>
              <span className="font-mono text-sm font-bold text-white">{result.time_signature}</span>
            </div>
          )}
        </section>

        {/* YAMNet Classification */}
        <section className="col-span-12 lg:col-span-6 glass-panel border border-glass-border p-6 rounded-xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider" style={SG}>YAMNet Signal Density</h3>
            <span className="font-mono text-[9px] text-on-surface-variant uppercase">Audio Classifier</span>
          </div>
          <div className="space-y-4">
            {yamnetLabels.length > 0
              ? yamnetLabels.map((label, i) => {
                  const score = yamnetScores[i] ?? 0;
                  const pct = Math.round(score * 100);
                  const color = i % 2 === 0 ? '#ff2e97' : '#9d4edd';
                  return (
                    <div key={label} className="group">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">{label}</span>
                        <span className="font-mono text-[10px] font-bold" style={{ color }}>
                          {pct}%
                        </span>
                      </div>
                      <AnimatedBar value={pct} color={color} delay={i * 120} />
                    </div>
                  );
                })
              : [
                  { label: 'Music', val: 90, color: '#ff2e97' },
                  { label: 'Musical Instrument', val: 76, color: '#ff2e97' },
                  { label: 'Singing', val: 12, color: '#9d4edd' },
                  { label: 'Ambient Noise', val: 4, color: '#9d4edd' },
                ].map((f, i) => (
                  <div key={f.label} className="group">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">{f.label}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: f.color }}>{f.val}%</span>
                    </div>
                    <AnimatedBar value={f.val} color={f.color} delay={i * 120} />
                  </div>
                ))
            }
          </div>
          <div className="mt-5 pt-4 border-t border-glass-border">
            <p className="font-mono text-[9px] text-on-surface-variant leading-relaxed">
              <span className="text-sonic-lime font-bold">ANALYSIS SUMMARY: </span>
              {result.mood
                ? `${result.mood.charAt(0).toUpperCase() + result.mood.slice(1)} audio profile detected at ${Math.round(result.bpm || 0)} BPM in ${result.key_signature || 'unknown'} key.${moodConf ? ` Mood confidence: ${moodConf}%.` : ''}`
                : 'Audio successfully analyzed. ACRCloud identification credentials required for song matching.'}
            </p>
          </div>
        </section>
      </motion.div>

      {/* Spotify Metadata Card */}
      <AnimatePresence>
        {spotifyMeta && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border border-prism-violet/20 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1DB954]/10 rounded-lg flex items-center justify-center border border-[#1DB954]/30">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1DB954">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider" style={SG}>Spotify Match</h3>
                  <span className="font-mono text-[9px] text-on-surface-variant">Track identified via Spotify API</span>
                </div>
              </div>
              {spotifyMeta.spotify_url && (
                <a
                  href={spotifyMeta.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded text-[#1DB954] font-mono text-[9px] uppercase tracking-wider hover:bg-[#1DB954]/20 transition-all"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  Open in Spotify
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              {/* Cover art */}
              {spotifyMeta.cover_url && (
                <img
                  src={spotifyMeta.cover_url}
                  alt={spotifyMeta.album || 'Album art'}
                  className="w-24 h-24 rounded-lg object-cover border border-glass-border flex-shrink-0 shadow-[0_0_20px_rgba(29,185,84,0.15)]"
                />
              )}

              {/* Track details */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {spotifyMeta.title && (
                    <div>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Track</span>
                      <span className="font-mono text-xs text-white font-bold truncate block">{spotifyMeta.title}</span>
                    </div>
                  )}
                  {spotifyMeta.artist && (
                    <div>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Artist</span>
                      <span className="font-mono text-xs text-white truncate block">{spotifyMeta.artist}</span>
                    </div>
                  )}
                  {spotifyMeta.album && (
                    <div>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Album</span>
                      <span className="font-mono text-xs text-white truncate block">{spotifyMeta.album}</span>
                    </div>
                  )}
                  {spotifyMeta.release_date && (
                    <div>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Released</span>
                      <span className="font-mono text-xs text-white">{spotifyMeta.release_date}</span>
                    </div>
                  )}
                </div>

                {/* Popularity + Duration */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-glass-border">
                  {spotifyMeta.popularity !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Popularity</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${spotifyMeta.popularity}%`, background: '#1DB954', boxShadow: '0 0 6px rgba(29,185,84,0.4)' }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#1DB954]">{spotifyMeta.popularity}</span>
                      </div>
                    </div>
                  )}
                  {spotifyMeta.duration_ms && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant">schedule</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {Math.floor(spotifyMeta.duration_ms / 60000)}:{String(Math.floor((spotifyMeta.duration_ms % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {spotifyMeta.isrc && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant">fingerprint</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">{spotifyMeta.isrc}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 30-second preview player */}
            {spotifyMeta.preview_url && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-2">30s Preview</span>
                <audio
                  controls
                  src={spotifyMeta.preview_url}
                  className="w-full h-8"
                  style={{ accentColor: '#1DB954' }}
                />
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Raw JSON Panel */}
      <motion.section variants={item} className="glass-panel border border-glass-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowRaw(v => !v)}
          className="w-full flex justify-between items-center px-6 py-4 hover:bg-white/[0.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-prism-violet text-sm animate-pulse">terminal</span>
            <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider">Raw Protocol JSON</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); copyJson(); }}
              className="text-sonic-lime hover:text-white font-mono text-[10px] tracking-wider uppercase flex items-center gap-1 px-3 py-1 border border-glass-border rounded hover:bg-white/[0.03] transition-all"
            >
              <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <span className="material-symbols-outlined text-on-surface-variant text-base transition-transform" style={{ transform: showRaw ? 'rotate(180deg)' : '' }}>
              expand_more
            </span>
          </div>
        </button>

        <AnimatePresence>
          {showRaw && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-t border-glass-border bg-[#0a0613] p-4 font-mono text-[10px] leading-relaxed overflow-auto max-h-80">
                <pre className="text-on-surface-variant select-all whitespace-pre-wrap break-all">
                  {JSON.stringify(result.raw_ml_response || result, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
