import asyncio
import pathlib
import numpy as np
import librosa
import structlog

logger = structlog.get_logger()

KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

# ── Model loading (singleton) ────────────────────────────────────────────────

_MODEL_PATH = pathlib.Path(__file__).resolve().parent.parent.parent / "models" / "mood_classifier.joblib"
_mood_model = None


def _load_mood_model():
    """Lazily load the trained mood classifier (once per process)."""
    global _mood_model
    if _mood_model is not None:
        return _mood_model

    if not _MODEL_PATH.exists():
        logger.warning("Mood model not found, falling back to rule‑based inference", path=str(_MODEL_PATH))
        return None

    try:
        import joblib
        _mood_model = joblib.load(_MODEL_PATH)
        logger.info("Mood model loaded", path=str(_MODEL_PATH))
        return _mood_model
    except Exception as e:
        logger.error("Failed to load mood model", error=str(e))
        return None


class AudioAnalysisService:
    async def analyze(self, audio_path: str) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._analyze_sync, audio_path)

    def _analyze_sync(self, audio_path: str) -> dict:
        logger.info("Loading audio file", path=audio_path)
        y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=60)

        # BPM / Tempo
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(round(tempo, 2))

        # Energy
        rms = librosa.feature.rms(y=y)[0]
        energy_level = float(round(np.mean(rms), 4))

        # Spectral features
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        spectral_rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))
        zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))

        # MFCCs (13 coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = [float(round(m, 4)) for m in np.mean(mfccs, axis=1)]

        # Key, scale, and chord extraction
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_idx = int(np.argmax(np.mean(chroma, axis=1)))
        key_signature = KEY_NAMES[key_idx]
        scale = self._estimate_scale(chroma)
        chord_timeline = self._extract_chords(y, sr)

        # Time signature (simplified)
        time_signature = "4/4"

        # Mood inference — ML model with rule‑based fallback
        mood, mood_confidence = self._predict_mood(
            bpm, energy_level, spectral_centroid, zero_crossing_rate, mfcc_means,
        )

        return {
            "bpm": bpm,
            "energy_level": energy_level,
            "mood": mood,
            "mood_confidence": mood_confidence,
            "key_signature": key_signature,
            "scale": scale,
            "chord_timeline": chord_timeline,
            "time_signature": time_signature,
            "spectral_centroid": round(spectral_centroid, 4),
            "spectral_rolloff": round(spectral_rolloff, 4),
            "zero_crossing_rate": round(zero_crossing_rate, 6),
            "mfcc_means": mfcc_means,
        }

    def _extract_chords(self, y, sr) -> list[dict]:
        """Extract a timeline of chords using a chromagram."""
        try:
            # Generate Chromagram
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            
            # Simple chord dictionary mapping (Major and Minor triads)
            chord_templates = {
                'C': [1,0,0,0,1,0,0,1,0,0,0,0], 'Cmin': [1,0,0,1,0,0,0,1,0,0,0,0],
                'C#': [0,1,0,0,0,1,0,0,1,0,0,0], 'C#min': [0,1,0,0,1,0,0,0,1,0,0,0],
                'D': [0,0,1,0,0,0,1,0,0,1,0,0], 'Dmin': [0,0,1,0,0,1,0,0,0,1,0,0],
                'D#': [0,0,0,1,0,0,0,1,0,0,1,0], 'D#min': [0,0,0,1,0,0,1,0,0,0,1,0],
                'E': [0,0,0,0,1,0,0,0,1,0,0,1], 'Emin': [0,0,0,0,1,0,0,1,0,0,0,1],
                'F': [1,0,0,0,0,1,0,0,0,1,0,0], 'Fmin': [1,0,0,0,0,1,0,0,1,0,0,0],
                'F#': [0,1,0,0,0,0,1,0,0,0,1,0], 'F#min': [0,1,0,0,0,0,1,0,0,1,0,0],
                'G': [0,0,1,0,0,0,0,1,0,0,0,1], 'Gmin': [0,0,1,0,0,0,0,1,0,0,1,0],
                'G#': [1,0,0,1,0,0,0,0,1,0,0,0], 'G#min': [0,0,0,1,0,0,0,0,1,0,0,1],
                'A': [0,1,0,0,1,0,0,0,0,1,0,0], 'Amin': [1,0,0,0,1,0,0,0,0,1,0,0],
                'A#': [0,0,1,0,0,1,0,0,0,0,1,0], 'A#min': [0,1,0,0,0,1,0,0,0,0,1,0],
                'B': [0,0,0,1,0,0,1,0,0,0,0,1], 'Bmin': [0,0,1,0,0,0,1,0,0,0,0,1]
            }
            
            chord_names = list(chord_templates.keys())
            templates = np.array(list(chord_templates.values())).T
            
            # Correlate chromagram with chord templates
            chord_scores = np.dot(templates.T, chroma)
            best_chords_idx = np.argmax(chord_scores, axis=0)
            
            # Group into segments
            frames_per_sec = sr / 512 # librosa default hop length
            segments = []
            current_chord = chord_names[best_chords_idx[0]]
            start_time = 0.0
            
            for i, idx in enumerate(best_chords_idx):
                chord = chord_names[idx]
                if chord != current_chord:
                    end_time = i / frames_per_sec
                    if end_time - start_time > 1.5: # only keep stable chords > 1.5s
                        segments.append({
                            "chord": current_chord,
                            "start": round(start_time, 1),
                            "end": round(end_time, 1)
                        })
                    current_chord = chord
                    start_time = end_time
            
            return segments
        except Exception as e:
            logger.error("Chord extraction failed", error=str(e))
            return []

    # ── ML‑based mood prediction ─────────────────────────────────────────────

    def _predict_mood(
        self, bpm: float, energy: float, centroid: float, zcr: float, mfccs: list,
    ) -> tuple[str, float]:
        """Return (mood_label, confidence).  Uses trained model when available."""
        model_data = _load_mood_model()

        if model_data is not None:
            try:
                clf = model_data["model"]
                features = np.array([[bpm, energy, centroid, zcr, *mfccs]])
                proba = clf.predict_proba(features)[0]
                idx = int(np.argmax(proba))
                label = clf.classes_[idx]
                confidence = float(round(proba[idx], 4))
                logger.debug("ML mood prediction", mood=label, confidence=confidence)
                return label, confidence
            except Exception as e:
                logger.warning("ML prediction failed, falling back to rules", error=str(e))

        # Fallback: original rule‑based heuristic
        return self._infer_mood_rules(bpm, energy, centroid, mfccs), 0.0

    def _infer_mood_rules(self, bpm: float, energy: float, centroid: float, mfccs: list) -> str:
        """Legacy rule‑based mood inference (kept as fallback)."""
        if bpm > 140 and energy > 0.08:
            return "energetic"
        elif bpm > 120 and energy > 0.05:
            return "happy"
        elif bpm < 80 and energy < 0.03:
            return "sad"
        elif bpm < 90 and energy < 0.05:
            return "calm"
        elif bpm > 100 and energy > 0.06:
            return "excited"
        elif energy < 0.04:
            return "melancholic"
        else:
            return "neutral"

    def _estimate_scale(self, chroma: np.ndarray) -> str:
        """Estimate major/minor scale from average chroma using Krumhansl profiles."""
        # Use CENS for more robust scale estimation
        cens = librosa.feature.chroma_cens(C=chroma)
        profile = np.mean(cens, axis=1)
        
        if np.max(profile) > 0:
            profile = profile / np.max(profile)

        best_score = float("-inf")
        best_key = 0
        best_mode = "Major"

        for key_idx in range(12):
            major_score = float(np.corrcoef(profile, np.roll(MAJOR_PROFILE, key_idx))[0, 1])
            minor_score = float(np.corrcoef(profile, np.roll(MINOR_PROFILE, key_idx))[0, 1])
            if major_score > best_score:
                best_score = major_score
                best_key = key_idx
                best_mode = "Major"
            if minor_score > best_score:
                best_score = minor_score
                best_key = key_idx
                best_mode = "Minor"

        return f"{KEY_NAMES[best_key]} {best_mode}"
