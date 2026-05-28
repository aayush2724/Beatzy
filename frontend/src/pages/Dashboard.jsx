import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../api/audio';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const STATUS_BADGES = {
  completed: { bg: 'bg-sonic-lime/10 border border-sonic-lime/30', text: 'text-sonic-lime', label: 'Aligned' },
  processing: { bg: 'bg-prism-violet/10 border border-prism-violet/30', text: 'text-prism-violet', label: 'Processing' },
  queued: { bg: 'bg-white/5 border border-white/10', text: 'text-on-surface-variant', label: 'Queued' },
  failed: { bg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400', label: 'Failed' },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saturation, setSaturation] = useState(72);
  const [activeStemVocals, setActiveStemVocals] = useState(true);
  const [activeStemPercussion, setActiveStemPercussion] = useState(true);
  const [activeStemLowFreq, setActiveStemLowFreq] = useState(false);
  const [activeStemAtmosphere, setActiveStemAtmosphere] = useState(false);

  const visualizerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Fetch recent history
  useEffect(() => {
    getHistory(1, 8).then(({ data }) => {
      setHistory(data.data.jobs);
      setTotal(data.data.pagination.total);
    }).catch(err => {
      console.error("Failed to load telemetry metrics", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Complex multi-dimensional audio visualization animation
  useEffect(() => {
    const container = visualizerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const barCount = 48;
    const bars = [];

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar w-[5px] rounded-t-full transition-all duration-75';
      const ratio = i / barCount;
      bar.style.backgroundColor = ratio < 0.70 ? '#D7FF5A' : '#8B5CF6';
      container.appendChild(bar);
      bars.push(bar);
    }

    let time = 0;
    const animate = () => {
      time += 0.05;
      bars.forEach((bar, index) => {
        const ratio = index / barCount;
        
        // Multi-layered sine calculations representing sound frequencies
        const subBassNoise = Math.sin(index * 0.15 + time * 2.2) * 60;
        const vocalMidNoise = Math.sin(index * 0.4 - time * 3.4) * 35;
        const synthHighNoise = Math.sin(time * 1.5 + index * 0.09) * 45;
        
        // Profiles matching actual spectral density
        const subEmphasis = Math.pow(1 - ratio, 4) * 220;
        const presenceProfile = Math.sin(ratio * Math.PI * 1.4) * 55;

        const baseline = 30 + subEmphasis + presenceProfile;
        let finalHeight = baseline + subBassNoise + vocalMidNoise + synthHighNoise;
        
        // Bound checks
        finalHeight = Math.max(10, Math.min(320, finalHeight));
        bar.style.height = `${finalHeight}px`;

        // Render glow matching the colors
        const opacity = 0.5 + (Math.sin(time * 4 + index * 0.2) * 0.35);
        bar.style.opacity = opacity.toString();
        
        const glowRadius = (finalHeight / 320) * 15;
        const glowColor = ratio < 0.70 ? '215, 255, 90' : '139, 92, 246';
        bar.style.boxShadow = `0 0 ${glowRadius}px rgba(${glowColor}, 0.25)`;
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-gutter pb-16">
      {/* Upper Dashboard Meta Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Spectral Operator</h1>
          <p className="font-sans text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            Welcome, operator {user?.name?.split(' ')[0]}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
            <span className="font-mono text-[9px] text-sonic-lime/75 uppercase tracking-[0.1em]">Resonance Active</span>
          </p>
        </div>
        <Link 
          to="/upload" 
          className="px-6 py-3 bg-sonic-lime text-black rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-sonic-lime/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(215,255,90,0.2)] flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">waves</span>
          Analyze Waveform
        </Link>
      </header>

      {/* Main Grid: Visualizer Core + Stem Matrix */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Core Audio Visualizer */}
        <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl border border-glass-border p-6 flex flex-col justify-between h-[420px] relative overflow-hidden group hover:border-sonic-lime/20 transition-all">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(215,255,90,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(215,255,90,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          <div className="z-10 flex justify-between items-start">
            <div>
              <h2 className="font-headline text-lg font-bold text-sonic-lime tracking-tight">Spectral Resonance</h2>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">Multi-dimensional real-time projection</span>
            </div>
            <div className="font-mono text-[10px] text-on-surface-variant text-right">
              <p>PRECISION PROFILE</p>
              <p className="text-white font-bold">192kHz / 32-bit</p>
            </div>
          </div>

          {/* Dynamic Waveform Graph Container */}
          <div 
            ref={visualizerRef} 
            className="w-full h-56 flex items-end justify-center gap-[4px] px-4 pb-2 z-10"
            id="visualizer-container"
          />

          <div className="z-10 flex justify-between items-center border-t border-glass-border pt-4">
            <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Telemetry aligned successfully</span>
            <div className="flex gap-4">
              <span className="font-mono text-[9px] text-sonic-lime uppercase tracking-widest">Core Status: Stable</span>
            </div>
          </div>
        </section>

        {/* Sidebar Controls: Stem Matrix Separation */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          {/* Stem Separation checklist */}
          <section className="glass-panel rounded-xl p-6 border border-glass-border flex flex-col justify-between flex-grow">
            <div>
              <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider mb-5">Stem Multi-Track</h3>
              <div className="space-y-4">
                {/* Stem Vocals */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-sonic-lime text-base">mic</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Vocals</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeStemVocals}
                      onChange={() => setActiveStemVocals(p => !p)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
                  </label>
                </div>

                {/* Stem Percussion */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-sonic-lime text-base">architecture</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Percussion</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeStemPercussion}
                      onChange={() => setActiveStemPercussion(p => !p)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
                  </label>
                </div>

                {/* Stem Bass */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-sonic-lime text-base">graphic_eq</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Low Frequency</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeStemLowFreq}
                      onChange={() => setActiveStemLowFreq(p => !p)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
                  </label>
                </div>

                {/* Stem Atmosphere */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-sonic-lime text-base">auto_awesome</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Atmosphere</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeStemAtmosphere}
                      onChange={() => setActiveStemAtmosphere(p => !p)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Live Feed Status */}
            <div className="border-t border-glass-border pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Multi-Track Synthesis</span>
                <span className="text-[10px] text-sonic-lime font-mono">ACTIVE</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Control Dial Knobs & Telemetry Logs */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Statistics Panels (4 Grid column layout) */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-center hover:border-sonic-lime/20 transition-all">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Separation Ratio</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-xl font-bold text-sonic-lime">98.4%</span>
              <span className="text-[10px] text-on-surface-variant">Conf</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-center hover:border-sonic-lime/20 transition-all">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Global Tempo</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-xl font-bold text-prism-violet">128.00</span>
              <span className="text-[10px] text-on-surface-variant">BPM</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-center hover:border-sonic-lime/20 transition-all">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Resonating Key</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-xl font-bold text-white">F# Minor</span>
              <span className="text-[10px] text-sonic-lime font-mono">🔑</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-center hover:border-sonic-lime/20 transition-all">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Total Signals</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-on-surface-variant">Tracks</span>
            </div>
          </div>
        </div>

        {/* Saturation SVG dial */}
        <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl border border-glass-border p-6 flex flex-col items-center justify-between">
          <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.15em] uppercase mb-4 self-start">Neural Saturation</p>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Precision ring */}
            <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
              <circle cx="64" cy="64" fill="transparent" r="56" stroke="rgba(255,255,255,0.03)" strokeWidth="5"></circle>
              <circle 
                className="transition-all duration-300"
                cx="64" 
                cy="64" 
                fill="transparent" 
                r="56" 
                stroke="#D7FF5A" 
                strokeDasharray="351.8" 
                strokeDashoffset={351.8 - (351.8 * saturation) / 100} 
                strokeWidth="5"
                strokeLinecap="round"
              ></circle>
            </svg>
            <div 
              onClick={() => setSaturation(prev => (prev >= 100 ? 10 : prev + 10))}
              className="w-24 h-24 rounded-full glass-panel shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] border border-glass-border flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-all select-none active:scale-95"
            >
              <span className="font-mono text-2xl font-bold text-sonic-lime">{saturation}%</span>
              <span className="font-mono text-[8px] tracking-[0.1em] text-on-surface-variant uppercase mt-0.5">DRIVE</span>
            </div>
          </div>

          <span className="font-mono text-[9px] text-on-surface-variant uppercase mt-3 tracking-widest text-center">Interactive saturation throttle</span>
        </section>
      </div>

      {/* Recent Analysis Database Table */}
      <div className="glass-panel rounded-xl border border-glass-border overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/[0.01]">
          <div>
            <h3 className="font-headline font-bold text-white text-base">Telemetry History</h3>
            <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">Registered signal archives</span>
          </div>
          <Link to="/upload" className="text-xs font-mono tracking-wider text-sonic-lime hover:underline uppercase flex items-center gap-1">
            New Extraction <span className="text-[14px]">→</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-glass-border font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Filename / ID</th>
                <th className="px-6 py-3.5">Registered Artist</th>
                <th className="px-6 py-3.5">Core Alignment</th>
                <th className="px-6 py-3.5 text-right">Data Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" className="px-6 py-5">
                      <div className="h-6 bg-white/[0.02] rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-35">folder_open</span>
                    <p className="font-mono text-xs uppercase tracking-widest">No wave separation logs detected.</p>
                  </td>
                </tr>
              ) : (
                history.map((job) => (
                  <tr key={job.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded bg-sonic-lime/10 flex items-center justify-center text-sonic-lime border border-sonic-lime/20">
                        <span className="material-symbols-outlined text-base">music_note</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={job.status === 'completed' ? `/results/${job.id}` : '#'} className="hover:text-sonic-lime transition-all">
                        <p className="font-sans text-xs font-semibold text-white truncate max-w-xs">{job.song_title || job.original_filename}</p>
                        <p className="font-mono text-[9px] text-on-surface-variant mt-0.5 uppercase tracking-tighter">ID: {job.id?.substring(0, 12)}-CORE</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                      {job.song_artist || 'System Synthesizer'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider', STATUS_BADGES[job.status]?.bg, STATUS_BADGES[job.status]?.text)}>
                        {STATUS_BADGES[job.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-sonic-lime font-bold">
                      {job.bpm ? `${Math.floor(job.bpm)} BPM` : '-- BPM'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
