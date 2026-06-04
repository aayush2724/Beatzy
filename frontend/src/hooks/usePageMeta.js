import { useEffect } from 'react';

export function usePageMeta({ title, description, image }) {
  useEffect(() => {
    const base = 'Beatzy';
    document.title = title ? `${title} · ${base}` : `${base} — Music Intelligence Engine`;

    const setMeta = (name, content, attr = 'name') => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title || base, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    if (image) setMeta('og:image', image, 'property');
  }, [title, description, image]);
}
