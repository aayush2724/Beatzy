import aiohttp
import structlog
from urllib.parse import quote
from app.services.itunes_service import iTunesService

logger = structlog.get_logger()

class EnrichmentService:
    BASE_MB = "https://musicbrainz.org/ws/2"
    BASE_CAA = "https://coverartarchive.org"
    HEADERS = {
        "User-Agent": "Beatzy/1.0 (https://beatzy-zeta.vercel.app)"
    }

    async def enrich(self, *, isrc=None, title=None, artist=None) -> dict:
        """Return track metadata from MusicBrainz. No API key needed."""
        if not title:
            return {}
        try:
            recording = await self._find_recording(isrc, title, artist)
            if not recording:
                return {}
            
            rid = recording.get("id")
            mb_title = recording.get("title", title)
            
            artist_credit = recording.get("artist-credit", [])
            mb_artist = artist_credit[0]["artist"]["name"] if artist_credit else artist
            
            releases = recording.get("releases", [])
            release = releases[0] if releases else {}
            album = release.get("title")
            release_date = release.get("date")
            release_id = release.get("id")
            
            cover_url = await self._get_cover_art(release_id) if release_id else None
            
            search_query = quote(f"{mb_title} {mb_artist}")
            spotify_search = f"https://open.spotify.com/search/{search_query}"
            
            return {
                "title": mb_title,
                "artist": mb_artist,
                "album": album,
                "release_date": release_date,
                "cover_url": cover_url,
                "spotify_url": spotify_search,
                "musicbrainz_id": rid,
                "source": "musicbrainz",
                "isrc": isrc,
            }
        except Exception as e:
            logger.warning("MusicBrainz enrichment failed", error=str(e))
            return {}

    async def search_tracks(self, query: str, limit: int = 10) -> list[dict]:
        """Search iTunes for tracks matching query to get preview and cover URLs."""
        try:
            itunes = iTunesService()
            return await itunes.search_tracks(query, limit)
        except Exception as e:
            logger.warning("iTunes search failed in EnrichmentService", error=str(e))
            return []

    async def _find_recording(self, isrc, title, artist) -> dict | None:
        if isrc:
            url = (
                f"{self.BASE_MB}/recording"
                f"?query=isrc:{isrc}"
                f"&inc=artist-credits+releases"
                f"&fmt=json"
            )
            result = await self._mb_get(url)
            recordings = result.get("recordings", [])
            if recordings:
                return recordings[0]

        if title:
            query = f'recording:"{quote(title)}"'
            if artist:
                query += f' AND artist:"{quote(artist)}"'
            url = (
                f"{self.BASE_MB}/recording"
                f"?query={query}"
                f"&inc=artist-credits+releases"
                f"&fmt=json"
                f"&limit=1"
            )
            result = await self._mb_get(url)
            recordings = result.get("recordings", [])
            if recordings:
                return recordings[0]
        return None

    async def _get_cover_art(self, release_id: str) -> str | None:
        url = f"{self.BASE_CAA}/release/{release_id}/front-250"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, allow_redirects=True, timeout=8
                ) as r:
                    if r.status == 200:
                        return str(r.url)
            return None
        except Exception:
            return None

    async def _mb_get(self, url: str) -> dict:
        try:
            async with aiohttp.ClientSession(headers=self.HEADERS) as session:
                async with session.get(url, timeout=10) as r:
                    if r.status == 200:
                        return await r.json()
            return {}
        except Exception:
            return {}

SpotifyService = EnrichmentService
