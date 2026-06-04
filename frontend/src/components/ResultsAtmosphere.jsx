import { lazy, Suspense } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const Scene = lazy(() => import('./ResultsAtmosphereScene'));

export default function ResultsAtmosphere({ bpm }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20">
      <Suspense fallback={null}>
        <Scene bpm={bpm} />
      </Suspense>
    </div>
  );
}
