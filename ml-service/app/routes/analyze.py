from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
import structlog

from app.services.audio_service import AudioAnalysisService
from app.services.acr_service import ACRCloudService
from app.services.spotify_service import SpotifyService
from app.services.storage_service import StorageService

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


class AnalyzeResponse(BaseModel):
    """Typed response for the /analyze endpoint."""
    job_id: str
    song: dict
    audio: dict
    yamnet: dict
    spotify: dict


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

        # ACRCloud song identification
        acr_service = ACRCloudService()
        song_info = await acr_service.identify(audio_path)

        # YAMNet classification
        yamnet = request.app.state.yamnet
        yamnet_result = await yamnet.classify(audio_path)

        # Spotify enrichment (ISRC from ACRCloud → audio‑features)
        spotify_service = SpotifyService()
        spotify_features = await spotify_service.enrich(
            isrc=song_info.get("isrc"),
            title=song_info.get("title"),
            artist=song_info.get("artist"),
        )

        result = {
            "job_id": req.job_id,
            "song": song_info,
            "audio": audio_features,
            "yamnet": yamnet_result,
            "spotify": spotify_features,
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
