import os
import tempfile
from pathlib import Path

import acoustid
import structlog

logger = structlog.get_logger()


class AcoustIDService:
    def __init__(self):
        self.api_key = os.getenv("ACOUSTID_API_KEY")

    def identify_from_bytes(self, audio_bytes: bytes, extension: str = "mp3") -> dict | None:
        """Write the sample to a temp file, fingerprint it, and look it up."""
        if not self.api_key:
            logger.warning(
                "ACOUSTID_API_KEY not set — fingerprinting disabled",
                hint="Add key from https://acoustid.org",
            )
            return None

        ext = extension.lstrip(".")
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                suffix=f".{ext}", delete=False
            ) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                matches = list(acoustid.match(self.api_key, tmp_path))
            except acoustid.WebServiceError as e:
                if "invalid api key" in str(e).lower():
                    logger.error("AcoustID API key is invalid")
                    return None
                raise e

            if not matches:
                logger.info("AcoustID found no match for this audio")
                return None

            matches.sort(key=lambda x: x[0], reverse=True)

            for score, recording_id, title, artist in matches:
                if title and artist:
                    logger.info(
                        "AcoustID matched track",
                        title=title,
                        artist=artist,
                        score=round(float(score), 3),
                        recording_id=recording_id,
                    )
                    return {
                        "title": title,
                        "artist": artist,
                        "score": round(float(score), 3),
                        "source": "acoustid",
                        "acoustid_recording_id": recording_id,
                        "isrc": None,
                    }
            return None
        except acoustid.NoBackendError:
            logger.error("fpcalc/chromaprint not installed — install libchromaprint-tools")
            return None
        except acoustid.FingerprintGenerationError:
            logger.error("Could not generate fingerprint for this audio")
            return None
        except acoustid.WebServiceError as e:
            logger.error("AcoustID web service error", error=str(e))
            return None
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    def identify_from_start_sample(self, audio_bytes: bytes, extension: str = "mp3") -> dict | None:
        """Write a 30s start-sample to a temp file and fingerprint it."""
        if not self.api_key:
            return None

        ext = extension.lstrip(".")
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                suffix=f".{ext}", delete=False
            ) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                matches = list(acoustid.match(self.api_key, tmp_path))
            except acoustid.WebServiceError as e:
                if "invalid api key" in str(e).lower():
                    logger.error("AcoustID API key is invalid")
                    return None
                raise e

            if matches:
                matches.sort(key=lambda x: x[0], reverse=True)
                for score, recording_id, title, artist in matches:
                    if title and artist:
                        logger.info(
                            "AcoustID start-sample matched track",
                            title=title,
                            artist=artist,
                            score=round(float(score), 3),
                            recording_id=recording_id,
                        )
                        return {
                            "title": title,
                            "artist": artist,
                            "score": round(float(score), 3),
                            "source": "acoustid",
                            "acoustid_recording_id": recording_id,
                            "isrc": None,
                        }
            logger.info("AcoustID start-sample found no match")
            return None
        except Exception as e:
            logger.warning("AcoustID start-sample attempt failed", error=str(e))
            return None
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    @staticmethod
    def read_30s_start_sample(audio_path: str) -> bytes:
        """Read the first ~30 seconds of audio from the start of the file."""
        sample_size = 2 * 1024 * 1024
        with open(audio_path, "rb") as f:
            return f.read(sample_size)

    @staticmethod
    def read_fingerprint_sample(audio_path: str) -> bytes:
        """Read ~25s of audio from mid-file to skip long intros/silence at the start."""
        sample_size = 3 * 1024 * 1024
        with open(audio_path, "rb") as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            if size <= sample_size:
                f.seek(0)
                return f.read()
            start = min(int(size * 0.25), max(0, size - sample_size))
            f.seek(start)
            return f.read(sample_size)

    @staticmethod
    def extension_from_path(audio_path: str) -> str:
        return (Path(audio_path).suffix or ".mp3").lstrip(".").lower() or "mp3"
