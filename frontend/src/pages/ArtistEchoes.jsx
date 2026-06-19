import WaveformVisualizer from '../components/WaveformVisualizer';
import StyleDNAChart from '../components/StyleDNAChart';
import PageWrapper from '../components/PageWrapper';
import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

export default function ArtistEchoes() {
  return (
    <PageWrapper className="space-y-gutter pb-16">
      {/* Page Header */}
      <header className="mb-12 border-b border-[#0D0808]/5 pb-8">
        <h1 className="text-5xl font-headline font-extrabold text-[#FFFFFF] tracking-tighter" style={SG}>Artist Echoes</h1>
        <p className="font-sans text-sm text-on-surface-variant mt-2 max-w-2xl">
          Infuse your production with the stylistic DNA of legendary sound architectures through minimalist spectral synthesis and 3D vector mapping.
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Waveform Visualizer + Control Stats */}
        <section className="md:col-span-8 flex flex-col gap-8">
          {/* Waveform Panel */}
          <div className="glass-panel rounded-xl p-8 relative overflow-hidden h-[460px] flex flex-col border border-glass-border shadow-2xl">
            {/* Cinematic Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            
            <div className="relative z-20 flex justify-between items-start">
              <div>
                <h2 className="font-headline text-xl font-bold text-[#FFFFFF] tracking-tight">Spectral Resonance</h2>
                <div className="flex items-center mt-1 gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">Live Analyser Active</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-widest">Buffer Status</p>
                <p className="font-mono text-[10px] font-bold text-primary">SYNCHRONIZED</p>
              </div>
            </div>

            <div className="flex-grow flex items-end justify-center pb-12 px-6">
              <WaveformVisualizer barCount={40} />
            </div>

            <div className="absolute bottom-8 right-8 flex gap-8 z-20">
              <div className="text-right border-r border-[#0D0808]/10 pr-8">
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Rate</p>
                <p className="font-mono text-xs font-bold text-[#FFFFFF] mt-1">192kHz / 32-bit</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Protocol</p>
                <p className="font-mono text-xs font-bold text-[#FFFFFF] mt-1">v4.2.1-NEURAL</p>
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'AI Match', val: '98.4%', sub: 'Conf', color: 'text-primary' },
                { label: 'Latency', val: '14ms', sub: 'RTT', color: 'text-secondary' },
                { label: 'Timbre', val: 'CRISP', sub: 'Spec', color: 'text-[#FFFFFF]' },
                { label: 'Entropy', val: '0.42', sub: 'Bit', color: 'text-[#FFFFFF]/60' }
            ].map(s => (
                <div key={s.label} className="glass-panel rounded-xl p-5 border border-glass-border hover:border-[#0D0808]/20 transition-all cursor-default group">
                    <p className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-widest mb-2">{s.label}</p>
                    <div className="flex justify-between items-end">
                        <span className={clsx("text-lg font-mono font-bold group-hover:scale-105 transition-transform", s.color)}>{s.val}</span>
                        <span className="text-[10px] font-mono text-[#FFFFFF]/20 uppercase">{s.sub}</span>
                    </div>
                </div>
            ))}
          </div>
        </section>

        {/* Right Column: Sidebar Data Panels */}
        <aside className="md:col-span-4 flex flex-col gap-8">
          {/* Style DNA Chart */}
          <StyleDNAChart />

          {/* Stem Separation */}
          <section className="glass-panel rounded-xl p-6 border border-glass-border">
            <h3 className="font-headline font-bold text-sm text-primary uppercase tracking-widest mb-6">Neural Synthesis</h3>
            <div className="space-y-4">
              {[
                { name: 'Vocals', icon: 'mic', checked: true },
                { name: 'Percussion', icon: 'architecture', checked: true },
                { name: 'Sub-Bass', icon: 'graphic_eq', checked: false },
                { name: 'Atmosphere', icon: 'auto_awesome', checked: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#FFFFFF]/80">{item.name}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Neural Events Feed */}
          <section className="glass-panel rounded-xl border border-glass-border overflow-hidden flex flex-col">
            <div className="p-4 border-b border-glass-border bg-white/[0.01]">
              <h3 className="font-headline font-bold text-xs text-primary uppercase tracking-widest">Telemetry Stream</h3>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto max-h-[160px] scroll-smooth">
              {[
                { time: '01:24:45', text: 'Sibilance peak detected at 6.4kHz.', status: 'aligned' },
                { time: '01:24:52', text: 'Sub-harmonic alignment synchronized.', status: 'active' },
                { time: '01:25:01', text: 'Stereo image expanded to 140%.', status: 'ready' },
              ].map((event, idx) => (
                <div key={idx} className="flex gap-4 items-start border-l border-[#0D0808]/10 pl-4 relative">
                  <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  <div>
                    <p className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-widest">{event.time} · {event.status}</p>
                    <p className="font-sans text-xs text-[#FFFFFF]/80 mt-1 leading-relaxed">{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </PageWrapper>
  );
}
