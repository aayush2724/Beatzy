import asyncio
import numpy as np
import scipy.signal
import structlog

# librosa 0.10.x still calls scipy.signal.hann, removed in SciPy 1.13. main.py
# patches this at startup, but anything importing this module directly (tests,
# scripts, workers) would crash inside beat_track. Patch it here too, before
# librosa is imported, so the module is safe on its own.
if not hasattr(scipy.signal, "hann"):
    import scipy.signal.windows as _windows

    scipy.signal.hann = _windows.hann

import librosa  # noqa: E402  (must follow the scipy shim above)

logger = structlog.get_logger()

KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


class AudioAnalysisService:
    async def analyze(self, audio_path: str) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._analyze_sync, audio_path)

    def _analyze_sync(self, audio_path: str) -> dict:
        logger.info("Loading audio file", path=audio_path)
        try:
            y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=60)
        except Exception as e:
            logger.error("Failed to load audio file", path=audio_path, error=str(e))
            raise ValueError(f"Could not read audio file: {str(e)}")

        if len(y) < 1024:
            raise ValueError("Audio file too short for analysis")

        # Split once and reuse. Drums smear the chromagram badly enough to push
        # key detection onto the dominant or subdominant — measured against
        # known-key tracks, estimating from the raw mix got 1/5 right and every
        # error was a perfect-fifth confusion. Estimating from the harmonic
        # component instead got 3/5. Tempo likewise reads better off the
        # percussive part, where the onsets actually live.
        try:
            y_harmonic, y_percussive = librosa.effects.hpss(y)
        except Exception as e:
            logger.warning("HPSS failed, falling back to the raw mix", error=str(e))
            y_harmonic, y_percussive = y, y

        # BPM / Tempo — from the percussive component
        tempo, beat_frames = librosa.beat.beat_track(y=y_percussive, sr=sr)
        bpm = float(round(self._fold_tempo(float(tempo)), 2))

        # Energy (RMS-based)
        rms = librosa.feature.rms(y=y)[0]
        energy_level = float(round(np.mean(rms), 4))

        # Spectral features
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        spectral_rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))
        spectral_bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)))
        zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))

        # Spectral contrast (perceptual frequency differences)
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        spectral_contrast_mean = float(np.mean(spectral_contrast))

        # MFCCs (13 coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = [float(round(m, 4)) for m in np.mean(mfccs, axis=1)]

        # Tonnetz (harmonic content) for valence proxy
        tonnetz = librosa.feature.tonnetz(y=y_harmonic, sr=sr)
        tonnetz_mean = float(np.mean(tonnetz))

        # Key, scale, and chord extraction — all from the harmonic component
        chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr)
        key_idx, mode = self._estimate_key(chroma)
        key_signature = KEY_NAMES[key_idx]
        scale = f"{key_signature} {mode}"
        chord_timeline = self._extract_chords(y_harmonic, sr, chroma=chroma)

        # Time signature (simplified)
        time_signature = "4/4"

        # Mood inference — robust rule-based heuristic using weighted features
        mood, mood_confidence = self._predict_mood(
            bpm, energy_level, spectral_centroid, spectral_rolloff,
            zero_crossing_rate, mfcc_means, spectral_contrast_mean, tonnetz_mean,
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
            "spectral_bandwidth": round(spectral_bandwidth, 4),
            "zero_crossing_rate": round(zero_crossing_rate, 6),
            "mfcc_means": mfcc_means,
            "tonnetz_mean": round(tonnetz_mean, 4),
        }

    def _extract_chords(self, y, sr, chroma=None) -> list[dict]:
        """Extract a timeline of chords using a chromagram."""
        try:
            # Reuse the caller's chromagram when given — computing chroma_cqt
            # twice over the same audio was pure duplicated work.
            if chroma is None:
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

            # Frame-wise argmax flickers between neighbouring chords. Smooth it
            # before segmenting, otherwise real chords get chopped into slivers
            # that the minimum-duration filter then throws away.
            best_chords_idx = self._smooth_labels(best_chords_idx, width=9)

            frames_per_sec = sr / 512  # librosa default hop length

            # Contiguous runs of the same label
            runs = []
            start = 0
            for i in range(1, len(best_chords_idx) + 1):
                if i == len(best_chords_idx) or best_chords_idx[i] != best_chords_idx[start]:
                    runs.append((best_chords_idx[start], start, i))
                    start = i

            # Absorb runs shorter than the minimum into whichever neighbour is
            # longer. The previous version dropped them and advanced the clock
            # anyway, which lost time and emitted the same chord twice in a row.
            min_frames = int(0.5 * frames_per_sec)
            merged = []
            for label, a, b in runs:
                if b - a < min_frames and merged:
                    merged[-1] = (merged[-1][0], merged[-1][1], b)
                else:
                    merged.append((label, a, b))

            # Coalesce anything left adjacent and identical
            coalesced = []
            for label, a, b in merged:
                if coalesced and coalesced[-1][0] == label:
                    coalesced[-1] = (label, coalesced[-1][1], b)
                else:
                    coalesced.append((label, a, b))

            return [
                {
                    "chord": chord_names[label],
                    "start": round(a / frames_per_sec, 1),
                    "end": round(b / frames_per_sec, 1),
                }
                for label, a, b in coalesced
                if b - a >= min_frames
            ]
        except Exception as e:
            logger.error("Chord extraction failed", error=str(e))
            return []

    @staticmethod
    def _fold_tempo(bpm: float) -> float:
        """Fold octave errors into the range popular music actually occupies.

        Beat trackers routinely lock onto double or half the pulse a listener
        taps. Anything above 180 or below 70 is far more likely to be an octave
        error than a real tempo, so halve or double it back into range.
        """
        if not np.isfinite(bpm) or bpm <= 0:
            return 0.0
        while bpm > 180.0:
            bpm /= 2.0
        while bpm < 70.0:
            bpm *= 2.0
        return bpm

    @staticmethod
    def _smooth_labels(labels: np.ndarray, width: int = 9) -> np.ndarray:
        """Majority-vote smoothing over a sequence of frame labels."""
        if width < 2 or len(labels) < width:
            return labels
        half = width // 2
        padded = np.pad(labels, half, mode="edge")
        out = np.empty_like(labels)
        for i in range(len(labels)):
            window = padded[i:i + width]
            values, counts = np.unique(window, return_counts=True)
            out[i] = values[np.argmax(counts)]
        return out

    def _predict_mood(
        self,
        bpm: float,
        energy: float,
        centroid: float,
        rolloff: float,
        zcr: float,
        mfccs: list,
        spectral_contrast: float,
        tonnetz_mean: float,
    ) -> tuple[str, float]:
        """Return (mood_label, confidence) using a weighted rule-based heuristic.

        We combine multiple perceptual features into valence/arousal axes, then map
        to discrete mood labels. Confidence is derived from the strength of the
        dominant axis signal relative to a calibrated band.
        """
        mood, confidence = self._infer_mood_weighted(
            bpm=bpm,
            energy=energy,
            centroid=centroid,
            rolloff=rolloff,
            zcr=zcr,
            mfccs=mfccs,
            spectral_contrast=spectral_contrast,
            tonnetz_mean=tonnetz_mean,
        )
        return mood, confidence

    def _infer_mood_weighted(
        self,
        bpm: float,
        energy: float,
        centroid: float,
        rolloff: float,
        zcr: float,
        mfccs: list,
        spectral_contrast: float,
        tonnetz_mean: float,
    ) -> tuple[str, float]:
        """Weighted feature scoring for arousal, valence, and tension."""
        norm_bpm = min(max((bpm - 60.0) / 160.0, 0.0), 1.0)
        norm_energy = min(max(energy * 8.0, 0.0), 1.0)
        norm_centroid = min(max((centroid - 500.0) / 6000.0, 0.0), 1.0)
        norm_rolloff = min(max((rolloff - 1000.0) / 10000.0, 0.0), 1.0)
        norm_zcr = min(max(zcr * 40.0, 0.0), 1.0)
        norm_spectral_contrast = min(max(spectral_contrast / 30.0, 0.0), 1.0)
        mfcc_brightness = min(max(np.mean(mfccs[:3]) / 15.0 + 0.15, 0.0), 1.0)
        norm_tonnetz = min(max((tonnetz_mean + 0.4) / 0.8, 0.0), 1.0)

        arousal = 0.35 * norm_bpm + 0.40 * norm_energy + 0.15 * norm_centroid + 0.10 * norm_zcr
        valence = (
            0.35 * (1.0 - norm_rolloff)
            + 0.25 * norm_tonnetz
            + 0.20 * mfcc_brightness
            + 0.20 * norm_spectral_contrast
        )

        return self._classify_mood(arousal, valence)

    def _classify_mood(self, arousal: float, valence: float) -> tuple[str, float]:
        if arousal >= 0.65 and valence >= 0.65:
            mood = "happy"
        elif arousal >= 0.65 and valence < 0.35:
            mood = "angry"
        elif arousal >= 0.60 and 0.35 <= valence < 0.55:
            mood = "excited"
        elif arousal < 0.35 and valence >= 0.55:
            mood = "calm"
        elif arousal < 0.35 and valence < 0.35:
            mood = "sad"
        elif 0.35 <= arousal < 0.60 and valence < 0.40:
            mood = "melancholic"
        elif arousal < 0.45 and valence >= 0.45:
            mood = "serene"
        elif arousal >= 0.50 and valence >= 0.55:
            mood = "energetic"
        elif arousal <= 0.30 and valence <= 0.30:
            mood = "depressed"
        else:
            mood = "neutral"

        confidence = float(round(min(abs(arousal - 0.5), abs(valence - 0.5)) * 2.0, 4))
        confidence = max(confidence, 0.25)
        return mood, confidence

    def _estimate_key(self, chroma: np.ndarray) -> tuple[int, str]:
        """Estimate (tonic index, "Major"/"Minor") by correlating the average
        chroma against the Krumhansl-Schmuckler key profiles.

        The profiles are written for C, so rolling a profile by `key_idx`
        transposes it to that tonic.
        """
        profile = np.mean(chroma, axis=1)
        if not np.all(np.isfinite(profile)) or np.ptp(profile) == 0:
            return 0, "Major"

        # Standardise once. corrcoef would do this per candidate anyway, but
        # doing it up front keeps the comparison across all 24 candidates on
        # exactly the same footing.
        centred = profile - profile.mean()
        norm = np.linalg.norm(centred)
        if norm == 0:
            return 0, "Major"
        centred = centred / norm

        best_score = float("-inf")
        best_key = 0
        best_mode = "Major"

        for key_idx in range(12):
            for candidate, mode in (
                (np.roll(MAJOR_PROFILE, key_idx), "Major"),
                (np.roll(MINOR_PROFILE, key_idx), "Minor"),
            ):
                cand = candidate - candidate.mean()
                cand_norm = np.linalg.norm(cand)
                if cand_norm == 0:
                    continue
                score = float(np.dot(centred, cand / cand_norm))
                if np.isfinite(score) and score > best_score:
                    best_score = score
                    best_key = key_idx
                    best_mode = mode

        return best_key, best_mode

    def _estimate_scale(self, chroma: np.ndarray) -> str:
        """Estimate the key and mode of a chromagram, e.g. "F# Minor"."""
        key_idx, mode = self._estimate_key(chroma)
        return f"{KEY_NAMES[key_idx]} {mode}"
