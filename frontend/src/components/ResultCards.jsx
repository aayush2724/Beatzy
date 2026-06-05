import { Music2, Zap, Heart, Clock, Key, Activity, Tag } from 'lucide-react';
import clsx from 'clsx';

const MOOD_COLORS = {
  energetic: 'text-orange-400 bg-orange-400/10',
  happy: 'text-yellow-400 bg-yellow-400/10',
  sad: 'text-blue-400 bg-blue-400/10',
  calm: 'text-green-400 bg-green-400/10',
  excited: 'text-[#1A1410] bg-white/10',
  melancholic: 'text-vanilla-glow bg-vanilla-glow/10',
  neutral: 'text-on-surface-variant bg-surface-container',
};

function MetricCard({ icon: Icon, label, value, sub, color = 'text-vibrant-orange' }) {
  return (
    <div className="glass-card hover:border-vibrant-orange/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center border border-glass-border">
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1 text-on-surface">{value ?? '—'}</p>
      <p className="text-sm font-medium text-on-surface-variant">{label}</p>
      {sub && <p className="text-xs text-outline mt-1">{sub}</p>}
    </div>
  );
}

export function SongCard({ result }) {
  return (
    <div className="glass-card border-vibrant-orange/30 bg-gradient-to-br from-vibrant-orange/5 to-surface-container-low">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-vibrant-orange/10 rounded-xl flex items-center justify-center shrink-0 border border-vibrant-orange/30">
          <Music2 size={32} className="text-vibrant-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate text-on-surface">
            {result.song_title || 'Unknown Track'}
          </h2>
          <p className="text-on-surface-variant text-lg truncate">
            {result.song_artist || 'Unknown Artist'}
          </p>
          {result.song_album && (
            <p className="text-outline text-sm mt-1 truncate">{result.song_album}</p>
          )}
          {result.isrc && (
            <p className="text-xs text-outline-variant font-mono mt-2">ISRC: {result.isrc}</p>
          )}
        </div>
        {result.song_release_year && (
          <span className="badge bg-surface-container-high text-on-surface-variant shrink-0">{result.song_release_year}</span>
        )}
      </div>
    </div>
  );
}

export function AudioMetricsGrid({ result }) {
  const moodClass = MOOD_COLORS[result.mood] || MOOD_COLORS.neutral;
  const energyPercent = result.energy_level
    ? `${Math.round(result.energy_level * 100)}%`
    : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <MetricCard
        icon={Activity}
        label="Tempo (BPM)"
        value={result.bpm ? `${result.bpm} BPM` : null}
        sub="Beats per minute"
        color="text-green-400"
      />
      <MetricCard
        icon={Zap}
        label="Energy Level"
        value={energyPercent}
        sub="Audio energy intensity"
        color="text-vibrant-orange"
      />
      <div className="glass-card hover:border-vibrant-orange/30 transition-colors">
        <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center mb-3 border border-glass-border">
          <Heart size={20} className="text-[#1A1410]" />
        </div>
        <p className="text-2xl font-bold mb-1 capitalize text-on-surface">{result.mood || '—'}</p>
        <p className="text-sm font-medium text-on-surface-variant">Mood</p>
        {result.mood && (
          <span className={clsx('badge mt-2 capitalize', moodClass)}>{result.mood}</span>
        )}
      </div>
      <MetricCard
        icon={Key}
        label="Key Signature"
        value={result.key_signature}
        sub="Musical key"
        color="text-vanilla-glow"
      />
      <MetricCard
        icon={Clock}
        label="Time Signature"
        value={result.time_signature}
        sub="Rhythmic structure"
        color="text-indigo-depth"
      />
      <MetricCard
        icon={Activity}
        label="Spectral Centroid"
        value={result.spectral_centroid ? Math.round(result.spectral_centroid) : null}
        sub="Brightness (Hz)"
        color="text-orange-400"
      />
    </div>
  );
}

export function YAMNetCard({ result }) {
  const labels = result.yamnet_labels || [];
  const scores = result.confidence_scores || [];

  if (!labels.length) return null;

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className="text-vibrant-orange" />
        <h3 className="font-semibold text-on-surface">Audio Event Classification</h3>
        <span className="badge bg-surface-container-high text-on-surface-variant ml-auto text-xs">YAMNet</span>
      </div>
      <div className="space-y-3">
        {labels.map((label, i) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-on-surface-variant">{label}</span>
              <span className="text-outline font-mono">{scores[i] ? `${Math.round(scores[i] * 100)}%` : ''}</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-vibrant-orange to-indigo-depth rounded-full transition-all duration-700"
                style={{ width: `${(scores[i] || 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
