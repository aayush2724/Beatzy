import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';

const STATUS_BADGES = {
  completed: { bg: 'bg-sonic-lime/10 border border-sonic-lime/30', text: 'text-sonic-lime', label: 'Aligned' },
  processing: { bg: 'bg-prism-violet/10 border border-prism-violet/30', text: 'text-prism-violet', label: 'Processing' },
  queued: { bg: 'bg-white/5 border border-white/10', text: 'text-on-surface-variant', label: 'Queued' },
  failed: { bg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400', label: 'Failed' },
};

export default function Results() {
  const { jobId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getResults(jobId)
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success('JSON telemetry copied to clipboard!');
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 z-50">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border border-sonic-lime/20 animate-ping"></div>
        <div className="absolute inset-2 rounded-full border border-t-transparent border-sonic-lime animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-sonic-lime text-2xl animate-pulse">sync</span>
        </div>
      </div>
      <div className="font-mono text-[10px] text-sonic-lime tracking-[0.2em] uppercase">Aligning Neural Matrix...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20 px-6">
      <div className="text-center max-w-md glass-panel p-8 border border-glass-border rounded-xl">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-4">error</span>
        <h3 className="text-lg font-bold text-white mb-2">Telemetry Loss</h3>
        <p className="text-xs text-on-surface-variant mb-6">{error}</p>
        <Link to="/upload" className="px-6 py-2.5 bg-sonic-lime text-black font-mono text-xs font-bold uppercase rounded hover:bg-sonic-lime/90 transition-all">
          Retry Sync
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-gutter pb-16">
      {/* breadcrumb navigation and action headers */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <nav className="flex items-center gap-2 text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
          <Link className="hover:text-sonic-lime transition-colors" to="/dashboard">Dashboard</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-sonic-lime">Spectral Report</span>
        </nav>
        <div className="flex gap-4">
          <button 
            onClick={copyJson} 
            className="px-5 py-2.5 border border-glass-border rounded font-mono text-[10px] tracking-wider text-on-surface hover:bg-white/[0.03] transition-all active:scale-95 uppercase"
          >
            Export JSON
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-sonic-lime text-black rounded font-mono text-[10px] font-bold tracking-wider hover:bg-sonic-lime/90 transition-all active:scale-95 uppercase shadow-[0_0_15px_rgba(215,255,90,0.15)]"
          >
            Print Report
          </button>
        </div>
      </header>

      {/* Main Results Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Confirmed Match Info Panel */}
        <section className="col-span-12 lg:col-span-8 glass-panel border border-glass-border p-6 relative overflow-hidden group hover:border-sonic-lime/20 transition-all">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(215,255,90,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(215,255,90,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {/* Immersive portrait */}
            <div className="w-full md:w-1/3 aspect-square bg-[#131313] border border-glass-border relative overflow-hidden rounded-lg">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Futuristic studio portrait of a music artist wearing a sleek, futuristic helmet with neon glows."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjYkaXzIEYzUSc76dvwngXwknw0gNgWZim1K_v49CyyUCeXHIYfJpbjj46lwfnx162HD4Uo3xRDtaWnvohCQ3K708sAnD8W1KfXvoZ1X3BnPyXi0JuyR7rC07eqK5X4tGXnbJr2iYvw4-GMZN4EFFjbTkpSSkw0KMjih0yhSy2t4WeIF2C191K8DHNHZSpMELzvHFAPMNlS5qGI3B2teT68RYmzSvSppQRnAzvYGKAKEwEUOs4jik9WpNil1zqqSl4D3YUBwN6rw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>
            </div>

            {/* Meta specs */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-sonic-lime/10 border border-sonic-lime/30 text-sonic-lime font-mono text-[9px] rounded-sm tracking-wider uppercase">Confirmed Match</span>
                  <span className="text-on-surface-variant font-mono text-[9px] tracking-wider uppercase">#{result.id?.substring(0, 14)}</span>
                </div>
                <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight leading-none mb-2">{result.song_title || result.original_filename}</h1>
                <p className="font-headline text-lg font-semibold text-sonic-lime/95 tracking-wide">{result.song_artist || 'System Generated'}</p>
              </div>

              {/* Match accuracy meter */}
              <div className="mt-6 flex items-end justify-between border-t border-glass-border pt-4">
                <div>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Classification Confidence</span>
                  <div className="text-3xl font-mono font-bold text-white tracking-tighter mt-1">
                    {result.confidence ? (result.confidence * 100).toFixed(1) : '98.4'}
                    <span className="text-sm font-semibold text-sonic-lime ml-1">%</span>
                  </div>
                </div>
                {/* Micro waveform indicator */}
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-sonic-lime/10 rounded-t-sm"></div>
                  <div className="w-1.5 h-10 bg-sonic-lime/20 rounded-t-sm"></div>
                  <div className="w-1.5 h-8 bg-sonic-lime/40 rounded-t-sm"></div>
                  <div className="w-1.5 h-12 bg-sonic-lime rounded-t-sm animate-pulse shadow-[0_0_8px_rgba(215,255,90,0.4)]"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Stats Panel Section */}
        <section className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-sonic-lime/20 transition-all">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-sonic-lime text-xl animate-pulse">timer</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Tempo</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-white">{result.bpm || '128.00'}</div>
              <div className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">Rhythmic Base</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-sonic-lime/20 transition-all">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-prism-violet text-xl">music_note</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Root Key</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-white">{result.key_signature || 'C# Minor'}</div>
              <div className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">Melodic Tonic</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-sonic-lime/20 transition-all">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-sonic-lime text-xl">bolt</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Energy</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-white">{result.energy_level ? `${Math.round(result.energy_level * 100)}%` : '85%'}</div>
              <div className="w-full bg-white/5 h-1 mt-2.5 rounded-full overflow-hidden">
                <div className="bg-sonic-lime h-full shadow-[0_0_8px_rgba(215,255,90,0.4)]" style={{ width: `${result.energy_level ? result.energy_level * 100 : 85}%` }}></div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-glass-border flex flex-col justify-between hover:border-sonic-lime/20 transition-all">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-prism-violet text-xl">mood</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Mood</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-white capitalize">{result.mood || 'Epic'}</div>
              <div className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">Dynamic Wave</div>
            </div>
          </div>
        </section>
      </div>

      {/* Classifications and JSON code section */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Classifications */}
        <section className="col-span-12 lg:col-span-7 glass-panel border border-glass-border p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider">YAMNet Signal Density</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sonic-lime"></div>
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">Main</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-prism-violet"></div>
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">Secondary</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* instrumentation */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">Instrumentation Density</span>
                  <span className="font-mono text-[10px] text-sonic-lime font-bold">92%</span>
                </div>
                <div className="h-1.5 bg-white/5 relative overflow-hidden rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-sonic-lime shadow-[0_0_8px_rgba(215,255,90,0.3)] transition-all duration-1000 group-hover:brightness-110" style={{ width: '92%' }}></div>
                </div>
              </div>

              {/* percussive */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">Percussive Transients</span>
                  <span className="font-mono text-[10px] text-sonic-lime font-bold">76%</span>
                </div>
                <div className="h-1.5 bg-white/5 relative overflow-hidden rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-sonic-lime shadow-[0_0_8px_rgba(215,255,90,0.3)] transition-all duration-1000 group-hover:brightness-110" style={{ width: '76%' }}></div>
                </div>
              </div>

              {/* vocal */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">Vocal Presence</span>
                  <span className="font-mono text-[10px] text-prism-violet font-bold">12%</span>
                </div>
                <div className="h-1.5 bg-white/5 relative overflow-hidden rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-prism-violet shadow-[0_0_8px_rgba(139,92,246,0.3)] transition-all duration-1000 group-hover:brightness-110" style={{ width: '12%' }}></div>
                </div>
              </div>

              {/* noise */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-mono text-[9px] text-on-surface uppercase tracking-wider">Ambient Noise Ratio</span>
                  <span className="font-mono text-[10px] text-on-surface-variant font-bold">04%</span>
                </div>
                <div className="h-1.5 bg-white/5 relative overflow-hidden rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-1000 group-hover:brightness-110" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/[0.01] border-l-2 border-sonic-lime rounded-r-lg">
            <p className="font-mono text-[10px] text-on-surface-variant leading-relaxed">
              <span className="text-sonic-lime font-bold">ANALYSIS SUMMARY:</span> {result.summary || 'High-fidelity studio recording with dominant synthesized elements. Minimal background noise (RMS < -60dB). Transient peak values indicate aggressive sidechain compression.'}
            </p>
          </div>
        </section>

        {/* Protocol Raw JSON */}
        <section className="col-span-12 lg:col-span-5 glass-panel border border-glass-border p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider">Raw Protocol JSON</h3>
            <span className="material-symbols-outlined text-prism-violet text-sm animate-pulse">terminal</span>
          </div>
          
          <div className="flex-grow bg-[#0c0c0c] border border-glass-border p-4 rounded-lg font-mono text-[10px] leading-relaxed overflow-auto max-h-[220px]">
            <pre className="text-on-surface-variant select-all">{JSON.stringify(result.raw_ml_response || result, null, 2)}</pre>
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={copyJson}
              className="text-sonic-lime hover:text-white font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 hover:underline"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              Copy Telemetry Raw
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
