import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';
import { SongCard, AudioMetricsGrid, YAMNetCard } from '../components/ResultCards';

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
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success('Copied to clipboard!');
  }

  if (loading) return (
    <div className="fixed inset-0 z-[100] bg-primary-container flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none opacity-0" id="loader" style={{ opacity: 1 }}>
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-secondary-fixed/20"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-secondary-fixed animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary-fixed text-4xl pulse-lime">sync</span>
        </div>
      </div>
      <div className="font-label-md text-label-md text-secondary-fixed tracking-widest uppercase">Synchronizing Protocols...</div>
      <div className="mt-4 w-64 h-1 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-secondary-fixed w-full transition-all duration-300" id="loader-progress"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-primary-container text-on-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/upload" className="px-6 py-3 bg-secondary-fixed text-on-secondary font-label-md text-label-md rounded-lg hover:brightness-110 transition-all">
          Try again
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-primary-container min-h-screen text-on-surface overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-glass-border shadow-[0_0_20px_rgba(0,245,255,0.05)] flex justify-between items-center px-8 py-4">
        <div className="font-display-lg text-headline-md tracking-tighter text-neon-cyan">Beatzy AI</div>
        <div className="hidden md:flex gap-8">
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Main Stage</a>
          <a className="font-body-md text-body-md text-neon-cyan border-b-2 border-neon-cyan pb-1 transition-all" href="#">Inside the Wave</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Artist Echoes</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Production Suite</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-neon-cyan transition-colors">account_circle</span>
        </div>
      </nav>

      <aside className="fixed left-0 top-0 h-full w-[280px] z-40 bg-deep-obsidian/90 backdrop-blur-lg border-r border-glass-border pt-24 pb-8 flex flex-col hidden md:flex">
        <div className="px-8 mb-12">
          <div className="font-headline-md text-neon-cyan text-xl">Operator</div>
          <div className="font-label-md text-[10px] text-outline tracking-widest uppercase">v2.4.0-Stable</div>
        </div>
        <div className="flex flex-col gap-2">
          <a className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-all active:translate-x-1" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-3 text-neon-cyan bg-primary-container/10 border-r-4 border-neon-cyan transition-all cursor-pointer" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-label-md text-label-md">Spectral</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-all active:translate-x-1" href="#">
            <span className="material-symbols-outlined">mic_external_on</span>
            <span className="font-label-md text-label-md">Studio</span>
          </a>
          <a className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-all active:translate-x-1" href="#">
            <span className="material-symbols-outlined">library_music</span>
            <span className="font-label-md text-label-md">Library</span>
          </a>
        </div>
      </aside>

      <main className="ml-0 md:ml-[280px] pt-24 pb-12 px-margin-mobile md:px-margin-desktop min-h-screen relative" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg')", backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
        <header className="flex justify-between items-center mb-8">
          <nav className="flex items-center gap-2 text-outline font-label-md text-label-md">
            <Link className="hover:text-secondary-fixed transition-colors" to="/dashboard">Dashboard</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-secondary-fixed">Spectral Intelligence Report</span>
          </nav>
          <div className="flex gap-4">
            <button onClick={copyJson} className="px-6 py-2 border border-outline/30 font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant/20 transition-all active:scale-95">
              Export JSON
            </button>
            <Link to="/upload" className="px-6 py-2 bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md hover:brightness-110 transition-all active:scale-95">
              Download Report
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-gutter">
          <section className="col-span-12 lg:col-span-8 glass-panel neon-border-lime p-8 overflow-hidden relative group">
            <div className="scanline"></div>
            <div className="flex flex-col md:flex-row gap-8 relative z-20">
              <div className="w-full md:w-1/3 aspect-square bg-surface-container-high relative overflow-hidden">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="High-end, cinematic studio portrait of a legendary electronic music artist wearing a sleek, futuristic chrome helmet with neon violet glowing visors. Atmospheric lighting with sonic lime and prism violet rim lights."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjYkaXzIEYzUSc76dvwngXwknw0gNgWZim1K_v49CyyUCeXHIYfJpbjj46lwfnx162HD4Uo3xRDtaWnvohCQ3K708sAnD8W1KfXvoZ1X3BnPyXi0JuyR7rC07eqK5X4tGXnbJr2iYvw4-GMZN4EFFjbTkpSSkw0KMjih0yhSy2t4WeIF2C191K8DHNHZSpMELzvHFAPMNlS5qGI3B2teT68RYmzSvSppQRnAzvYGKAKEwEUOs4jik9WpNil1zqqSl4D3YUBwN6rw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/80 to-transparent"></div>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-secondary-fixed/20 text-secondary-fixed font-label-sm text-label-sm rounded-sm">CONFIRMED MATCH</span>
                    <span className="text-outline font-label-sm text-label-sm">#{result.job_id || jobId}</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-secondary mb-2 tracking-tighter">{result.song_title || 'Digital Resonance'}</h1>
                  <p className="font-headline-lg text-headline-lg text-secondary-fixed/90 opacity-80">{result.song_artist || 'The Synth Architects'}</p>
                </div>
                <div className="mt-8 flex items-end justify-between border-t border-outline/10 pt-6">
                  <div>
                    <div className="text-outline font-label-sm text-label-sm uppercase mb-1">Match Confidence</div>
                    <div className="text-4xl font-headline-xl text-secondary-fixed tracking-tight">{result.confidence ? `${(result.confidence * 100).toFixed(1)}` : '98.4'}<span className="text-lg opacity-50">%</span></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-8 bg-secondary-fixed/10"></div>
                    <div className="w-1.5 h-12 bg-secondary-fixed/30"></div>
                    <div className="w-1.5 h-10 bg-secondary-fixed/50"></div>
                    <div className="w-1.5 h-14 bg-secondary-fixed pulse-lime"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 flex flex-col justify-between hover:border-secondary-fixed/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl pulse-lime">favorite</span>
                <span className="font-label-sm text-label-sm text-outline">BPM</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-headline-lg text-secondary">{result.bpm || '128.0'}</div>
                <div className="text-xs text-outline mt-1 font-label-sm">Steady Rhythm</div>
              </div>
            </div>
            <div className="glass-panel p-6 flex flex-col justify-between hover:border-on-tertiary-container/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-on-tertiary-container text-2xl">music_note</span>
                <span className="font-label-sm text-label-sm text-outline">KEY</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-headline-lg text-secondary">{result.key_signature || 'C# Minor'}</div>
                <div className="text-xs text-outline mt-1 font-label-sm">Melodic Tension</div>
              </div>
            </div>
            <div className="glass-panel p-6 flex flex-col justify-between hover:border-secondary-fixed/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">bolt</span>
                <span className="font-label-sm text-label-sm text-outline">ENERGY</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-headline-lg text-secondary">{result.energy_level ? `${Math.round(result.energy_level * 100)}%` : 'High'}</div>
                <div className="w-full bg-surface-container h-1 mt-2">
                  <div className="bg-secondary-fixed h-full" style={{ width: `${result.energy_level ? result.energy_level * 100 : 85}%` }}></div>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 flex flex-col justify-between hover:border-on-tertiary-container/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-on-tertiary-container text-2xl">mood</span>
                <span className="font-label-sm text-label-sm text-outline">MOOD</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-headline-lg text-secondary capitalize">{result.mood || 'Epic'}</div>
                <div className="text-xs text-outline mt-1 font-label-sm">Cinematic Surge</div>
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-7 glass-panel p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-label-md text-label-md text-secondary tracking-widest uppercase">YAMNet Classifications</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary-fixed"></div>
                  <span className="text-[10px] font-label-sm text-outline uppercase tracking-tighter">Music</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-on-tertiary-container"></div>
                  <span className="text-[10px] font-label-sm text-outline uppercase tracking-tighter">Speech</span>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase">Instrumentation Density</span>
                  <span className="font-label-sm text-label-sm text-secondary-fixed">92%</span>
                </div>
                <div className="h-2 bg-surface-container-high relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary-fixed transition-all duration-1000 group-hover:brightness-125" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase">Percussive transients</span>
                  <span className="font-label-sm text-label-sm text-secondary-fixed">76%</span>
                </div>
                <div className="h-2 bg-surface-container-high relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary-fixed transition-all duration-1000 group-hover:brightness-125" style={{ width: '76%' }}></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase">Vocal presence</span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container">12%</span>
                </div>
                <div className="h-2 bg-surface-container-high relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-on-tertiary-container transition-all duration-1000 group-hover:brightness-125" style={{ width: '12%' }}></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase">Environmental noise</span>
                  <span className="font-label-sm text-label-sm text-outline">04%</span>
                </div>
                <div className="h-2 bg-surface-container-high relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-outline/40 transition-all duration-1000 group-hover:brightness-125" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-12 p-4 bg-surface-dim/40 border-l-2 border-secondary-fixed">
              <p className="font-label-sm text-[12px] text-outline leading-relaxed">
                <span className="text-secondary-fixed font-bold">ANALYSIS SUMMARY:</span> {result.summary || 'High-fidelity studio recording with dominant synthesized elements. Minimal background noise (RMS < -60dB). Transient peak values indicate aggressive sidechain compression.'}
              </p>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-gutter">
            <div className="flex-1 glass-panel p-8 neon-border-violet flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-label-md text-label-md text-secondary tracking-widest uppercase">Raw Protocol JSON</h3>
                <button onClick={copyJson} className="material-symbols-outlined text-on-tertiary-container cursor-pointer hover:rotate-180 transition-transform" type="button">refresh</button>
              </div>
              <div className="flex-1 bg-primary-container p-6 border border-outline/10 font-label-sm text-[12px] leading-6 overflow-auto max-h-[300px]">
                <pre className="text-on-surface-variant">{JSON.stringify(result?.raw_ml_response || result, null, 2)}</pre>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={copyJson} className="text-on-tertiary-container font-label-md text-label-md flex items-center gap-2 hover:underline" type="button">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="ml-[280px] bg-surface-container-lowest border-t border-glass-border w-full py-12 hidden md:block">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center">
          <div className="font-headline-md text-on-surface mb-4 md:mb-0">Beatzy AI</div>
          <div className="flex gap-8 mb-4 md:mb-0">
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Architecture</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Privacy</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">API Documentation</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Terms of Resonance</a>
          </div>
          <div className="font-code-sm text-code-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</div>
        </div>
      </footer>
    </div>
  );
}
