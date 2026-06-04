import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from './ui';

const STEPS = [
  { title: 'Upload a track', body: 'Drop any MP3, WAV, or FLAC. We fingerprint and analyze in seconds.' },
  { title: 'Watch the pipeline', body: 'Real-time WebSocket updates show song ID, spectral DNA, and classifiers.' },
  { title: 'Explore results', body: 'BPM, key, chords, lyrics, and shareable public links for your best finds.' },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('beatzy-onboarding-done')) {
      setOpen(true);
    }
  }, []);

  function finish() {
    localStorage.setItem('beatzy-onboarding-done', '1');
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];

  return (
    <Modal open={open} onClose={finish} title={`Welcome · ${step + 1}/${STEPS.length}`}>
      <p className="text-muted text-sm mb-6 leading-relaxed">{current.body}</p>
      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={finish}>Skip</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Link to="/upload" onClick={finish} className="btn-primary px-6 py-2 text-sm inline-flex items-center">
            Upload sample
          </Link>
        )}
      </div>
    </Modal>
  );
}
