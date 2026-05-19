import React, { useEffect, useRef } from 'react';

export default function WaveformVisualizer({ barCount = 52 }) {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const bars = barsRef.current;
    const start = () => {
      const time = Date.now() / 1000;
      bars.forEach((bar, index) => {
        if (!bar) return;
        const ratio = index / barCount;

        const wave1 = Math.sin(index * 0.12 + time * 1.8) * 70;
        const wave2 = Math.sin(index * 0.35 - time * 2.8) * 40;
        const wave3 = Math.cos(time * 1.1 + index * 0.08) * 50;

        const spectralProfile = Math.sin(ratio * Math.PI) * 140;
        const baseHeight = 40 + spectralProfile;
        let finalHeight = baseHeight + wave1 + wave2 + wave3;
        finalHeight = Math.max(16, Math.min(420, finalHeight));
        bar.style.height = `${finalHeight}px`;

        const dynamicOpacity = 0.5 + (Math.sin(time * 1.5 + index * 0.15) * 0.4);
        bar.style.opacity = dynamicOpacity;

        const intensity = (finalHeight / 420) * 0.8;
        const glowColor = ratio < 0.7 ? '195, 244, 0' : '220, 184, 255';
        bar.style.boxShadow = `0 0 ${12 + intensity * 24}px rgba(${glowColor}, ${0.1 + intensity})`;
      });
      rafRef.current = requestAnimationFrame(start);
    };

    rafRef.current = requestAnimationFrame(start);
    return () => cancelAnimationFrame(rafRef.current);
  }, [barCount]);

  return (
    <div className="w-full h-full flex items-end justify-center gap-1 pb-12 px-6" ref={containerRef}>
      {Array.from({ length: barCount }).map((_, i) => {
        const ratio = i / barCount;
        const bg = ratio < 0.7 ? '#c3f400' : '#dcb8ff';
        return (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className="waveform-bar w-2 rounded-t-full shimmer-effect"
            style={{ backgroundColor: bg, height: '80px', opacity: 0.8 }}
          />
        );
      })}
    </div>
  );
}
