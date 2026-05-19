import React from 'react';

const METRICS = [
  {
    id: 'timbre',
    title: 'Timbre',
    icon: 'waves',
    status: 'Active',
    statusColor: 'text-secondary-fixed',
    label: 'Spectral Centroid:',
    value: '2.4kHz',
    description: 'Matching harmonic overtones to the selected texture with sub-millisecond precision.',
  },
  {
    id: 'rhythm',
    title: 'Rhythm',
    icon: 'grid_view',
    status: 'Syncing',
    statusColor: 'text-tertiary',
    label: null,
    value: null,
    description: 'Quantizing transient peaks to the signature syncopated patterns for authentic groove.',
  },
  {
    id: 'resonance',
    title: 'Resonance',
    icon: 'auto_awesome',
    status: 'Analyzing',
    statusColor: 'text-outline',
    label: null,
    value: null,
    description: 'Analyzing interval relationships for signature tension and atmospheric depth.',
  },
];

export default function MetricCards() {
  return (
    <>
      {METRICS.map((metric) => (
        <section key={metric.id} className="glass-panel rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="font-label-md text-primary flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] opacity-60">
                {metric.icon}
              </span>
              {metric.title}
            </h4>
            <span className={`font-label-sm border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase ${metric.statusColor}`}>
              {metric.status}
            </span>
          </div>

          {metric.id === 'timbre' && (
            <div className="bg-surface-container-lowest rounded p-6 border border-white/5">
              <p className="font-label-sm text-outline mb-4">
                {metric.label} <span className="text-primary font-semibold">{metric.value}</span>
              </p>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4"></div>
              </div>
            </div>
          )}

          {metric.id === 'rhythm' && (
            <div className="grid grid-cols-4 gap-2.5 h-16">
              <div className="bg-surface-container-high/50 rounded animate-pulse"></div>
              <div className="bg-surface-container-high/20 rounded"></div>
              <div className="bg-tertiary/40 rounded"></div>
              <div className="bg-surface-container-high/10 rounded"></div>
            </div>
          )}

          {metric.id === 'resonance' && (
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-surface-container-lowest border border-white/5 rounded px-5 py-3 font-label-sm text-primary">
                Minor 7th | Dim 5
              </div>
              <span className="material-symbols-outlined text-primary/40 animate-spin text-[18px]">
                sync
              </span>
            </div>
          )}

          <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
            {metric.description}
          </p>
        </section>
      ))}
    </>
  );
}
