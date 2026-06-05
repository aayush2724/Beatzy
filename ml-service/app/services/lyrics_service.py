import aiohttp
import structlog
from urllib.parse import quote

logger = structlog.get_logger()

class LyricsService:
    async def fetch_lyrics(self, artist: str, title: str) -> dict:
        if not artist or not title:
            return {"plain": None, "synced": None}

        clean_title = title.split("(")[0].split("-")[0].strip()
        clean_artist = artist.split(",")[0].strip()

        result = await self._fetch_lrclib(clean_artist, clean_title)
        if result.get("plain") or result.get("synced"):
            logger.info(
                "Lyrics found via LRCLIB",
                artist=clean_artist,
                title=clean_title,
            )
            return result

        plain = await self._fetch_lyrics_ovh(clean_artist, clean_title)
        if plain:
            logger.info(
                "Lyrics found via lyrics.ovh",
                artist=clean_artist,
                title=clean_title,
            )
        else:
            logger.info(
                "Lyrics not found on any provider",
                artist=clean_artist,
                title=clean_title,
            )
        return {"plain": plain, "synced": None}

    async def _fetch_lrclib(self, artist: str, title: str) -> dict:
        url = (
            f"https://lrclib.net/api/get"
            f"?artist_name={quote(artist)}"
            f"&track_name={quote(title)}"
        )
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=15) as r:
                    if r.status == 200:
                        data = await r.json()
                        plain = data.get("plainLyrics")
                        synced_raw = data.get("syncedLyrics")
                        synced = (
                            self._parse_lrc(synced_raw) if synced_raw else None
                        )
                        return {"plain": plain, "synced": synced}
                    return {"plain": None, "synced": None}
        except Exception as e:
            logger.warning("LRCLIB fetch failed", error=str(e))
            return {"plain": None, "synced": None}

    async def _fetch_lyrics_ovh(self, artist: str, title: str) -> str | None:
        url = f"https://api.lyrics.ovh/v1/{quote(artist)}/{quote(title)}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as r:
                    if r.status == 200:
                        data = await r.json()
                        lyrics = data.get("lyrics")
                        if lyrics:
                            if "Paroles de la chanson" in lyrics:
                                lyrics = "\n".join(
                                    lyrics.split("\n")[1:]
                                ).strip()
                            return lyrics
            return None
        except Exception as e:
            logger.warning("lyrics.ovh fetch failed", error=str(e))
            return None

    @staticmethod
    def _parse_lrc(lrc_text: str) -> list[dict] | None:
        lines = []
        for line in lrc_text.strip().split("\n"):
            line = line.strip()
            if not line or not line.startswith("["):
                continue
            try:
                tag_end = line.index("]")
                tag = line[1:tag_end]
                text = line[tag_end + 1:].strip()
                if not text:
                    continue
                parts = tag.split(":")
                if len(parts) != 2:
                    continue
                minutes = int(parts[0])
                seconds = float(parts[1])
                time_ms = int((minutes * 60 + seconds) * 1000)
                lines.append({"time_ms": time_ms, "text": text})
            except (ValueError, IndexError):
                continue
        return lines if lines else None
