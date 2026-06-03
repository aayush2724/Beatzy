import { useEffect, useRef } from 'react';

/*
 * FloatingArtists — drifting artist portrait gallery with mouse parallax.
 * Fixed behind all content, pointer-events: none.
 */

const ARTISTS = [
  { src: '/artists/artist-1.jpg',  cls: 'w-40 h-52 top-[7%]   left-[4%]',       d: 0.5,  float: 'float-a' },
  { src: '/artists/artist-2.webp', cls: 'w-32 h-44 top-[10%]  right-[7%]',       d: 0.9,  float: 'float-c' },
  { src: '/artists/artist-3.jpg',  cls: 'w-44 h-56 top-[38%]  left-[2%]',        d: 0.35, float: 'float-b' },
  { src: '/artists/artist-4.jpg',  cls: 'w-36 h-48 bottom-[7%] left-[15%]',      d: 0.7,  float: 'float-d' },
  { src: '/artists/artist-5.avif', cls: 'w-48 h-60 top-[32%]  right-[4%]',       d: 0.45, float: 'float-a' },
  { src: '/artists/artist-6.jpg',  cls: 'w-32 h-44 bottom-[9%] right-[13%]',     d: 0.85, float: 'float-c' },
  { src: '/artists/artist-7.webp', cls: 'w-28 h-36 top-[60%]  left-[44%]',       d: 1.1,  float: 'float-b' },
  { src: '/artists/artist-8.jpg',  cls: 'w-36 h-48 top-[5%]   left-[60%]',       d: 0.6,  float: 'float-d' },
  { src: '/artists/artist-9.webp', cls: 'w-40 h-52 bottom-[12%] left-[56%]',     d: 0.75, float: 'float-a' },
];

export default function FloatingArtists() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--mx', (x * 18).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * 18).toFixed(2) + 'px');
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="artist-layer" aria-hidden="true">
      {ARTISTS.map((a, i) => {
        const tileStyle = { '--d': a.d };
        return (
          <div key={i} className={`artist-tile ${a.cls}`} style={tileStyle}>
            <div className={`artist-inner ${a.float}`}>
              <img
                src={a.src}
                alt=""
                loading="lazy"
                draggable="false"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
