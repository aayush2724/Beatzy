import React from 'react';
import WaveformVisualizer from '../components/WaveformVisualizer';
import ArchetypeSelector from '../components/ArchetypeSelector';
import StyleDNAChart from '../components/StyleDNAChart';
import MetricCards from '../components/MetricCards';
import Navbar from '../components/Navbar';

export default function ArtistEchoes() {
  return (
    <div className="min-h-screen w-full bg-background pt-20 pb-16 px-6 md:px-margin-desktop">
      <Navbar />
      {/* Page Header */}
      <div className="max-w-container-max mx-auto mb-12">
        <h1 className="font-headline-xl text-primary mb-4">Artist Echoes</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl">
          Infuse your production with the stylistic DNA of legendary sound architectures through minimalist spectral synthesis.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Waveform Visualizer + Control Stats */}
        <section className="md:col-span-8 flex flex-col gap-6">
          {/* Waveform Panel */}
          <div className="glass-panel rounded-xl p-8 relative overflow-hidden h-[500px] flex flex-col">
            <div className="absolute top-6 left-8 z-20">
              <h2 className="font-headline-lg text-headline-lg text-secondary-fixed">Inside the Wave</h2>
              <div className="flex items-center mt-2 gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Real-time Spectral Extraction
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-center pb-12 px-6">
              <WaveformVisualizer />
            </div>

            <div className="absolute bottom-6 right-8 flex gap-6">
              <div className="text-right">
                <p className="font-label-sm text-[10px] text-outline uppercase">Sample Rate</p>
                <p className="font-label-md text-on-surface">192 kHz / 32-bit</p>
              </div>
              <div className="text-right">
                <p className="font-label-sm text-[10px] text-outline uppercase">Engine Status</p>
                <p className="font-label-md text-tertiary">Neural Core V4</p>
              </div>
            </div>
          </div>

          {/* Bottom Control Bar - 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-outline-variant/10">
              <p className="font-label-sm text-[10px] text-outline uppercase mb-2">AI Confidence</p>
              <div className="flex items-end justify-between">
                <span className="font-label-md text-headline-lg text-secondary-fixed">98.4%</span>
                <div className="w-16 h-1 bg-surface-variant rounded-full overflow-hidden mb-2">
                  <div className="bg-secondary-fixed h-full w-[98.4%]"></div>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-outline-variant/10">
              <p className="font-label-sm text-[10px] text-outline uppercase mb-2">BPM</p>
              <div className="flex items-end justify-between">
                <span className="font-label-md text-headline-lg text-tertiary">128.0</span>
                <span className="material-symbols-outlined text-tertiary text-sm mb-2">timer</span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-outline-variant/10">
              <p className="font-label-sm text-[10px] text-outline uppercase mb-2">Key Detection</p>
              <div className="flex items-end justify-between">
                <span className="font-label-md text-headline-lg text-on-surface">F# Minor</span>
                <span className="material-symbols-outlined text-on-surface text-sm mb-2">music_note</span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 flex flex-col justify-center border border-outline-variant/10">
              <p className="font-label-sm text-[10px] text-outline uppercase mb-2">Timbre</p>
              <div className="flex items-end justify-between">
                <span className="font-label-md text-headline-lg text-on-surface">Crisp</span>
                <span className="material-symbols-outlined text-outline text-sm mb-2">waves</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Sidebar Data Panels */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          {/* Stem Separation */}
          <section className="glass-panel rounded-xl p-6 border border-outline-variant/10">
            <h3 className="font-headline-lg text-on-surface mb-6 text-lg">Stem Separation</h3>
            <div className="space-y-4">
              {[
                { name: 'Vocals', icon: 'mic', checked: true },
                { name: 'Drums', icon: 'architecture', checked: true },
                { name: 'Bass', icon: 'graphic_eq', checked: false },
                { name: 'Other', icon: 'category', checked: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed">{item.icon}</span>
                    <span className="font-label-md text-on-surface-variant">{item.name}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-fixed"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Neural Events Feed */}
          <section className="glass-panel rounded-xl flex-grow border border-outline-variant/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant/10">
              <h3 className="font-headline-lg text-on-surface text-lg">Neural Events</h3>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto max-h-[300px]">
              {[
                { time: '01:24:45', text: 'Sibilance peak detected at 6.4kHz.', color: 'bg-tertiary' },
                { time: '01:24:52', text: 'Sub-harmonic alignment synchronized.', color: 'bg-secondary-fixed' },
                { time: '01:25:01', text: 'Stereo image expanded to 140%.', color: 'bg-on-surface' },
              ].map((event, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full ${event.color} mt-1.5`}></div>
                  <div>
                    <p className="font-label-sm text-[11px] text-outline">{event.time}</p>
                    <p className="font-label-md text-sm text-on-surface-variant">{event.text}</p>
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
      <div className="max-w-container-max mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCards />
      </div>

      {/* Secondary CTA Section */}
      <section className="max-w-container-max mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-lg p-8 flex items-center gap-6 group hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/10">
          <img
            alt="Console"
            className="w-20 h-20 rounded object-cover border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf0XsMOopIp-qynUKg6htG9bCFbQaWdI9_hPMux8ZeMi4UxPfDRsCln4G-WCAOp_2xyhr-rguQL2p1L9tqqjsi_pDCFClGgDqNDq8fP3jIDG7fts4ExkD9_V2wMJCvhqDash7Z4ajnA9zh0xSKgEOOM9qbCyvJ4oCEJRkvf7t8QKMrBga46zTVpj2T4-LUkqfJy_0L2AzH_g0taySjLmYaSxeQz30425fy1VafbAJUAOO6a2NFg0gnodp2yui1wP--0h_zWSbPSQ"
          />
          <div>
            <h4 className="font-label-md text-primary">Precision Tuning</h4>
            <p className="font-body-md text-on-surface-variant text-sm mt-1">Adjust frequency-specific depth via manual override.</p>
          </div>
        </div>
        <div className="glass-panel rounded-lg p-8 flex items-center gap-6 group hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/10">
          <img
            alt="Flow"
            className="w-20 h-20 rounded object-cover border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWUyVS8QzfsyB7S8wndB8djiYjgqGXfD22GLNMVBsKUT3E9FXB5pV_JQBwGlK_4YCaZEFuST5tosvNo3exY6KLiHM9C8VdSTCBxtZO_kC2bnq6CTind1-dQPl_w9o1GLXpqnudbNZ2tWQ-4n45A3Aj3QAmfzuTx4SS3IrkXO0ajhtD49qJiIr0aJltaEc-QeNm7Z_Vi4xbU7QMCKS__qZ1Ygke4_5f9sZ07xMas_JVBNusNPxjPAw4NQXg7j-l7S3QVuXO-G1TJw"
          />
          <div>
            <h4 className="font-label-md text-primary">Spectral Mapping</h4>
            <p className="font-body-md text-on-surface-variant text-sm mt-1">Review the heat map of style overlap across projects.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
