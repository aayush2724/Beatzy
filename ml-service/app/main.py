from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog

from app.routes import analyze
from app.services.yamnet_service import YAMNetService

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading YAMNet model...")
    app.state.yamnet = YAMNetService()
    await app.state.yamnet.load()
    logger.info("YAMNet model loaded")
    yield
    logger.info("ML service shutting down")


app = FastAPI(
    title="Beatzy ML Service",
    description="Audio analysis: tempo, mood, energy, YAMNet classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="", tags=["Analysis"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "beatzy-ml"}
