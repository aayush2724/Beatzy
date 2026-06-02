import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getHistory, deleteJob } from '../api/audio';
import toast from 'react-hot-toast';

const MOODS = ['', 'energetic', 'happy', 'chill', 'sad', 'dark', 'epic', 'calm', 'aggressive'];
const KEYS = ['', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MOOD_COLORS = {
  energetic: '#D7FF5A',
  happy: '#FFD700',
  chill: '#60D4F7',
  sad: '#7CA9E6',
  dark: '#9B59B6',
  epic: '#FF6B6B',
  calm: '#80EAC2',
  aggressive: '#FF4500',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const card = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider border transition-all ${
        active
          ? 'bg-sonic-lime/15 border-sonic-lime/40 text-sonic-lime'
          : 'bg-white/[0.02] border-glass-border text-on-surface-variant hover:border-white/20 hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  );
}

function TrackCard({ job, onDelete }) {
  const spotifyMeta = (() => {
    try {
      const raw = job.spotify_features;
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Object.keys(parsed).length > 0 ? parsed : null;
    } catch { return null; }
  })();

  const moodColor = MOOD_COLORS[job.mood] || '#D7FF5A';
  const isCompleted = job.status === 'completed';
  const title = job.song_title || job.original_filename || 'Unknown Signal';
  const dateStr = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div variants={card} className="group relative glass-panel border border-glass-border rounded-xl overflow-hidden hover:border-sonic-lime/20 transition-all">
      {/* Cover art strip */}
      <div className="relative h-28 bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
        {spotifyMeta?.cover_url ? (
          <img
            src={spotifyMeta.cover_url}
            alt={title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            <span className="material-symbols-outlined text-4xl text-sonic-lime">audio_file</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {isCompleted ? (
            <span className="px-2 py-0.5 bg-sonic-lime/15 border border-sonic-lime/30 text-sonic-lime font-mono text-[8px] rounded tracking-wider uppercase">✓ Done</span>
          ) : job.status === 'failed' ? (
            <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 font-mono text-[8px] rounded tracking-wider uppercase">Failed</span>
          ) : (
            <span className="px-2 py-0.5 bg-prism-violet/15 border border-prism-violet/30 text-prism-violet font-mono text-[8px] rounded tracking-wider uppercase animate-pulse">{job.status}</span>
          )}
        </div>

        {/* BPM badge */}
        {job.bpm && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded font-mono text-[9px] text-sonic-lime border border-sonic-lime/20">
            {Math.round(job.bpm)} BPM
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(job.id); }}
          className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 border border-red-500/20"
          title="Delete"
        >
          <span className="material-symbols-outlined text-xs">delete</span>
        </button>
      </div>

      {/* Info */}
      <Link to={isCompleted ? `/results/${job.id}` : '#'} className="block p-4">
        <h3 className="font-mono text-xs font-bold text-white truncate leading-tight mb-0.5">{title}</h3>
        {job.song_artist && (
          <p className="font-mono text-[9px] text-on-surface-variant truncate mb-2">{job.song_artist}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          {job.mood && (
            <span
              className="px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider border"
              style={{ color: moodColor, borderColor: `${moodColor}30`, background: `${moodColor}10` }}
            >
              {job.mood}
            </span>
          )}
          {job.key_signature && (
            <span className="px-2 py-0.5 bg-prism-violet/10 border border-prism-violet/20 text-prism-violet rounded font-mono text-[8px] uppercase tracking-wider">
              {job.key_signature}
            </span>
          )}
        </div>

        <p className="font-mono text-[8px] text-on-surface-variant/50 mt-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-[10px]">schedule</span>
          {dateStr}
        </p>
      </Link>
    </motion.div>
  );
}

export default function History() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [mood, setMood] = useState('');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [key, setKey] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    const filters = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (mood) filters.mood = mood;
    if (bpmMin) filters.bpm_min = bpmMin;
    if (bpmMax) filters.bpm_max = bpmMax;
    if (key) filters.key = key;

    getHistory(page, 18, filters)
      .then(({ data }) => {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, mood, bpmMin, bpmMax, key]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mood, bpmMin, bpmMax, key]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function handleDelete(jobId) {
    if (!confirm('Delete this analysis?')) return;
    deleteJob(jobId)
      .then(() => {
        toast.success('Analysis deleted', {
          style: { background: '#0c0c0c', color: '#D7FF5A', border: '1px solid rgba(215,255,90,0.3)' },
        });
        fetchHistory();
      })
      .catch(() => toast.error('Delete failed'));
  }

  function clearFilters() {
    setSearch(''); setMood(''); setBpmMin(''); setBpmMax(''); setKey(''); setPage(1);
  }

  const hasFilters = search || mood || bpmMin || bpmMax || key;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Track History</h1>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
            {pagination.total} signal{pagination.total !== 1 ? 's' : ''} archived
          </p>
        </div>
        <Link
          to="/upload"
          className="px-5 py-2.5 bg-sonic-lime text-black rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-sonic-lime/90 transition-all shadow-[0_0_20px_rgba(215,255,90,0.15)] flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">waves</span>
          New Analysis
        </Link>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel border border-glass-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="font-mono text-[9px] text-red-400 hover:text-red-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-xs">close</span>
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search by title, artist, or filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-glass-border rounded-lg font-mono text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-sonic-lime/40 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Mood filter */}
          <div className="flex-1 min-w-[160px]">
            <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-2">Mood</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <FilterChip
                  key={m || 'all'}
                  label={m || 'All'}
                  active={mood === m}
                  onClick={() => setMood(m)}
                />
              ))}
            </div>
          </div>

          {/* Key filter */}
          <div>
            <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-2">Key</label>
            <div className="flex flex-wrap gap-1.5">
              {KEYS.map(k => (
                <FilterChip
                  key={k || 'all'}
                  label={k || 'All'}
                  active={key === k}
                  onClick={() => setKey(k)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* BPM range */}
        <div>
          <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mb-2">
            BPM Range {(bpmMin || bpmMax) && <span className="text-sonic-lime">{bpmMin || '0'} – {bpmMax || '∞'}</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Min"
              min="0" max="300"
              value={bpmMin}
              onChange={e => setBpmMin(e.target.value)}
              className="w-24 px-3 py-2 bg-white/[0.03] border border-glass-border rounded font-mono text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-sonic-lime/40 transition-colors"
            />
            <span className="text-on-surface-variant font-mono text-xs">—</span>
            <input
              type="number"
              placeholder="Max"
              min="0" max="300"
              value={bpmMax}
              onChange={e => setBpmMax(e.target.value)}
              className="w-24 px-3 py-2 bg-white/[0.03] border border-glass-border rounded font-mono text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-sonic-lime/40 transition-colors"
            />
            {[
              { label: 'Slow <90', min: '', max: '90' },
              { label: '90–120', min: '90', max: '120' },
              { label: '120–140', min: '120', max: '140' },
              { label: 'Fast >140', min: '140', max: '' },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => { setBpmMin(preset.min); setBpmMax(preset.max); }}
                className={`px-2.5 py-1.5 rounded font-mono text-[8px] uppercase tracking-wider border transition-all hidden sm:block ${
                  bpmMin === preset.min && bpmMax === preset.max
                    ? 'bg-sonic-lime/15 border-sonic-lime/40 text-sonic-lime'
                    : 'bg-white/[0.02] border-glass-border text-on-surface-variant hover:border-white/20'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-panel border border-glass-border rounded-xl overflow-hidden animate-pulse">
              <div className="h-28 bg-white/[0.03]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-white/[0.04] rounded w-3/4" />
                <div className="h-2 bg-white/[0.03] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-panel border border-glass-border rounded-xl">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">
            {hasFilters ? 'search_off' : 'folder_open'}
          </span>
          <p className="font-mono text-sm text-on-surface-variant uppercase tracking-wider mb-2">
            {hasFilters ? 'No matches found' : 'No analyses yet'}
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant/50 mb-6">
            {hasFilters ? 'Try adjusting your filters' : 'Upload your first audio file to get started'}
          </p>
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-glass-border rounded font-mono text-xs text-on-surface-variant hover:text-white hover:border-white/20 transition-all uppercase tracking-wider"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              to="/upload"
              className="px-5 py-2.5 bg-sonic-lime text-black rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-sonic-lime/90 transition-all"
            >
              Analyze Audio
            </Link>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${mood}-${debouncedSearch}-${key}-${bpmMin}-${bpmMax}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {jobs.map(job => (
              <TrackCard key={job.id} job={job} onDelete={handleDelete} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-glass-border rounded font-mono text-[10px] text-on-surface-variant hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">chevron_left</span>
            Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
              const p = pagination.pages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= pagination.pages - 3 ? pagination.pages - 6 + i
                : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded font-mono text-[10px] transition-all border ${
                    page === p
                      ? 'bg-sonic-lime/15 border-sonic-lime/40 text-sonic-lime'
                      : 'border-glass-border text-on-surface-variant hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1.5 border border-glass-border rounded font-mono text-[10px] text-on-surface-variant hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-1"
          >
            Next
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>

          <span className="font-mono text-[9px] text-on-surface-variant ml-2">
            {page} / {pagination.pages}
          </span>
        </div>
      )}
    </div>
  );
}
