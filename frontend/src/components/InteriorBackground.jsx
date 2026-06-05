import { useEffect, useRef } from 'react';

export default function InteriorBackground() {
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
        el.style.setProperty('--mx', (x * 20).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * 20).toFixed(2) + 'px');
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={bgRef} className="fixed inset-0 z-[-1] bg-[#1A1410] overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#C41E3A] opacity-[0.04] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#A64D3D] opacity-[0.03] blur-[120px]" />
      
      {/* 3D Music Objects with Parallax */}
      <div className="absolute inset-0">
        {/* Floating Vinyl */}
        <div className="music-obj vinyl-obj float-a top-[20%] right-[15%]" style={{ '--d': 0.8 }} />
        
        {/* Floating Play Button */}
        <div className="music-obj play-obj float-c bottom-[25%] left-[10%]" style={{ '--d': 1.2 }} />
        
        {/* Floating EQ Bars */}
        <div className="music-obj eq-group float-b top-[40%] left-[20%]" style={{ '--d': 0.5 }}>
          <div className="eq-bar h-12" />
          <div className="eq-bar h-24" />
          <div className="eq-bar h-16" />
        </div>
      </div>
    </div>
  );
}
