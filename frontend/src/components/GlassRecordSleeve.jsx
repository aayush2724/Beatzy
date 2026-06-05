import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function GlassRecordSleeve({ job }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

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
  const title = job.song_title || job.original_filename || 'Unknown Signal';
  const coverUrl = spotifyMeta?.cover_url || '/placeholder-art.jpg';

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
        <div className="absolute inset-0 glass-panel border border-[#1A1410]/10 rounded-xl bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors shadow-2xl" />
        
        {/* Record "Extruding" Effect */}
        <motion.div 
            style={{ translateZ: 20 }}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#0D0A08] border-4 border-[#1A1410]/5 shadow-2xl group-hover:right-[-2rem] transition-all duration-500 flex items-center justify-center overflow-hidden"
        >
            <div className="w-full h-full opacity-40 mix-blend-overlay bg-[repeating-radial-gradient(circle_at_center,#222_0,#222_2px,transparent_2px,transparent_4px)]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
        </motion.div>

        {/* Album Art Cover */}
        <motion.div 
            style={{ translateZ: 40 }}
            className="absolute inset-4 rounded-lg overflow-hidden shadow-2xl border border-[#1A1410]/10"
        >
            <img src={coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            
            {/* Overlay Info */}
            <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[#F5EFE7] font-bold text-sm truncate">{title}</p>
                <p className="text-[#F5EFE7]/60 text-[10px] truncate uppercase tracking-widest">{job.song_artist || 'Neural Source'}</p>
            </div>
            
            {/* BPM Badge */}
            {job.bpm && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-surface rounded font-mono text-[9px] font-bold shadow-lg">
                    {Math.round(job.bpm)}
                </div>
            )}
        </motion.div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute inset-[-100%] group-hover:inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-all duration-1000" />
        </div>
      </Link>
      ) : (
      <div className="block h-full cursor-default opacity-70" title="Analysis in progress">
        {/* Sleeve Background */}
        <div className="absolute inset-0 glass-panel border border-[#1A1410]/10 rounded-xl bg-white/[0.02] transition-colors shadow-2xl" />
        <motion.div style={{ translateZ: 20 }} className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#0D0A08] border-4 border-[#1A1410]/5 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="w-full h-full opacity-40 mix-blend-overlay bg-[repeating-radial-gradient(circle_at_center,#222_0,#222_2px,transparent_2px,transparent_4px)]" />
        </motion.div>
        <motion.div style={{ translateZ: 40 }} className="relative z-10 p-6 h-full flex flex-col justify-between">
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#1A1410]/10 shadow-lg">
                <img src={coverUrl} alt={title} className="w-full h-full object-cover grayscale" />
            </div>
            <div>
                <h3 className="font-headline font-bold text-[#F5EFE7] text-lg truncate">{title}</h3>
                <p className="font-mono text-[9px] text-[#F5EFE7]/40 uppercase tracking-widest mt-1">{job.status}</p>
            </div>
        </motion.div>
      </div>
      )}
    </motion.div>
  );
}
