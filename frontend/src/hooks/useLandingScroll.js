import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function useLandingScroll(refs) {
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    let ctx;
    const id = requestAnimationFrame(() => {
      const {
        heroTitle,
        heroCta,
        statValues = [],
        stepsPin,
        stepPanels = [],
        galleryTrack,
        featureCards,
      } = refs;

      ctx = gsap.context(() => {
        if (heroTitle?.current) {
          const lines = heroTitle.current.querySelectorAll('[data-reveal]');
          gsap.from(lines, {
            y: 48,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.2,
          });
        }

        if (heroCta?.current) {
          gsap.from(heroCta.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.65,
            ease: 'power2.out',
          });
        }

        statValues.forEach((ref, i) => {
          const el = ref?.current;
          if (!el || !el.dataset.value) return;
          const raw = el.dataset.value;
          const numeric = parseFloat(raw);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          if (!Number.isFinite(numeric)) return;

          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.fromTo(
                { val: 0 },
                { val: 0 },
                {
                  val: numeric,
                  duration: 1.4,
                  delay: i * 0.08,
                  ease: 'power2.out',
                  onUpdate(self) {
                    const v = self.targets[0].val;
                    const display = Number.isInteger(numeric) ? Math.round(v) : v.toFixed(1);
                    el.textContent = `${prefix}${display}${suffix}`;
                  },
                },
              );
            },
          });
        });

        if (stepsPin?.current && stepPanels.length) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: stepsPin.current,
              start: 'top top',
              end: `+=${stepPanels.length * 80}%`,
              pin: true,
              scrub: 0.6,
            },
          });

          stepPanels.forEach((panel, i) => {
            if (!panel?.current) return;
            if (i === 0) {
              gsap.set(panel.current, { opacity: 1, y: 0 });
            } else {
              gsap.set(panel.current, { opacity: 0, y: 40 });
              tl.to(panel.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, i);
              if (stepPanels[i - 1]?.current) {
                tl.to(stepPanels[i - 1].current, { opacity: 0, y: -30, duration: 0.4 }, i);
              }
            }
          });
        }

        if (galleryTrack?.current?.parentElement) {
          const track = galleryTrack.current;
          const wrap = track.parentElement?.closest('.demo-gallery-wrap') || track.parentElement;
          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth + 48),
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top top',
              end: () => `+=${Math.max(track.scrollWidth, window.innerWidth)}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        if (featureCards?.current) {
          featureCards.current.querySelectorAll('.feature-tilt').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
              const rect = card.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              gsap.to(card, {
                rotateY: x * 10,
                rotateX: -y * 10,
                duration: 0.3,
                ease: 'power2.out',
                transformPerspective: 800,
              });
            });
            card.addEventListener('mouseleave', () => {
              gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
            });
          });
        }

        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(id);
      ctx?.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [reducedMotion, refs]);
}

export const DEMO_CARDS = [
  { title: 'Blinding Lights', bpm: 171, key: 'F# minor', mood: 'Energetic' },
  { title: 'Stay', bpm: 111, key: 'C major', mood: 'Melancholic' },
  { title: 'Levitating', bpm: 103, key: 'B minor', mood: 'Uplifting' },
  { title: 'Heat Waves', bpm: 80, key: 'F# minor', mood: 'Dreamy' },
  { title: 'As It Was', bpm: 173, key: 'A major', mood: 'Nostalgic' },
];
