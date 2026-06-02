"""
Beatzy — Spotify Enrichment Service.

Uses only free Spotify Web API endpoints:
  - Track search (title + artist / ISRC)
  - Track metadata (cover art, popularity, preview URL, Spotify link)

Audio-features endpoint is intentionally excluded as it requires
extended quota approval from Spotify since late 2024.
"""

import os
import asyncio
import structlog

logger = structlog.get_logger()

try:
    import spotipy
except ImportError:
    spotipy = None


class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self._sp = None

    def _get_client(self):
        if self._sp is not None:
            return self._sp

        if not self.client_id or not self.client_secret:
            logger.warning("Spotify credentials not set — enrichment disabled")
            return None

        if spotipy is None:
            logger.error("Spotipy not installed")
            return None

        try:
            from spotipy.oauth2 import SpotifyClientCredentials
            auth = SpotifyClientCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret,
            )
            self._sp = spotipy.Spotify(auth_manager=auth, requests_timeout=10)
            logger.info("Spotify client initialised")
            return self._sp
        except Exception as e:
            logger.error("Failed to create Spotify client", error=str(e))
            return None

    async def search_tracks(self, query: str, limit: int = 10) -> list[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._search_tracks_sync, query, limit)

    async def enrich(self, *, isrc: str | None = None,
                     title: str | None = None,
                     artist: str | None = None) -> dict:
        """Return free Spotify track metadata or {} on failure / no creds."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._enrich_sync, isrc, title, artist)

    def _enrich_sync(self, isrc: str | None,
                     title: str | None, artist: str | None) -> dict:
        sp = self._get_client()
        if sp is None:
            return {}

        try:
            track = self._find_track_full(sp, isrc, title, artist)
            if not track:
                logger.info("No Spotify match found", isrc=isrc, title=title, artist=artist)
                return {}

            artists = ", ".join(a["name"] for a in track.get("artists", []))
            album = track.get("album", {})
            images = album.get("images", [])
            cover_url = images[0]["url"] if images else None
            external_ids = track.get("external_ids", {})

            return {
                "spotify_track_id": track["id"],
                "spotify_url": track.get("external_urls", {}).get("spotify"),
                "cover_url": cover_url,
                "preview_url": track.get("preview_url"),
                "popularity": track.get("popularity"),
                "title": track.get("name"),
                "artist": artists,
                "album": album.get("name"),
                "release_date": album.get("release_date"),
                "isrc": external_ids.get("isrc"),
                "duration_ms": track.get("duration_ms"),
            }
        except Exception as e:
            logger.error("Spotify enrichment failed", error=str(e))
            return {}

    def _search_tracks_sync(self, query: str, limit: int) -> list[dict]:
        sp = self._get_client()
        if sp is None:
            return []

        try:
            results = sp.search(q=query, type="track", limit=limit)
            items = results.get("tracks", {}).get("items", [])
            tracks = []
            for item in items:
                artists = ", ".join(a["name"] for a in item.get("artists", []))
                album = item.get("album", {})
                images = album.get("images", [])
                cover = images[0]["url"] if images else None
                isrc = item.get("external_ids", {}).get("isrc")
                tracks.append({
                    "spotify_id": item["id"],
                    "spotify_url": item.get("external_urls", {}).get("spotify"),
                    "title": item["name"],
                    "artist": artists,
                    "album": album.get("name", ""),
                    "cover_url": cover,
                    "isrc": isrc,
                    "preview_url": item.get("preview_url"),
                    "duration_ms": item.get("duration_ms"),
                    "popularity": item.get("popularity"),
                    "release_date": album.get("release_date"),
                })
            return tracks
        except Exception as e:
            logger.error("Spotify search failed", error=str(e))
            return []

    @staticmethod
    def _find_track_full(sp, isrc, title, artist) -> dict | None:
        """Return full track object. Try ISRC first, then title+artist search."""
        if isrc:
            try:
                results = sp.search(q=f"isrc:{isrc}", type="track", limit=1)
                items = results.get("tracks", {}).get("items", [])
                if items:
                    return items[0]
            except Exception:
                pass

        if title:
            query = f"track:{title}"
            if artist:
                query += f" artist:{artist}"
            try:
                results = sp.search(q=query, type="track", limit=1)
                items = results.get("tracks", {}).get("items", [])
                if items:
                    return items[0]
            except Exception:
                pass

        return None
