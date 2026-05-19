from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import structlog

from app.services.audio_service import AudioAnalysisService
from app.services.acr_service import ACRCloudService
from app.services.storage_service import StorageService

logger = structlog.get_logger()
router = APIRouter()


class AnalyzeRequest(BaseModel):
    job_id: str
    s3_key: str
    s3_url: str


@router.post("/analyze")
async def analyze_audio(req: AnalyzeRequest, request: Request):
    log = logger.bind(job_id=req.job_id)
    log.info("Starting audio analysis")

    storage = StorageService()
    audio_path = await storage.download_from_s3(req.s3_key, req.job_id)

    try:
        audio_service = AudioAnalysisService()
        audio_features = await audio_service.analyze(audio_path)

        acr_service = ACRCloudService()
        song_info = await acr_service.identify(audio_path)

        yamnet = request.app.state.yamnet
        yamnet_result = await yamnet.classify(audio_path)

        result = {
            "job_id": req.job_id,
            "song": song_info,
            "audio": audio_features,
            "yamnet": yamnet_result,
        }

        log.info("Analysis complete", bpm=audio_features.get("bpm"), mood=audio_features.get("mood"))
        return result

    except Exception as e:
        log.error("Analysis failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        storage.cleanup(audio_path)
