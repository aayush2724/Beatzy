"""
Beatzy — Spotify Enrichment Service.

Wraps Spotipy to search for tracks by ISRC / title+artist and return
Spotify audio‑features (danceability, valence, acousticness, etc.).
Gracefully degrades when credentials are missing.
"""

import os
import asyncio
import structlog

logger = structlog.get_logger()


class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self._sp = None

    def _get_client(self):
        """Lazily create an authenticated Spotipy client (client‑credentials flow)."""
        if self._sp is not None:
            return self._sp

        if not self.client_id or not self.client_secret:
            logger.warning("Spotify credentials not set — enrichment disabled")
            return None

        try:
            import spotipy
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

    # ── Public API ───────────────────────────────────────────────────────────

    async def search_tracks(self, query: str, limit: int = 10) -> list[dict]:
        """Search Spotify for tracks matching *query* and return structured metadata."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._search_tracks_sync, query, limit,
        )

    async def enrich(self, *, isrc: str | None = None,
                     title: str | None = None,
                     artist: str | None = None) -> dict:
        """Return Spotify audio‑features dict or {} on failure / no creds."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._enrich_sync, isrc, title, artist,
        )

    # ── Private implementation ───────────────────────────────────────────────

    def _enrich_sync(self, isrc: str | None,
                     title: str | None, artist: str | None) -> dict:
        sp = self._get_client()
        if sp is None:
            return {}

        try:
            track_id = self._find_track(sp, isrc, title, artist)
            if not track_id:
                logger.info("No Spotify match found", isrc=isrc, title=title, artist=artist)
                return {}

            features = sp.audio_features([track_id])
            if not features or not features[0]:
                return {}

            f = features[0]
            return {
                "spotify_track_id": track_id,
                "danceability": f.get("danceability"),
                "energy": f.get("energy"),
                "valence": f.get("valence"),
                "acousticness": f.get("acousticness"),
                "instrumentalness": f.get("instrumentalness"),
                "speechiness": f.get("speechiness"),
                "liveness": f.get("liveness"),
                "tempo": f.get("tempo"),
                "loudness": f.get("loudness"),
                "duration_ms": f.get("duration_ms"),
                "time_signature": f.get("time_signature"),
                "mode": f.get("mode"),          # 0 = minor, 1 = major
                "key": f.get("key"),            # Pitch‑class
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
                # Extract ISRC from external_ids
                external_ids = item.get("external_ids", {})
                isrc = external_ids.get("isrc")

                tracks.append({
                    "spotify_id": item["id"],
                    "title": item["name"],
                    "artist": artists,
                    "album": album.get("name", ""),
                    "cover_url": cover,
                    "isrc": isrc,
                    "preview_url": item.get("preview_url"),
                    "duration_ms": item.get("duration_ms"),
                    "popularity": item.get("popularity"),
                })
            return tracks
        except Exception as e:
            logger.error("Spotify search failed", error=str(e))
            return []

    @staticmethod
    def _find_track(sp, isrc, title, artist) -> str | None:
        """Try ISRC lookup first, then fall back to title+artist search."""
        # 1. ISRC lookup (most precise)
        if isrc:
            try:
                results = sp.search(q=f"isrc:{isrc}", type="track", limit=1)
                items = results.get("tracks", {}).get("items", [])
                if items:
                    return items[0]["id"]
            except Exception:
                pass  # fall through

        # 2. Title + artist text search
        if title:
            query = f"track:{title}"
            if artist:
                query += f" artist:{artist}"
            try:
                results = sp.search(q=query, type="track", limit=1)
                items = results.get("tracks", {}).get("items", [])
                if items:
                    return items[0]["id"]
            except Exception:
                pass

        return None
