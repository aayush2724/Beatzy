import HeroWave from './HeroWave';

/**
 * Backdrop for the landing hero, built from still layers:
 *
 *   1. a tilted mosaic of artist portraits — one flat composited layer
 *   2. a hairline grid that fades out towards the edges
 *   3. a waveform ribbon across the mid-band that only moves while the
 *      pointer is over the hero — see HeroWave
 *   4. three soft glows (teal, amber, graphite) and a vignette
 *
 * Nothing here animates on its own; the signal ring is the hero's one
 * self-moving element.
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
      <HeroWave className="absolute inset-x-0 top-[38%] h-[28%] w-full opacity-[0.4]" />

      {/* 4. glows + vignette */}
      <div className="aurora aurora-1 absolute -top-72 left-1/2 h-[42rem] w-[42rem] rounded-full"></div>
      <div className="aurora aurora-2 absolute right-[-14rem] top-[22rem] h-[36rem] w-[36rem] rounded-full"></div>
      <div className="aurora aurora-3 absolute bottom-[-12rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,var(--canvas)_115%)] opacity-70"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas"></div>
    </div>
  );
}
