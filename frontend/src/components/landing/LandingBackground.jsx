/**
 * Backdrop for the landing hero, built from still layers (nothing animates):
 *
 *   1. a tilted mosaic of artist portraits — one flat composited layer
 *   2. a hairline grid that fades out towards the edges
 *   3. a waveform ribbon across the mid-band, in the brand gradient
 *   4. three soft glows (teal, amber, graphite) and a vignette
 *
 * Every layer is cheap: no filters that re-render, no per-tile 3D, no motion.
 */
const ARTIST_IMAGES = [
  '/artists/artist-1.jpg',
  '/artists/artist-2.webp',
  '/artists/artist-3.jpg',
  '/artists/artist-4.jpg',
  '/artists/artist-5.avif',
  '/artists/artist-6-tile.jpg',
  '/artists/artist-7.webp',
  '/artists/artist-8.jpg',
  '/artists/artist-9.webp',
];

const COLS = 10;
const ROWS = 8;

/* the per-row offset keeps neighbouring tiles from repeating */
const GRID_TILES = Array.from(
  { length: COLS * ROWS },
  (_, i) => ARTIST_IMAGES[(i + Math.floor(i / COLS) * 5) % ARTIST_IMAGES.length],
);

/* A deterministic waveform: two sines and a slow envelope, so it reads as
   audio rather than a random scribble. Computed once at module load. */
const WAVE_PATH = (() => {
  const points = 160;
  const width = 1600;
  const mid = 100;
  const parts = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = t * width;
    const envelope = Math.sin(t * Math.PI) ** 1.5;
    const y = mid + envelope * (Math.sin(t * 46) * 34 + Math.sin(t * 11) * 22);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
})();

export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* 1. mosaic */}
      <div className="artist-grid-scene absolute inset-0">
        <div className="artist-grid-plane">
          {GRID_TILES.map((src, i) => (
            <div key={i} className="artist-grid-tile">
              <img src={src} alt="" decoding="async" loading="lazy" draggable="false" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. hairline grid, strongest in the middle, gone by the edges */}
      <div
        className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black_10%,transparent_100%)]"
        style={{
          backgroundImage:
            'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
          backgroundSize: '5rem 5rem',
          backgroundPosition: 'center',
        }}
      />

      {/* 3. waveform ribbon */}
      <svg
        className="absolute inset-x-0 top-[38%] h-[28%] w-full opacity-[0.28]"
        viewBox="0 0 1600 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hero-wave" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--brand)" stopOpacity="0" />
            <stop offset="0.3" stopColor="var(--brand)" stopOpacity="0.9" />
            <stop offset="0.7" stopColor="var(--accent-warm)" stopOpacity="0.8" />
            <stop offset="1" stopColor="var(--accent-warm)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={WAVE_PATH} fill="none" stroke="url(#hero-wave)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={WAVE_PATH} fill="none" stroke="url(#hero-wave)" strokeWidth="6" vectorEffect="non-scaling-stroke" opacity="0.18" />
      </svg>

      {/* 4. glows + vignette */}
      <div className="aurora aurora-1 absolute -top-72 left-1/2 h-[42rem] w-[42rem] rounded-full"></div>
      <div className="aurora aurora-2 absolute right-[-14rem] top-[22rem] h-[36rem] w-[36rem] rounded-full"></div>
      <div className="aurora aurora-3 absolute bottom-[-12rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,var(--canvas)_115%)] opacity-70"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas"></div>
    </div>
  );
}
