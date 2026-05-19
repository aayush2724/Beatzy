import asyncio
import base64
import hashlib
import hmac
import time
import os
import requests
import structlog

logger = structlog.get_logger()


class ACRCloudService:
    def __init__(self):
        self.host = os.getenv("ACRCLOUD_HOST", "identify-eu-west-1.acrcloud.com")
        self.access_key = os.getenv("ACRCLOUD_ACCESS_KEY", "")
        self.secret_key = os.getenv("ACRCLOUD_SECRET_KEY", "")

    async def identify(self, audio_path: str) -> dict:
        if not self.access_key or not self.secret_key:
            logger.warning("ACRCloud credentials not configured, skipping identification")
            return {}
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._identify_sync, audio_path)

    def _identify_sync(self, audio_path: str) -> dict:
        try:
            http_method = "POST"
            http_uri = "/v1/identify"
            data_type = "audio"
            signature_version = "1"
            timestamp = str(int(time.time()))

            string_to_sign = "\n".join([http_method, http_uri, self.access_key, data_type, signature_version, timestamp])
            signature = base64.b64encode(
                hmac.new(self.secret_key.encode(), string_to_sign.encode(), digestmod=hashlib.sha1).digest()
            ).decode()

            with open(audio_path, "rb") as f:
                sample = f.read(1024 * 1024)

            files = [("sample", ("audio.mp3", sample, "audio/mpeg"))]
            data = {
                "access_key": self.access_key,
                "sample_bytes": len(sample),
                "timestamp": timestamp,
                "signature": signature,
                "data_type": data_type,
                "signature_version": signature_version,
            }

            response = requests.post(
                f"https://{self.host}/v1/identify",
                files=files,
                data=data,
                timeout=10,
            )
            result = response.json()

            if result.get("status", {}).get("code") == 0:
                music = result["metadata"]["music"][0]
                return {
                    "title": music.get("title"),
                    "artist": music.get("artists", [{}])[0].get("name"),
                    "album": music.get("album", {}).get("name"),
                    "release_year": music.get("release_date", "")[:4] or None,
                    "isrc": music.get("external_ids", {}).get("isrc"),
                    "acr_id": music.get("acrid"),
                    "genres": [g["name"] for g in music.get("genres", [])],
                    "score": music.get("score"),
                }
            return {}
        except Exception as e:
            logger.error("ACRCloud identification failed", error=str(e))
            return {}
