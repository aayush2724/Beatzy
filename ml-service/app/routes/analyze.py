import asyncio
import os
import subprocess

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
import structlog

from app.services.audio_service import AudioAnalysisService
from app.services.acoustid_service import AcoustIDService
from app.services.spotify_service import SpotifyService
from app.services.itunes_service import iTunesService
from app.services.song_metadata import parse_filename, clean_title
from app.services.storage_service import StorageService
from app.services.lyrics_service import LyricsService

logger = structlog.get_logger()
router = APIRouter()

# Magic bytes for common audio formats
_AUDIO_MAGIC = {
    b'ID3': 'mp3', b'\xff\xfb': 'mp3', b'\xff\xf3': 'mp3', b'\xff\xf2': 'mp3',
    b'RIFF': 'wav', b'OggS': 'ogg', b'fLaC': 'flac',
    b'\x1aE\xdf\xa3': 'm4a', b'ftyp': 'm4a',
}


def _detect_audio_format(path: str) -> str | None:
    """Detect actual audio format from magic bytes instead of filename extension."""
    try:
        with open(path, 'rb') as f:
            header = f.read(12)
        for magic, fmt in _AUDIO_MAGIC.items():
            if header.startswith(magic):
                return fmt
        # WebM starts with 0x1a 0x45 0xdf 0xa3 (EBML header)
        if header[:4] == b'\x1a\x45\xdf\xa3':
            return 'webm'
    except Exception:
        pass
    return None


# ── Spotify Search ────────────────────────────────────────────────────────────

@router.get("/spotify/search")
async def spotify_search(
    q: str = Query(..., min_length=1, description="Search query (song name, artist, etc.)"),
    limit: int = Query(10, ge=1, le=20, description="Max results to return"),
):
    """Search tracks by name/artist; falls back to iTunes when Spotify is blocked."""
    spotify = SpotifyService()
    tracks = await spotify.search_tracks(q, limit)
    if not tracks:
        itunes = iTunesService()
        tracks = await itunes.search_tracks(q, limit)
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
    lyrics: dict | None


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_audio(req: AnalyzeRequest, request: Request):
    log = logger.bind(job_id=req.job_id)
    log.info("Starting audio analysis")

    storage = StorageService()
    try:
        audio_path = await storage.download_from_s3(req.s3_key, req.job_id)
    except FileNotFoundError as e:
        log.error("Storage download failed", s3_key=req.s3_key, error=str(e))
        raise HTTPException(status_code=404, detail=str(e)) from e

    try:
        actual_format = _detect_audio_format(audio_path)
        if actual_format == 'webm' or audio_path.endswith('.webm'):
            wav_path = audio_path.rsplit('.', 1)[0] + '.wav'
            try:
                subprocess.run([
                    'ffmpeg', '-i', audio_path,
                    '-ar', '22050', '-ac', '1', '-y', wav_path
                ], capture_output=True, timeout=30)
                if os.path.exists(wav_path):
                    audio_path = wav_path
                    log.info('Converted webm to wav for analysis')
            except Exception as e:
                log.warning('webm conversion failed, using original', error=str(e))

        # Core audio features (BPM, mood via ML model, energy, MFCCs, key …)
        audio_service = AudioAnalysisService()
        audio_features = await audio_service.analyze(audio_path)

        # --- Song identification: AcoustID (start sample -> mid sample) -> filename -> iTunes ---
        song_info = None
        spotify_features = None
        ext = AcoustIDService.extension_from_path(audio_path)
        real_ext = _detect_audio_format(audio_path) or ext
        pre_sample_bytes = AcoustIDService.read_30s_start_sample(audio_path)
        fallback_sample_bytes = AcoustIDService.read_fingerprint_sample(audio_path)
        acoustid_service = AcoustIDService()
        loop = asyncio.get_event_loop()

        is_mic_recording = req.original_filename in ('live-capture.webm',) or (req.original_filename or '').startswith('recording-')

        # Try AcoustID fingerprinting for all audio (including mic recordings)
        # If someone records a song playing, we can identify it and fetch lyrics
        try:
            song_info = await loop.run_in_executor(
                None,
                acoustid_service.identify_from_start_sample,
                pre_sample_bytes,
                real_ext,
            )
        except Exception as e:
            log.warning("AcoustID start-sample lookup failed", error=str(e))
            song_info = None

        # Fallback: acoustid mid-file sample
        if not song_info:
            try:
                song_info = await loop.run_in_executor(
                    None,
                    acoustid_service.identify_from_bytes,
                    fallback_sample_bytes,
                    real_ext,
                )
            except Exception as e:
                log.warning("AcoustID mid-file lookup failed", error=str(e))
                song_info = None

        # For non-mic recordings, also try filename and iTunes fallbacks
        if not song_info and not is_mic_recording:
            # Fallback: filename parse
            if req.original_filename:
                try:
                    song_info = parse_filename(req.original_filename)
                    if song_info and song_info.get("title"):
                        song_info["title"] = clean_title(song_info["title"])
                    if song_info:
                        log.info("Used local filename fallback", extracted=song_info)
                except Exception as e:
                    log.warning("Filename parse fallback failed", error=str(e))
                    song_info = None

            # Fallback: iTunes search using filename
            if not song_info and req.original_filename:
                basename = os.path.splitext(req.original_filename)[0].replace("_", " ").strip()
                if basename:
                    try:
                        itunes = iTunesService()
                        hit = await itunes.enrich(title=clean_title(basename))
                        if hit:
                            song_info = {
                                "title": hit.get("title"),
                                "artist": hit.get("artist"),
                                "source": "itunes",
                                "isrc": None,
                            }
                            log.info("Used iTunes filename search fallback", extracted=song_info)
                    except Exception as e:
                        log.warning("iTunes filename fallback failed", error=str(e))

        # If no song identified (mic recording of unknown audio), use fallback
        if not song_info:
            song_info = {
                "title": "Live Recording",
                "artist": "Unknown",
                "source": "microphone",
                "isrc": None,
            }
            spotify_features = None

        # YAMNet classification
        yamnet = request.app.state.yamnet
        yamnet_result = await yamnet.classify(audio_path)

        # Spotify enrichment (iTunes fallback when Spotify dev app is restricted)
        spotify_service = SpotifyService()
        if song_info.get("isrc"):
            spotify_features = await spotify_service.enrich(
                isrc=song_info.get("isrc"),
                title=song_info.get("title"),
                artist=song_info.get("artist"),
            )
        if not spotify_features and song_info.get("title") and song_info.get("source") != "microphone":
            itunes = iTunesService()
            itunes_hit = await itunes.enrich(
                title=clean_title(song_info.get("title")),
                artist=song_info.get("artist"),
            )
            if itunes_hit:
                spotify_features = {
                    "spotify_track_id": itunes_hit.get("spotify_id"),
                    "spotify_url": itunes_hit.get("spotify_url"),
                    "cover_url": itunes_hit.get("cover_url"),
                    "preview_url": itunes_hit.get("preview_url"),
                    "title": itunes_hit.get("title"),
                    "artist": itunes_hit.get("artist"),
                    "album": itunes_hit.get("album"),
                    "release_date": itunes_hit.get("release_date"),
                    "duration_ms": itunes_hit.get("duration_ms"),
                    "source": "itunes",
                }

        # Lyrics (after title/artist resolved)
        lyrics = None
        if song_info.get("title") and song_info.get("source") != "microphone":
            try:
                lyrics_service = LyricsService()
                lyrics = await lyrics_service.fetch_lyrics(
                    artist=song_info.get("artist"),
                    title=clean_title(song_info.get("title") or ""),
                )
            except Exception as e:
                log.warning("Lyrics fetch failed", error=str(e))

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
