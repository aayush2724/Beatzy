"""Free iTunes Search API fallback when Spotify is unavailable."""

import asyncio
import aiohttp
import structlog

logger = structlog.get_logger()

ITUNES_SEARCH_URL = "https://itunes.apple.com/search"


class iTunesService:
    async def search_tracks(self, query: str, limit: int = 10) -> list[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._search_sync, query, limit)

    async def enrich(self, *, title: str | None = None, artist: str | None = None) -> dict:
        if not title:
            return {}
        query = f"{artist} {title}".strip() if artist else title
        tracks = await self.search_tracks(query, limit=1)
        return tracks[0] if tracks else {}

    def _search_sync(self, query: str, limit: int) -> list[dict]:
        try:
            import requests
            resp = requests.get(
                ITUNES_SEARCH_URL,
                params={"term": query, "entity": "song", "limit": limit},
                timeout=10,
            )
            resp.raise_for_status()
            items = resp.json().get("results", [])
            tracks = []
            for item in items:
                if item.get("wrapperType") != "track":
                    continue
                artwork = item.get("artworkUrl100") or ""
                cover = artwork.replace("100x100bb", "600x600bb").replace("100x100", "600x600")
                tracks.append({
                    "spotify_id": str(item.get("trackId", "")),
                    "itunes_track_id": item.get("trackId"),
                    "spotify_url": item.get("trackViewUrl"),
                    "title": item.get("trackName"),
                    "artist": item.get("artistName"),
                    "album": item.get("collectionName"),
                    "cover_url": cover or None,
                    "preview_url": item.get("previewUrl"),
                    "duration_ms": item.get("trackTimeMillis"),
                    "release_date": item.get("releaseDate", "")[:10] or None,
                    "source": "itunes",
                })
            return tracks
        except Exception as e:
            logger.error("iTunes search failed", error=str(e))
            return {}
