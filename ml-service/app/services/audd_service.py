import os
import aiohttp
import structlog

logger = structlog.get_logger()


class AuddService:
    def __init__(self):
        self.api_token = os.getenv("AUDD_API_TOKEN", "")
        self.api_url = "https://api.audd.io/"

    async def identify(self, audio_path: str) -> dict:
        """Sends the audio file to AudD for fingerprinting."""
        if not self.api_token:
            logger.warning("AudD API token not configured, skipping identification.")
            return {}

        try:
            # We only need to send a small chunk of the file (1-2MB is plenty)
            with open(audio_path, "rb") as f:
                sample_bytes = f.read(2 * 1024 * 1024)

            data = aiohttp.FormData()
            data.add_field("api_token", self.api_token)
            data.add_field(
                "file",
                sample_bytes,
                filename="audio.mp3",
                content_type="audio/mpeg",
            )

            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, data=data, timeout=15) as response:
                    res = await response.json()

            if res.get("status") == "success" and res.get("result"):
                music = res["result"]
                logger.info(
                    "AudD matched track",
                    title=music.get("title"),
                    artist=music.get("artist"),
                )

                # Match the exact dictionary structure the rest of Beatzy expects
                return {
                    "title": music.get("title"),
                    "artist": music.get("artist"),
                    "album": music.get("album"),
                    "release_year": music.get("release_date", "")[:4] or None,
                    "isrc": None,  # AudD free tier doesn't always provide ISRC
                    "acr_id": None,
                    "genres": [],
                    "score": 100,  # AudD only returns high confidence matches
                }

            logger.info("AudD found no match for this audio")
            return {}

        except Exception as e:
            logger.error("AudD identification failed", error=str(e))
            return {}
