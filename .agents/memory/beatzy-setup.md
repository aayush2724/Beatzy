---
name: Beatzy Replit setup decisions
description: Key decisions for running Beatzy's 3-service architecture on Replit without Redis/S3/MinIO
---

# Beatzy Replit Infrastructure Decisions

## Services and ports
- Frontend (Vite/React): port 5000 — webview workflow, `cd frontend && npm run dev`
- Backend (Node/Express): port 3000 — console workflow, `cd backend && npm start`
- ML Service (FastAPI): port 8000 — console workflow, `cd ml-service && uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Redis: in-memory fallback
- `backend/src/db/redis.js` tries Redis for 2s then uses in-memory Map-based mock
- BullMQ (`queue.js`) uses `enableOfflineQueue: false, maxRetriesPerRequest: 0, lazyConnect: true` to prevent reconnection spam
- `initQueue()` races with 2s timeout then calls `q.close()` on failure to clean up ioredis connection
- Jobs processed inline via `processJobDirectly()` in `queue.js` when Redis unavailable
- Worker (`analysisWorker.js`) only started if `redisAvailable === true`

**Why:** Replit doesn't provide Redis; BullMQ spams ECONNREFUSED without these settings

## Storage: local filesystem fallback  
- `backend/src/services/storage.js`: saves to `/tmp/beatzy-audio/<s3_key>` when `AWS_ACCESS_KEY_ID` not set
- `ml-service/app/services/storage_service.py`: checks `LOCAL_STORAGE_DIR/<s3_key>` if S3 not configured
- Both use `/tmp/beatzy-audio/` as shared directory (same container = same filesystem)

**Why:** S3/MinIO not available; local /tmp shared between all services on same Replit machine

## TensorFlow: stub mode
- Removed `tensorflow==2.15.0` and `tensorflow-hub==0.15.0` from `ml-service/requirements.txt` (too heavy)
- YAMNet service already has `try/except` fallback returning stub labels
- Mood model falls back to rule-based inference when `.joblib` not found

**Why:** TensorFlow is ~500MB and causes OOM/install failure on Replit free tier

## CORS
- Backend: `origin: process.env.NODE_ENV !== 'production' ? true : FRONTEND_URL` — reflects any origin in dev
- ML Service: already uses `ALLOWED_ORIGINS=*` env var

## Database
- Replit PostgreSQL provisioned; `DATABASE_URL` auto-set by Replit
- All 6 migrations (001-006) applied via `executeSql`
- Backend uses `process.env.DATABASE_URL` directly — no .env override needed

## ACRCloud / Spotify
- Without credentials: song identification returns empty dict (graceful)
- Analysis still works: BPM, key, energy, mood, spectral features all from librosa
