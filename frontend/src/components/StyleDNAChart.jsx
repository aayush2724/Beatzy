import React from 'react';

export default function StyleDNAChart() {
  return (
    <section className="glass-panel rounded-xl p-8 flex flex-col">
      <h3 className="font-label-md text-primary mb-8">Style DNA</h3>
      <div className="flex-1 flex items-center justify-center relative py-4">
        <svg className="w-full max-w-[240px]" viewBox="0 0 200 200">
          {/* Grid circles */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          {/* Axes */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Targeted DNA polygon */}
          <polygon
            points="100,30 160,80 140,150 60,150 40,80"
            fill="rgba(255,255,255,0.08)"
            stroke="#c9c6c5"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Current Analysis polygon */}
          <polygon
            points="100,60 130,100 110,140 90,120 70,90"
            fill="rgba(201,167,255,0.12)"
            stroke="#c9a7ff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute top-0 text-center w-full">
          <span className="font-label-sm text-outline tracking-widest opacity-40 uppercase">Harmonics</span>
        </div>
        <div className="absolute bottom-0 text-center w-full">
          <span className="font-label-sm text-outline tracking-widest opacity-40 uppercase">Rhythm</span>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between font-label-sm">
          <span className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            Targeted DNA
          </span>
          <span className="text-primary">88% Match</span>
        </div>
        <div className="flex items-center justify-between font-label-sm">
          <span className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-tertiary rounded-full" />
            Current Analysis
          </span>
          <span className="text-tertiary opacity-70 uppercase">Unprocessed</span>
        </div>
      </div>
    </section>
  );
}
