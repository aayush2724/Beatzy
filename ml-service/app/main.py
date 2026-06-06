from dotenv import load_dotenv

load_dotenv()

# Monkey patch scipy.signal.hann for compatibility with SciPy 1.13+
import scipy.signal
if not hasattr(scipy.signal, "hann"):
    import scipy.signal.windows as windows
    scipy.signal.hann = windows.hann

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from app.routes import analyze
from app.routes.waveform import router as waveform_router
from app.services.yamnet_service import YAMNetService
from app.services.storage_service import check_storage_connectivity

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage_status = check_storage_connectivity()
    app.state.storage_status = storage_status
    if storage_status.get("reachable"):
        logger.info("Storage connectivity OK", **storage_status)
    else:
        logger.warning("Storage connectivity check failed — uploads may fail", **storage_status)

    logger.info("Loading YAMNet model...")
    app.state.yamnet = YAMNetService()
    await app.state.yamnet.load()
    logger.info("YAMNet model loaded")

    # Pre‑load mood classifier so the first request isn't slow
    from app.services.audio_service import _load_mood_model
    _load_mood_model()
    logger.info("Mood classifier ready")

    yield
    logger.info("ML service shutting down")


app = FastAPI(
    title="Beatzy ML Service",
    description="Audio analysis: tempo, mood (ML), energy, YAMNet classification, Spotify enrichment, waveform",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS — whitelist origins from env, fall back to allow‑all in dev ─────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_allowed_origins = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(analyze.router, prefix="", tags=["Analysis"])
app.include_router(waveform_router, prefix="", tags=["Waveform"])


@app.get("/health")
async def health(request: Request):
    storage = getattr(request.app.state, "storage_status", None) or check_storage_connectivity()
    return {
        "status": "ok",
        "service": "beatzy-ml",
        "version": "2.0.0",
        "storage": storage,
    }
