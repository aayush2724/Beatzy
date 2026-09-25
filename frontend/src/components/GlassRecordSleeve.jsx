import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import placeholderArt from '../assets/placeholder-art.svg';
import { Badge } from './ui';

const STATUS_BADGE = {
  failed: ['danger', 'Failed'],
  queued: ['neutral', 'Queued'],
  processing: ['brand', 'Analyzing…'],
};

// Mic captures are uploaded as `live-capture.<ext>`; never show that as a title.
function displayTitle(job) {
  if (job.song_title) return job.song_title;
  const name = job.original_filename || '';
  if (/^live-capture\./i.test(name) || /^recording-/i.test(name)) return 'Live recording';
  return name.replace(/\.[a-z0-9]+$/i, '') || 'Untitled track';
}

export default function GlassRecordSleeve({ job }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // A hint of depth, not a card that swings around under the cursor.
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const spotifyMeta = job.spotify_features ? (typeof job.spotify_features === 'string' ? JSON.parse(job.spotify_features) : job.spotify_features) : null;
  const title = displayTitle(job);
  const coverUrl = spotifyMeta?.cover_url || placeholderArt;
  const [badgeTone, badgeLabel] = STATUS_BADGE[job.status] || ['neutral', job.status];

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative group h-64 w-full"
    >
      {job.status === 'completed' ? (
      <Link to={`/results/${job.id}`} className="block h-full">
        {/* Sleeve Background */}
        <div className="absolute inset-0 glass-panel border border-line rounded-xl bg-ink/[0.02] group-hover:bg-ink/[0.05] transition-colors shadow-2xl" />
        
        {/* Record "Extruding" Effect */}
        <motion.div 
            style={{ translateZ: 20 }}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-canvas border-4 border-line-subtle shadow-2xl group-hover:right-[-2rem] transition-all duration-500 flex items-center justify-center overflow-hidden"
        >
            <div className="w-full h-full opacity-40 mix-blend-overlay bg-[repeating-radial-gradient(circle_at_center,var(--raised)_0,var(--raised)_2px,transparent_2px,transparent_4px)]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink/10 to-transparent" />
        </motion.div>

        {/* Album Art Cover */}
        <motion.div 
            style={{ translateZ: 40 }}
            className="absolute inset-4 rounded-lg overflow-hidden shadow-2xl border border-line"
        >
            <img src={coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-transparent to-transparent opacity-60" />
            
            {/* Overlay Info */}
            <div className="absolute bottom-3 left-3 right-3">
                <p className="text-ink font-bold text-sm truncate">{title}</p>
                <p className="text-ink/70 text-xs truncate">{job.song_artist || 'Unknown artist'}</p>
            </div>

            {/* BPM */}
            {job.bpm && (
                <div className="absolute top-3 right-3 rounded-md border border-line bg-surface/90 px-2 py-1 text-[0.6875rem] font-medium tabular-nums text-ink backdrop-blur">
                    {Math.round(job.bpm)} <span className="text-ink-muted">BPM</span>
                </div>
            )}
        </motion.div>
      </Link>
      ) : (
      <div className="block h-full cursor-default" title={job.status === 'failed' ? (job.error_message || 'Analysis failed') : 'Analysis in progress'}>
        {/* Sleeve Background */}
        <div className="absolute inset-0 glass-panel border border-line rounded-xl bg-ink/[0.02] transition-colors shadow-2xl" />
        <motion.div style={{ translateZ: 20 }} className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-canvas border-4 border-line-subtle shadow-2xl flex items-center justify-center overflow-hidden opacity-60">
            <div className="w-full h-full opacity-40 mix-blend-overlay bg-[repeating-radial-gradient(circle_at_center,var(--raised)_0,var(--raised)_2px,transparent_2px,transparent_4px)]" />
        </motion.div>
        <motion.div style={{ translateZ: 40 }} className="relative z-10 p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-line shadow-lg opacity-70">
                  <img src={coverUrl} alt="" className="w-full h-full object-cover grayscale" />
              </div>
              <Badge variant={badgeTone} dot>{badgeLabel}</Badge>
            </div>
            <div className="min-w-0">
                <h3 className="font-display font-semibold text-ink text-base truncate">{title}</h3>
                <p className="text-xs text-ink-muted truncate mt-0.5">
                  {job.status === 'failed' ? (job.error_message || 'Analysis failed') : 'Results will appear here when analysis finishes'}
                </p>
            </div>
        </motion.div>
      </div>
      )}
    </motion.div>
  );
}
