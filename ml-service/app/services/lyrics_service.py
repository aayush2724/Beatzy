import aiohttp
import structlog
from urllib.parse import quote

logger = structlog.get_logger()

class LyricsService:
    async def fetch_lyrics(self, artist: str, title: str) -> str | None:
        """Fetch lyrics using the free lyrics.ovh API."""
        if not artist or not title:
            return None
            
        # Clean up song titles (remove "Remastered", "feat.", etc.)
        clean_title = title.split("(")[0].split("-")[0].strip()
        clean_artist = artist.split(",")[0].strip()
        
        url = f"https://api.lyrics.ovh/v1/{quote(clean_artist)}/{quote(clean_title)}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        lyrics = data.get("lyrics")
                        if lyrics:
                            # Clean up the weird "Paroles de la chanson..." header it sometimes adds
                            if "Paroles de la chanson" in lyrics:
                                lyrics = "\n".join(lyrics.split("\n")[1:]).strip()
                            return lyrics
                    
                    logger.info("Lyrics not found on provider", artist=clean_artist, title=clean_title)
                    return None
        except Exception as e:
            logger.error("Lyrics fetch failed", error=str(e))
            return None
