import os
import subprocess
import tempfile
from pathlib import Path

import acoustid
import structlog

logger = structlog.get_logger()


class AcoustIDService:
    def __init__(self):
        self.api_key = os.getenv("ACOUSTID_API_KEY")

    def _identify(self, audio_bytes: bytes, extension: str, where: str) -> dict | None:
        """Fingerprint a sample and resolve it to a title/artist.

        Uses ``acoustid.lookup`` rather than ``acoustid.match`` because match()
        silently skips any result with no MusicBrainz recording attached. Those
        results still tell us the audio *was* recognised — worth distinguishing
        in the logs from "the fingerprint matched nothing at all", because the
        two have completely different causes.
        """
        if not self.api_key:
            logger.warning(
                "ACOUSTID_API_KEY not set — fingerprinting disabled",
                hint="Add key from https://acoustid.org",
            )
            return None

        ext = extension.lstrip(".") or "mp3"
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            duration, fingerprint = acoustid.fingerprint_file(tmp_path)
            response = acoustid.lookup(self.api_key, fingerprint, duration, meta="recordings")

            if response.get("status") != "ok":
                logger.warning("AcoustID lookup not ok", stage=where, status=response.get("status"))
                return None

            results = sorted(
                response.get("results") or [],
                key=lambda r: r.get("score") or 0,
                reverse=True,
            )
            if not results:
                logger.info("AcoustID found no match", stage=where)
                return None

            for result in results:
                for recording in result.get("recordings") or []:
                    title = recording.get("title")
                    artists = recording.get("artists") or []
                    artist = "".join(
                        a.get("name", "") + a.get("joinphrase", "") for a in artists
                    ).strip()
                    if title and artist:
                        logger.info(
                            "AcoustID matched track",
                            stage=where,
                            title=title,
                            artist=artist,
                            score=round(float(result.get("score") or 0), 3),
                            recording_id=recording.get("id"),
                        )
                        return {
                            "title": title,
                            "artist": artist,
                            "score": round(float(result.get("score") or 0), 3),
                            "source": "acoustid",
                            "acoustid_recording_id": recording.get("id"),
                            "isrc": None,
                        }

            # Recognised, but AcoustID has no MusicBrainz recording linked to
            # this fingerprint, so there is no name to report. Common for short
            # preview clips; nothing downstream can recover a title from it.
            logger.info(
                "AcoustID recognised the audio but has no metadata linked to it",
                stage=where,
                score=round(float(results[0].get("score") or 0), 3),
                acoustid_id=results[0].get("id"),
                candidates=len(results),
            )
            return None

        except acoustid.NoBackendError:
            logger.error("fpcalc/chromaprint not installed — install libchromaprint-tools")
            return None
        except acoustid.FingerprintGenerationError:
            logger.error("Could not generate fingerprint for this audio", stage=where)
            return None
        except acoustid.WebServiceError as e:
            if "invalid api key" in str(e).lower():
                logger.error("AcoustID API key is invalid")
            else:
                logger.error("AcoustID web service error", stage=where, error=str(e))
            return None
        except Exception as e:
            logger.warning("AcoustID lookup failed", stage=where, error=str(e))
            return None
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    def identify_from_bytes(self, audio_bytes: bytes, extension: str = "mp3") -> dict | None:
        """Fingerprint a mid-file sample and look it up."""
        return self._identify(audio_bytes, extension, "mid-file")


    def identify_from_start_sample(self, audio_bytes: bytes, extension: str = "mp3") -> dict | None:
        """Fingerprint the first ~30s and look it up."""
        return self._identify(audio_bytes, extension, "start-sample")

    @staticmethod
    def read_30s_start_sample(audio_path: str) -> bytes:
        """Extract the first ~30 seconds of audio using ffmpeg, regardless of input format."""
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name

            result = subprocess.run(
                [
                    "ffmpeg", "-i", audio_path,
                    "-t", "30",
                    "-ar", "44100", "-ac", "1",
                    "-codec:a", "libmp3lame", "-b:a", "128k",
                    "-y", tmp_path,
                ],
                capture_output=True,
                timeout=30,
            )

            if result.returncode != 0 or not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                logger.warning("ffmpeg 30s extraction failed, falling back to raw read",
                               stderr=result.stderr.decode(errors="replace")[:200])
                return AcoustIDService._raw_read(audio_path, 2 * 1024 * 1024)

            with open(tmp_path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.warning("30s sample extraction failed", error=str(e))
            return AcoustIDService._raw_read(audio_path, 2 * 1024 * 1024)
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    @staticmethod
    def read_fingerprint_sample(audio_path: str) -> bytes:
        """Extract ~25s from mid-file using ffmpeg to skip intros/silence."""
        tmp_path = None
        try:
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", audio_path],
                capture_output=True, timeout=10,
            )
            duration = float(probe.stdout.decode().strip() or "0")
            start = max(0, duration * 0.25) if duration > 60 else 0

            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name

            result = subprocess.run(
                [
                    "ffmpeg", "-i", audio_path,
                    "-ss", str(int(start)),
                    "-t", "25",
                    "-ar", "44100", "-ac", "1",
                    "-codec:a", "libmp3lame", "-b:a", "128k",
                    "-y", tmp_path,
                ],
                capture_output=True,
                timeout=30,
            )

            if result.returncode != 0 or not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                logger.warning("ffmpeg mid-file extraction failed, falling back to raw read",
                               stderr=result.stderr.decode(errors="replace")[:200])
                return AcoustIDService._raw_read(audio_path, 3 * 1024 * 1024, offset_pct=0.25)

            with open(tmp_path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.warning("Mid-file sample extraction failed", error=str(e))
            return AcoustIDService._raw_read(audio_path, 3 * 1024 * 1024, offset_pct=0.25)
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    @staticmethod
    def _raw_read(audio_path: str, size: int, offset_pct: float = 0) -> bytes:
        """Fallback: read raw bytes from file."""
        try:
            with open(audio_path, "rb") as f:
                f.seek(0, os.SEEK_END)
                file_size = f.tell()
                start = int(file_size * offset_pct) if offset_pct > 0 else 0
                f.seek(min(start, file_size))
                return f.read(size)
        except Exception:
            return b""

    @staticmethod
    def extension_from_path(audio_path: str) -> str:
        return (Path(audio_path).suffix or ".mp3").lstrip(".").lower() or "mp3"
