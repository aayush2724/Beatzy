/**
 * Animated backdrop for the landing hero: a tilted 3D plane of artist
 * portraits gliding horizontally side to side (no spin), under drifting
 * aurora fields in the brand teal / amber pair. Scoped to
 * its nearest positioned ancestor (the hero section). All motion is CSS,
 * so the global prefers-reduced-motion rule stops it.
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

/* 12×12 plane; the per-row offset keeps neighbouring tiles from repeating. */
const GRID_TILES = Array.from(
  { length: 144 },
  (_, i) => ARTIST_IMAGES[(i + Math.floor(i / 12) * 5) % ARTIST_IMAGES.length],
);

export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="artist-grid-scene absolute inset-0">
        <div className="artist-grid-plane">
          {GRID_TILES.map((src, i) => (
            <div key={i} className="artist-grid-tile">
              <img src={src} alt="" decoding="async" draggable="false" />
            </div>
          ))}
        </div>
      </div>
      <div className="aurora aurora-1 absolute -top-72 left-1/2 h-[42rem] w-[42rem] rounded-full"></div>
      <div className="aurora aurora-2 absolute right-[-14rem] top-[22rem] h-[36rem] w-[36rem] rounded-full"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,var(--canvas)_115%)] opacity-70"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas"></div>
    </div>
  );
}
