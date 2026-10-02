/**
 * Site-wide facts that marketing, legal and SEO code read from one place.
 *
 * Anything marked PLACEHOLDER could not be verified from the codebase and
 * must be confirmed before launch. Set the matching VITE_* variable in
 * Vercel (Project → Settings → Environment Variables) rather than editing
 * this file, so staging and production can differ.
 */
const env = import.meta.env;

const trim = (v) => (typeof v === 'string' ? v.trim().replace(/\/$/, '') : '');

/** Public origin of the deployed frontend. Used for canonical URLs, Open Graph and the sitemap. */
export const SITE_URL = trim(env.VITE_SITE_URL) || 'https://beatzy.app'; // PLACEHOLDER until VITE_SITE_URL is set

export const SITE_NAME = 'Beatzy';
export const DEFAULT_TITLE = 'Beatzy — Music Intelligence Engine';
export const DEFAULT_DESCRIPTION =
  'Identify any song and read its tempo, key, chords, mood and lyrics. Upload a file, record a snippet or search the catalog, with a REST API to match.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/** PLACEHOLDER — the mailbox that answers support and legal questions. */
export const CONTACT_EMAIL = trim(env.VITE_CONTACT_EMAIL) || 'hello@beatzy.app';
/** PLACEHOLDER — the mailbox for privacy and data requests (defaults to CONTACT_EMAIL). */
export const PRIVACY_EMAIL = trim(env.VITE_PRIVACY_EMAIL) || CONTACT_EMAIL;
/** PLACEHOLDER — the legal name of the operator shown in the terms and privacy policy. */
export const LEGAL_ENTITY = trim(env.VITE_LEGAL_ENTITY) || 'Beatzy';

/** True while the contact details above are still the unverified defaults. */
export const CONTACT_IS_PLACEHOLDER = !trim(env.VITE_CONTACT_EMAIL);

/** Date shown on the legal pages. Update it whenever their text changes. */
export const LEGAL_UPDATED = '2 October 2026';

/** Plan limits mirrored from backend/src/middleware/rateLimit.js — keep in sync. */
export const PLAN_LIMITS = {
  free: { analysesPerMonth: 100, requestsPerDay: 500, uploadSizeMB: 50, batchSize: 5, apiKeys: 0 },
  pro: { analysesPerMonth: 1000, requestsPerDay: 10000, uploadSizeMB: 100, batchSize: 20, apiKeys: 5 },
  enterprise: { analysesPerMonth: Infinity, requestsPerDay: Infinity, uploadSizeMB: 500, batchSize: 50, apiKeys: 20 },
};

export function uploadLimitMB(plan) {
  return (PLAN_LIMITS[plan] || PLAN_LIMITS.free).uploadSizeMB;
}
