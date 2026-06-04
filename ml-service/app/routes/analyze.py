from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
import structlog

from app.services.audio_service import AudioAnalysisService
from app.services.audd_service import AuddService
from app.services.spotify_service import SpotifyService
from app.services.storage_service import StorageService
from app.services.lyrics_service import LyricsService

logger = structlog.get_logger()
router = APIRouter()


# ── Spotify Search ────────────────────────────────────────────────────────────

@router.get("/spotify/search")
async def spotify_search(
    q: str = Query(..., min_length=1, description="Search query (song name, artist, etc.)"),
    limit: int = Query(10, ge=1, le=20, description="Max results to return"),
):
    """Search Spotify for tracks by name/artist and return metadata + preview URLs."""
    service = SpotifyService()
    tracks = await service.search_tracks(q, limit)
    return {"success": True, "data": tracks}


class AnalyzeRequest(BaseModel):
    job_id: str
    s3_key: str
    s3_url: str
    original_filename: str | None = None


class AnalyzeResponse(BaseModel):
    """Typed response for the /analyze endpoint."""
    job_id: str
    song: dict
    audio: dict
    yamnet: dict
    spotify: dict | None
    lyrics: str | None


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_audio(req: AnalyzeRequest, request: Request):
    log = logger.bind(job_id=req.job_id)
    log.info("Starting audio analysis")

    storage = StorageService()
    audio_path = await storage.download_from_s3(req.s3_key, req.job_id)

    try:
        # Core audio features (BPM, mood via ML model, energy, MFCCs, key …)
        audio_service = AudioAnalysisService()
        audio_features = await audio_service.analyze(audio_path)

        # --- AudD Song Identification ---
        audd_service = AuddService()
        song_info = await audd_service.identify(audio_path)

        # --- Local Filename Fallback (if AudD fails / no API key) ---
        if not song_info or not song_info.get("title"):
            filename = req.original_filename or ""
            clean_name = filename.replace(".mp3", "").replace(".wav", "").replace(".m4a", "").replace("_", " ")
            if "-" in clean_name:
                parts = clean_name.split("-", 1)
                song_info = {"artist": parts[0].strip(), "title": parts[1].strip(), "isrc": None}
            elif clean_name.strip():
                song_info = {"artist": "", "title": clean_name.strip(), "isrc": None}
            if song_info:
                logger.info("Used local filename fallback", extracted=song_info)
        # ---------------------------------

        # YAMNet classification
        yamnet = request.app.state.yamnet
        yamnet_result = await yamnet.classify(audio_path)

        # Spotify enrichment
        spotify_service = SpotifyService()
        spotify_features = await spotify_service.enrich(
            isrc=song_info.get("isrc"),
            title=song_info.get("title"),
            artist=song_info.get("artist"),
        )

        # FETCH LYRICS
        lyrics_service = LyricsService()
        lyrics = await lyrics_service.fetch_lyrics(
            artist=song_info.get("artist"),
            title=song_info.get("title")
        )

        result = {
            "job_id": req.job_id,
            "song": song_info,
            "audio": audio_features,
            "yamnet": yamnet_result,
            "spotify": spotify_features,
            "lyrics": lyrics,
        }

        log.info(
            "Analysis complete",
            bpm=audio_features.get("bpm"),
            mood=audio_features.get("mood"),
            mood_confidence=audio_features.get("mood_confidence"),
            spotify_match=bool(spotify_features),
        )
        return result

    except Exception as e:
        log.error("Analysis failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        storage.cleanup(audio_path)
