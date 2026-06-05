import { useEffect, useRef } from 'react';

// Safe helper to avoid double-brace syntax corruption
const styleD = (d) => ({ '--d': d });

export default function AppBackground() {
  const bgRef = useRef(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--mx', (x * 25).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * 25).toFixed(2) + 'px');
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={bgRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: '#1A1410' }}>
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-white blur-[120px] animate-pulse" style={{ opacity: 0.04, animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gray-400 blur-[150px] animate-pulse" style={{ opacity: 0.03, animationDuration: '12s' }} />
      <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-white blur-[180px] animate-pulse" style={{ opacity: 0.02, animationDuration: '10s' }} />
      
      {/* 3D Parallax Objects */}
      <div className="absolute inset-0" style={{ perspective: '1000px' }}>
        {/* Floating Vinyl */}
        <div className="music-obj vinyl-obj float-a" style={{ ...styleD(0.8), top: '12%', right: '10%' }} />
        
        {/* Floating EQ Box */}
        <div className="music-obj eq-box float-c" style={{ ...styleD(1.2), bottom: '25%', left: '8%' }}>
          <div className="eq-bar" style={{ height: '24px' }} />
          <div className="eq-bar" style={{ height: '48px' }} />
          <div className="eq-bar" style={{ height: '32px' }} />
        </div>
        
        {/* Floating Play Prism */}
        <div className="music-obj play-prism float-b" style={{ ...styleD(0.5), top: '45%', right: '20%' }} />
        
        {/* Additional floating element - second vinyl */}
        <div className="music-obj vinyl-obj float-d" style={{ ...styleD(0.6), bottom: '15%', right: '25%', width: '100px', height: '100px' }} />
      </div>
      
      {/* Dark Vignette so the center content is always readable */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 15%, #1A1410 85%)', opacity: 0.85 }} />
    </div>
  );
}