import WaveformVisualizer from '../components/WaveformVisualizer';
import ArchetypeSelector from '../components/ArchetypeSelector';
import StyleDNAChart from '../components/StyleDNAChart';
import MetricCards from '../components/MetricCards';

export default function ArtistEchoes() {
  return (
    <div className="space-y-gutter pb-16">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Artist Echoes</h1>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Infuse your production with the stylistic DNA of legendary sound architectures through minimalist spectral synthesis.
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left Column: Waveform Visualizer + Control Stats */}
        <section className="md:col-span-8 flex flex-col gap-gutter">
          {/* Waveform Panel */}
          <div className="glass-panel rounded-xl p-8 relative overflow-hidden h-[460px] flex flex-col border border-glass-border">
            {/* Cinematic Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,46,151,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,46,151,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
            
            <div className="relative z-20">
              <h2 className="font-headline text-lg font-bold text-white tracking-tight">Inside the Wave</h2>
              <div className="flex items-center mt-1.5 gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse shadow-[0_0_8px_rgba(255,46,151,0.5)]"></span>
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
                  Real-time Spectral Extraction
                </span>
              </div>
            </div>

            <div className="flex-grow flex items-end justify-center pb-12 px-6">
              <WaveformVisualizer />
            </div>

            <div className="absolute bottom-6 right-8 flex gap-6 z-20">
              <div className="text-right">
                <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">Sample Rate</p>
                <p className="font-mono text-xs font-semibold text-white mt-0.5">192 kHz / 32-bit</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">Engine Status</p>
                <p className="font-mono text-xs font-bold text-sonic-lime mt-0.5">Neural Core V4</p>
              </div>
            </div>
          </div>

          {/* Bottom Control Bar - 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-glass-border">
              <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mb-1.5">AI Confidence</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-sonic-lime">98.4%</span>
                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden shrink-0 ml-2">
                  <div className="bg-sonic-lime h-full w-[98.4%] shadow-[0_0_6px_rgba(255,46,151,0.4)]"></div>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-glass-border">
              <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mb-1.5">BPM</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-white">128.0</span>
                <span className="material-symbols-outlined text-sonic-lime text-base">timer</span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-glass-border">
              <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mb-1.5">Key Signature</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-white">F# Minor</span>
                <span className="material-symbols-outlined text-prism-violet text-base">music_note</span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-glass-border">
              <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mb-1.5">Timbre Spec</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-white">Crisp</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base">waves</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Sidebar Data Panels */}
        <aside className="md:col-span-4 flex flex-col gap-gutter">
          {/* Stem Separation */}
          <section className="glass-panel rounded-xl p-5 border border-glass-border">
            <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider mb-5">Stem Separation</h3>
            <div className="space-y-4">
              {[
                { name: 'Vocals', icon: 'mic', checked: true },
                { name: 'Drums', icon: 'architecture', checked: true },
                { name: 'Bass', icon: 'graphic_eq', checked: false },
                { name: 'Other', icon: 'category', checked: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sonic-lime text-base">{item.icon}</span>
                    <span className="font-sans text-xs font-semibold text-white/90">{item.name}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Neural Events Feed */}
          <section className="glass-panel rounded-xl border border-glass-border overflow-hidden flex flex-col">
            <div className="p-4 border-b border-glass-border bg-white/[0.01]">
              <h3 className="font-headline font-bold text-xs text-sonic-lime uppercase tracking-wider">Neural Telemetry Feed</h3>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[180px]">
              {[
                { time: '01:24:45', text: 'Sibilance peak detected at 6.4kHz.', color: 'bg-prism-violet' },
                { time: '01:24:52', text: 'Sub-harmonic alignment synchronized.', color: 'bg-sonic-lime' },
                { time: '01:25:01', text: 'Stereo image expanded to 140%.', color: 'bg-white' },
              ].map((event, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full ${event.color} mt-1.5 shrink-0`}></div>
                  <div>
                    <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">{event.time}</p>
                    <p className="font-sans text-xs text-white/80 mt-0.5 leading-snug">{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Style DNA Chart */}
          <StyleDNAChart />
        </aside>
      </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <MetricCards />
      </div>

      {/* Secondary CTA Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="glass-panel rounded-lg p-6 flex items-center gap-6 group hover:bg-white/[0.01] transition-all cursor-pointer border border-glass-border">
          <div className="w-16 h-16 rounded bg-sonic-lime/10 border border-sonic-lime/20 flex items-center justify-center shrink-0 group-hover:bg-sonic-lime/15 transition-all">
            <span className="material-symbols-outlined text-sonic-lime text-2xl">tune</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-xs text-sonic-lime uppercase tracking-wider">Precision Tuning</h4>
            <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">Adjust frequency-specific depth via manual override.</p>
          </div>
        </div>
        <div className="glass-panel rounded-lg p-6 flex items-center gap-6 group hover:bg-white/[0.01] transition-all cursor-pointer border border-glass-border">
          <div className="w-16 h-16 rounded bg-prism-violet/10 border border-prism-violet/20 flex items-center justify-center shrink-0 group-hover:bg-prism-violet/15 transition-all">
            <span className="material-symbols-outlined text-prism-violet text-2xl">dashboard</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-xs text-sonic-lime uppercase tracking-wider">Spectral Mapping</h4>
            <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">Review the heat map of style overlap across projects.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
