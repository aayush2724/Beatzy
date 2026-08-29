"""ACRCloud audio identification.

AcoustID (see `acoustid_service`) matches exact audio: it fingerprints a file
and looks for the same file in its index. That works for a music library on
disk, but it cannot identify a microphone recording — room noise and reverb
change the audio enough that the fingerprint no longer matches — and in
practice it also fails on short preview clips, whose fingerprints are present
in AcoustID but carry no MusicBrainz metadata to name them with.

ACRCloud does the Shazam-style job instead: noise-robust landmark matching
against a licensed catalogue, designed for short and noisy excerpts. The
database schema (`acr_id`, `raw_acr_response`) and the environment scaffolding
were always built for it; this is the implementation.

Disabled unless ACRCLOUD_ACCESS_KEY and ACRCLOUD_SECRET_KEY are set, so the
identification chain degrades to AcoustID and the filename fallback without it.
"""

import asyncio
import base64
import hashlib
import hmac
import os
import time

import structlog

logger = structlog.get_logger()

DEFAULT_HOST = "identify-eu-west-1.acrcloud.com"
IDENTIFY_PATH = "/v1/identify"

# ACRCloud wants a short excerpt — 10-15s is plenty, and large uploads are
# rejected outright.
MAX_SAMPLE_BYTES = 1024 * 1024


class ACRCloudService:
    def __init__(self):
        self.host = (os.getenv("ACRCLOUD_HOST") or DEFAULT_HOST).strip()
        self.access_key = (os.getenv("ACRCLOUD_ACCESS_KEY") or "").strip()
        self.secret_key = (os.getenv("ACRCLOUD_SECRET_KEY") or "").strip()

    @property
    def enabled(self) -> bool:
        return bool(self.access_key and self.secret_key)

    async def identify(self, audio_bytes: bytes) -> dict | None:
        if not self.enabled:
            return None
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._identify_sync, audio_bytes)

    def _signature(self, timestamp: str) -> str:
        string_to_sign = "\n".join(
            ["POST", IDENTIFY_PATH, self.access_key, "audio", "1", timestamp]
        )
        digest = hmac.new(
            self.secret_key.encode("ascii"),
            string_to_sign.encode("ascii"),
            digestmod=hashlib.sha1,
        ).digest()
        return base64.b64encode(digest).decode("ascii")

    def _identify_sync(self, audio_bytes: bytes) -> dict | None:
        if not audio_bytes:
            return None

        sample = audio_bytes[:MAX_SAMPLE_BYTES]
        timestamp = str(int(time.time()))

        try:
            import requests

            resp = requests.post(
                f"https://{self.host}{IDENTIFY_PATH}",
                files={"sample": ("sample.mp3", sample, "audio/mpeg")},
                data={
                    "access_key": self.access_key,
                    "sample_bytes": str(len(sample)),
                    "timestamp": timestamp,
                    "signature": self._signature(timestamp),
                    "data_type": "audio",
                    "signature_version": "1",
                },
                timeout=15,
            )
            resp.raise_for_status()
            payload = resp.json()
        except Exception as e:
            logger.warning("ACRCloud request failed", error=str(e))
            return None

        status = payload.get("status") or {}
        code = status.get("code")
        if code != 0:
            # 1001 is the ordinary "we don't recognise this audio" answer, not
            # a fault. Anything else is worth surfacing louder.
            log = logger.info if code == 1001 else logger.warning
            log("ACRCloud returned no match", code=code, msg=status.get("msg"))
            return None

        music = (payload.get("metadata") or {}).get("music") or []
        if not music:
            logger.info("ACRCloud matched but returned no music metadata")
            return None

        best = music[0]
        artists = best.get("artists") or []
        artist = ", ".join(a.get("name", "") for a in artists if a.get("name")).strip()
        external = best.get("external_metadata") or {}
        spotify_id = ((external.get("spotify") or {}).get("track") or {}).get("id")

        title = best.get("title")
        if not title:
            logger.info("ACRCloud match had no title", acr_id=best.get("acrid"))
            return None

        result = {
            "title": title,
            "artist": artist or None,
            "album": (best.get("album") or {}).get("name"),
            # ACRCloud returns release_date as ISO YYYY-MM-DD
            "release_year": (best.get("release_date") or "")[:4] or None,
            "isrc": (best.get("external_ids") or {}).get("isrc"),
            "acr_id": best.get("acrid"),
            "spotify_id": spotify_id,
            "score": best.get("score"),
            "source": "acrcloud",
        }

        logger.info(
            "ACRCloud matched track",
            title=result["title"],
            artist=result["artist"],
            score=result["score"],
            acr_id=result["acr_id"],
        )
        return result
