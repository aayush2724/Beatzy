import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Public routes that belong in the sitemap. Private app routes are listed in robots.txt instead. */
const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/pricing', changefreq: 'monthly', priority: '0.8' },
  { path: '/docs', changefreq: 'monthly', priority: '0.7' },
  { path: '/artist-echoes', changefreq: 'monthly', priority: '0.4' },
  { path: '/status', changefreq: 'daily', priority: '0.4' },
  { path: '/register', changefreq: 'yearly', priority: '0.6' },
  { path: '/login', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

const PRIVATE_PREFIXES = [
  '/dashboard', '/upload', '/history', '/library', '/compare', '/results/',
  '/api-keys', '/profile', '/admin', '/auth/', '/billing/', '/r/',
];

function sitemapXml(siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_ROUTES.map(
    (r) =>
      `  <url><loc>${siteUrl}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robotsTxt(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    ...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

/**
 * Emits robots.txt and sitemap.xml from VITE_SITE_URL (so the domain lives in
 * one place) and fills the `__SITE_URL__` tokens in index.html.
 */
function seoFiles(siteUrl) {
  return {
    name: 'beatzy-seo-files',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain');
          return res.end(robotsTxt(siteUrl));
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml');
          return res.end(sitemapXml(siteUrl));
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Keep in step with the fallback in src/config/site.js.
  const siteUrl = (env.VITE_SITE_URL || 'https://beatzy.app').trim().replace(/\/$/, '');

  return {
    plugins: [react(), seoFiles(siteUrl)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: 'all',
      proxy: {
        // '^/api/' (not '/api') so SPA routes like /api-keys don't get proxied.
        '^/api/': { target: 'http://localhost:3000', changeOrigin: true },
        '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      },
    },
    build: {
      outDir: 'dist',
      // Source maps expose the full source to anyone who fetches them. They are
      // only emitted (unreferenced) when VITE_SOURCEMAP=true, e.g. for a Sentry upload.
      sourcemap: env.VITE_SOURCEMAP === 'true' ? 'hidden' : false,
      rollupOptions: {
        output: {
          // Only the libraries every route needs get a fixed chunk. three.js
          // (1.2 MB, one demo page) and recharts (dashboard/admin) used to be
          // pinned here too, which made shared helpers land in those chunks and
          // the entry preload them on every page, including the landing page.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'vendor-motion';
            return undefined;
          },
        },
      },
    },
  };
});
