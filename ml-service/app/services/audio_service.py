import asyncio
import pathlib
import numpy as np
import librosa
import structlog

logger = structlog.get_logger()

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

        # Key and scale
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_idx = int(np.argmax(np.mean(chroma, axis=1)))
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_signature = key_names[key_idx]

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
            "time_signature": time_signature,
            "spectral_centroid": round(spectral_centroid, 4),
            "spectral_rolloff": round(spectral_rolloff, 4),
            "zero_crossing_rate": round(zero_crossing_rate, 6),
            "mfcc_means": mfcc_means,
        }

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
