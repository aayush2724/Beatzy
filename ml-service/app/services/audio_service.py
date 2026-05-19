import asyncio
import numpy as np
import librosa
import structlog

logger = structlog.get_logger()


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

        # Mood inference from audio features
        mood = self._infer_mood(bpm, energy_level, spectral_centroid, mfcc_means)

        return {
            "bpm": bpm,
            "energy_level": energy_level,
            "mood": mood,
            "key_signature": key_signature,
            "time_signature": time_signature,
            "spectral_centroid": round(spectral_centroid, 4),
            "spectral_rolloff": round(spectral_rolloff, 4),
            "zero_crossing_rate": round(zero_crossing_rate, 6),
            "mfcc_means": mfcc_means,
        }

    def _infer_mood(self, bpm: float, energy: float, centroid: float, mfccs: list) -> str:
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
