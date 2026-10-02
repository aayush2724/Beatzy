import { useEffect } from 'react';
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_NAME, SITE_URL } from '../config/site';

/**
 * Per-route document metadata for a client-rendered app: title, description,
 * canonical URL, Open Graph and Twitter cards, and an optional noindex.
 *
 * Every routed page calls this. Pages behind sign-in pass `noindex: true`;
 * crawlers never see them anyway, but if a link leaks the robots meta keeps
 * them out of the index.
 */
function upsertMeta(attr, name, content) {
  const selector = `meta[${attr}="${name}"]`;
  let el = document.head.querySelector(selector);
  if (content == null || content === '') {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyPageMeta({ title, description, image, path, noindex = false, type = 'website' } = {}) {
  if (typeof document === 'undefined') return;
  const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const pathname = path ?? window.location.pathname;
  const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
  const img = image || DEFAULT_OG_IMAGE;

  document.title = fullTitle;
  upsertMeta('name', 'description', desc);
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertLink('canonical', noindex ? null : url);

  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', img);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', fullTitle);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', img);
}

export function usePageMeta(options = {}) {
  const { title, description, image, path, noindex, type } = options;
  useEffect(() => {
    applyPageMeta({ title, description, image, path, noindex, type });
  }, [title, description, image, path, noindex, type]);
}
