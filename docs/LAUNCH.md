# Launch checklist

This file tracks what the 2026-10-02 production-readiness pass could not settle
from the code alone. Items marked **REQUIRED** block a public launch.

## Information only the operator can provide

| Setting | Where | Status |
| --- | --- | --- |
| `VITE_SITE_URL` (real public domain) | Vercel env | **REQUIRED**. Falls back to the placeholder `https://beatzy.app`, which is used for canonical URLs, Open Graph, `robots.txt` and `sitemap.xml`. |
| `VITE_CONTACT_EMAIL` | Vercel env | **REQUIRED**. Shown in the footer and on the legal pages. It falls back to the unverified `hello@beatzy.app`. |
| `VITE_PRIVACY_EMAIL` | Vercel env | Optional. Defaults to the contact email. |
| `VITE_LEGAL_ENTITY` | Vercel env | **REQUIRED**. The legal name of whoever operates the service (person or company). |
| Refund policy text | `frontend/src/pages/Terms.jsx`, the "Refunds" section | **REQUIRED**. The section shows a visible placeholder until you write it. |
| `ML_SERVICE_TOKEN` | Render (backend) **and** Hugging Face Space secrets (same value) | **REQUIRED**. Without it the public ML host accepts analysis jobs from anyone. Generate one with `openssl rand -hex 32`. |
| `FRONTEND_URL` | Render | Must equal the real frontend origin, because CORS, the OAuth redirects and the share links depend on it. |
| `VITE_PLAUSIBLE_DOMAIN` / `VITE_SENTRY_DSN` | Vercel env | Optional. Nothing loads unless they are set, and the privacy page updates itself to match. |

## Needs a human decision or professional review

- **Hero mosaic images** (`frontend/public/artists/`). These are photos of real
  artists, including press photos and album art. The repo records no source or
  licence for them. Replace them with licensed or original artwork, or get the
  rights, before a public launch.
- **Demo page artist names** (`StyleDNAChart.jsx`). The demo names real artists
  on sample data. Consider neutral sample labels.
- **Legal pages.** The privacy policy and terms describe what the code actually
  does. Nobody has confirmed they satisfy GDPR, UK GDPR, CCPA/CPRA, India's
  DPDP Act or consumer law for subscriptions in your users' countries. Have a
  qualified lawyer review them, especially the refund wording, data-subject
  rights, international transfers (Render/Vercel/HF are US-hosted), and
  whether a DPA is needed with each processor.
- **Account deletion** is handled manually by email. The privacy policy says
  so. A self-serve delete endpoint would be better.
- **Lyrics.** Results store and display full lyrics from LRCLIB and similar
  sources. Displaying full lyrics can need a licence (for example via LyricFind
  or Musixmatch). Get legal advice before relying on it commercially.
- **Shazam identification** uses an unofficial endpoint (`shazamio-core`).
  Check its terms before commercial use, or set `SHAZAM_ENABLED=false`.
- **Seeded admin account.** Earlier notes flag that an old
  `admin@beatzy.app` / `password123` account may exist in the production
  database. Check it and remove it.

## Known technical risks left open

- Auth tokens live in `sessionStorage`, so any XSS could read them. Moving to
  httpOnly cookies needs backend changes plus CSRF protection.
- Most backend endpoints beyond auth and API keys have no schema validation (zod).
  They use parameterised SQL, so this is a robustness gap, not an injection hole.
- The SPA returns HTTP 200 for unknown URLs. The 404 page sets `noindex`, but
  crawlers see a soft 404. Fixing this needs server-side routing or prerendering.
- Pages are client-rendered. `index.html` carries default metadata and a
  `<noscript>` summary, but per-route titles and descriptions only appear after
  JavaScript runs. Google renders JS. Most social scrapers do not, so every
  shared link previews with the default card. Prerendering the public routes
  would fix both.
- `three.js` (about 350 kB gzipped) still loads on `/artist-echoes`. Only that
  page uses it.
- **Every new account is created on the Pro plan** (`UserModel.createUser` and
  `createGoogleUser` insert `plan = 'pro'`, and migration 011 upgrades existing
  users). If that is a launch promotion, fine. If not, Pro limits and API keys
  are free for everyone. Confirm it is intended.
