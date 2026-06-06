import asyncio
import numpy as np
import librosa
import structlog

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

        # BPM / Tempo
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(round(tempo, 2))

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
        tonnetz = librosa.feature.tonnetz(y=y, sr=sr)
        tonnetz_mean = float(np.mean(tonnetz))

        # Key, scale, and chord extraction
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_idx = int(np.argmax(np.mean(chroma, axis=1)))
        key_signature = KEY_NAMES[key_idx]
        scale = self._estimate_scale(chroma)
        chord_timeline = self._extract_chords(y, sr)

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
