"""
Beatzy — Waveform generation endpoint.

Accepts an S3 key, downloads the audio, generates a downsampled waveform
(amplitude envelope) suitable for frontend rendering, and returns it as JSON.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import asyncio
import numpy as np
import librosa
import structlog

from app.services.storage_service import StorageService

logger = structlog.get_logger()
router = APIRouter()


class WaveformRequest(BaseModel):
    s3_key: str
    job_id: str
    num_points: int = Field(default=200, ge=50, le=2000,
                            description="Number of amplitude samples to return")


class WaveformResponse(BaseModel):
    job_id: str
    num_points: int
    waveform: list[float]
    duration_seconds: float
    sample_rate: int


@router.post("/waveform", response_model=WaveformResponse)
async def generate_waveform(req: WaveformRequest):
    """Generate a downsampled amplitude envelope for frontend visualisation."""
    log = logger.bind(job_id=req.job_id)
    log.info("Generating waveform", num_points=req.num_points)

    storage = StorageService()
    audio_path = await storage.download_from_s3(req.s3_key, req.job_id)

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, _compute_waveform, audio_path, req.num_points, req.job_id,
        )
        return result
    except Exception as e:
        log.error("Waveform generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Waveform generation failed: {str(e)}")
    finally:
        storage.cleanup(audio_path)


def _compute_waveform(audio_path: str, num_points: int, job_id: str) -> dict:
    """Load audio and compute a downsampled RMS amplitude envelope."""
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    # Compute RMS in windows that match the desired number of output points
    hop = max(1, len(y) // num_points)
    rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]

    # Trim or pad to exactly num_points
    if len(rms) > num_points:
        rms = rms[:num_points]
    elif len(rms) < num_points:
        rms = np.pad(rms, (0, num_points - len(rms)), mode="constant")

    # Normalise to 0‑1 range
    max_val = rms.max()
    if max_val > 0:
        rms = rms / max_val

    waveform = [float(round(v, 4)) for v in rms]

    return {
        "job_id": job_id,
        "num_points": num_points,
        "waveform": waveform,
        "duration_seconds": round(duration, 3),
        "sample_rate": sr,
    }
