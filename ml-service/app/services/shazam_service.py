"""Shazam audio identification.

Why this exists: AcoustID (see `acoustid_service`) matches *exact* audio. It
fingerprints a file and looks for the same file in its index, which works for a
music library on disk but cannot identify a microphone recording — room noise
and reverb move the fingerprint far enough that nothing matches — and in
practice also misses on 30s preview clips, whose AcoustID entries usually carry
no MusicBrainz metadata to name them with (measured 0/11 here).

Shazam does the other job: noise-robust landmark matching designed for short,
dirty excerpts. ACRCloud (`acrcloud_service`) does the same thing under a paid
licence and stays first in the chain when keys are configured; this is the
free path.

Caveat, stated plainly: there is no public Shazam API. This talks to the
endpoint their own clients use, via `shazamio-core` for the (Rust) signature
generation. It needs no key and no account, but it is unofficial — expect it to
break if Shazam changes the endpoint, and do not build anything commercial on
it. It is therefore a soft dependency: if `shazamio-core` is not installed, or
SHAZAM_ENABLED is false, the service reports `enabled = False` and the
identification chain carries on to AcoustID exactly as before.

`shazamio` itself (the full Python package) is deliberately NOT used: it pins
numpy>=2.2, which conflicts with the numpy 1.26 that librosa and tensorflow-cpu
are pinned against here. `shazamio-core` has no Python dependencies at all, so
we take the signature generator from it and make the one HTTP call ourselves.
"""

import asyncio
import os
import subprocess
import tempfile
import uuid
from random import choice

import aiohttp
import structlog

logger = structlog.get_logger()

try:
    from shazamio_core import Recognizer, SearchParams

    _CORE_AVAILABLE = True
except ImportError:  # pragma: no cover - depends on the deployment image
    Recognizer = None
    SearchParams = None
    _CORE_AVAILABLE = False

SEARCH_URL = (
    "https://amp.shazam.com/discovery/v5/en/GB/{device}/-/tag/{uuid_1}/{uuid_2}"
    "?sync=true&webv3=true&sampling=true&connected=&shazamapiversion=v3"
    "&sharehub=true&hubv5minorversion=v5.1&hidelb=true&video=v3"
)

DEVICES = ("iphone", "android", "web")

# Shazam matches on a short excerpt; a longer one is not more accurate, just
# slower. The recognizer takes this many seconds from the centre of the file.
SEGMENT_SECONDS = 10

REQUEST_TIMEOUT = 20

# The bundled Rust decoder handles wav cleanly but writes hundreds of lines
# of "invalid mpeg audio header" / "skipping junk" to stderr on m4a and mp3
# input — 267 lines for a single 30s clip. Normalising to 16 kHz mono wav
# with ffmpeg first silences that and makes every input format decode the
# same way. 16 kHz mono is what the signature generator resamples to anyway,
# so nothing is lost and the temp file stays small (~32 KB/s).
CONVERT_TIMEOUT = 30

# The endpoint rate-limits bursts with a 429. One upload is one request, so
# this only bites when several jobs land together; a short backoff clears it.
RATE_LIMIT_RETRIES = 2
RATE_LIMIT_BACKOFF_SECONDS = 4


class ShazamService:
    def __init__(self):
        self.disabled = (os.getenv("SHAZAM_ENABLED") or "true").strip().lower() in (
            "false",
            "0",
            "no",
        )

    @property
    def enabled(self) -> bool:
        return _CORE_AVAILABLE and not self.disabled

    @staticmethod
    def _headers() -> dict:
        return {
            "X-Shazam-Platform": "IPHONE",
            "X-Shazam-AppVersion": "14.1.0",
            "Accept": "*/*",
            "Accept-Language": "en",
            "Accept-Encoding": "gzip, deflate",
            "User-Agent": (
                "Dalvik/2.1.0 (Linux; U; Android 12; SM-G991B Build/SP1A.210812.016)"
            ),
            "Content-Type": "application/json",
        }

    @staticmethod
    def _to_wav(audio_path: str) -> str | None:
        """Transcode to 16 kHz mono wav. Returns a temp path the caller deletes."""
        fd, wav_path = tempfile.mkstemp(suffix=".wav", prefix="shazam-")
        os.close(fd)
        try:
            result = subprocess.run(
                [
                    "ffmpeg", "-i", audio_path,
                    "-ar", "16000", "-ac", "1", "-f", "wav",
                    "-y", wav_path,
                ],
                capture_output=True,
                timeout=CONVERT_TIMEOUT,
            )
            if result.returncode == 0 and os.path.getsize(wav_path) > 0:
                return wav_path
            logger.warning(
                "Shazam wav conversion failed",
                returncode=result.returncode,
                stderr=result.stderr.decode(errors="replace")[:200],
            )
        except Exception as e:
            logger.warning("Shazam wav conversion failed", error=str(e))
        try:
            os.unlink(wav_path)
        except OSError:
            pass
        return None

    async def identify(self, audio_path: str) -> dict | None:
        """Identify the track in `audio_path`. Returns None on any miss."""
        if not self.enabled:
            return None

        loop = asyncio.get_event_loop()
        wav_path = await loop.run_in_executor(None, self._to_wav, audio_path)
        if not wav_path:
            return None

        try:
            recognizer = Recognizer()
            signature = await recognizer.recognize_path(
                value=wav_path,
                options=SearchParams(segment_duration_seconds=SEGMENT_SECONDS),
            )
        except Exception as e:
            logger.warning("Shazam signature generation failed", error=str(e))
            return None
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass

        payload = {
            "timezone": "Europe/London",
            "signature": {
                "uri": signature.signature.uri,
                "samplems": signature.signature.samples,
            },
            "timestamp": signature.timestamp,
            "context": {},
            "geolocation": {},
        }
        url = SEARCH_URL.format(
            device=choice(DEVICES),
            uuid_1=str(uuid.uuid4()).upper(),
            uuid_2=str(uuid.uuid4()).upper(),
        )

        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
        for attempt in range(RATE_LIMIT_RETRIES + 1):
            try:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.post(
                        url, json=payload, headers=self._headers()
                    ) as resp:
                        if resp.status == 429:
                            if attempt < RATE_LIMIT_RETRIES:
                                logger.info(
                                    "Shazam rate-limited, backing off",
                                    attempt=attempt + 1,
                                )
                                await asyncio.sleep(
                                    RATE_LIMIT_BACKOFF_SECONDS * (attempt + 1)
                                )
                                continue
                            # Not a miss — we never got to ask. Say so, so this
                            # is not mistaken for "Shazam doesn't know the track".
                            logger.warning("Shazam rate-limited, giving up")
                            return None
                        resp.raise_for_status()
                        body = await resp.json(content_type=None)
            except Exception as e:
                logger.warning("Shazam lookup request failed", error=str(e))
                return None

            return self._parse(body)

        return None

    @staticmethod
    def _section_metadata(track: dict) -> dict:
        """Flatten the SONG section's label/value pairs into a plain dict.

        Shazam does not return album or year as fields. They arrive as display
        rows — [{"title": "Album", "text": "After Hours"}, ...] — inside the
        section whose type is SONG.
        """
        for section in track.get("sections") or []:
            if section.get("type") != "SONG":
                continue
            return {
                row.get("title"): row.get("text")
                for row in (section.get("metadata") or [])
                if row.get("title")
            }
        return {}

    def _parse(self, body: dict) -> dict | None:
        track = (body or {}).get("track") or {}
        title = track.get("title")
        if not title:
            # An empty `matches` list is the ordinary "not recognised" answer.
            logger.info("Shazam returned no match")
            return None

        meta = self._section_metadata(track)
        released = meta.get("Released") or ""

        result = {
            "title": title,
            "artist": track.get("subtitle") or None,
            "album": meta.get("Album"),
            # "Released" is either a bare year or a full date; take the year.
            "release_year": released[:4] if released[:4].isdigit() else None,
            "isrc": track.get("isrc"),
            "genre": (track.get("genres") or {}).get("primary"),
            "shazam_id": track.get("key"),
            "source": "shazam",
        }

        logger.info(
            "Shazam matched track",
            title=result["title"],
            artist=result["artist"],
            shazam_id=result["shazam_id"],
        )
        return result
