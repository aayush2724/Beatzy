import { Music2, Zap, Heart, Clock, Key, Activity, Tag } from 'lucide-react';
import clsx from 'clsx';

const MOOD_COLORS = {
  energetic: 'text-orange-400 bg-orange-400/10',
  happy: 'text-yellow-400 bg-yellow-400/10',
  sad: 'text-blue-400 bg-blue-400/10',
  calm: 'text-green-400 bg-green-400/10',
  excited: 'text-pink-400 bg-pink-400/10',
  melancholic: 'text-purple-400 bg-purple-400/10',
  neutral: 'text-gray-400 bg-gray-400/10',
};

function MetricCard({ icon: Icon, label, value, sub, color = 'text-brand-400' }) {
  return (
    <div className="card hover:border-dark-500 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function SongCard({ result }) {
  return (
    <div className="card border-brand-600/30 bg-gradient-to-br from-brand-600/10 to-dark-800">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-brand-600/20 rounded-xl flex items-center justify-center shrink-0">
          <Music2 size={32} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">
            {result.song_title || 'Unknown Track'}
          </h2>
          <p className="text-gray-400 text-lg truncate">
            {result.song_artist || 'Unknown Artist'}
          </p>
          {result.song_album && (
            <p className="text-gray-500 text-sm mt-1 truncate">{result.song_album}</p>
          )}
          {result.isrc && (
            <p className="text-xs text-gray-600 font-mono mt-2">ISRC: {result.isrc}</p>
          )}
        </div>
        {result.song_release_year && (
          <span className="badge bg-dark-700 text-gray-300 shrink-0">{result.song_release_year}</span>
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
        color="text-yellow-400"
      />
      <div className="card hover:border-dark-500 transition-colors">
        <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center mb-3">
          <Heart size={20} className="text-pink-400" />
        </div>
        <p className="text-2xl font-bold mb-1 capitalize">{result.mood || '—'}</p>
        <p className="text-sm font-medium text-gray-300">Mood</p>
        {result.mood && (
          <span className={clsx('badge mt-2 capitalize', moodClass)}>{result.mood}</span>
        )}
      </div>
      <MetricCard
        icon={Key}
        label="Key Signature"
        value={result.key_signature}
        sub="Musical key"
        color="text-purple-400"
      />
      <MetricCard
        icon={Clock}
        label="Time Signature"
        value={result.time_signature}
        sub="Rhythmic structure"
        color="text-blue-400"
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
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className="text-brand-400" />
        <h3 className="font-semibold">Audio Event Classification</h3>
        <span className="badge bg-dark-700 text-gray-400 ml-auto text-xs">YAMNet</span>
      </div>
      <div className="space-y-3">
        {labels.map((label, i) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">{label}</span>
              <span className="text-gray-500 font-mono">{scores[i] ? `${Math.round(scores[i] * 100)}%` : ''}</span>
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-700"
                style={{ width: `${(scores[i] || 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
