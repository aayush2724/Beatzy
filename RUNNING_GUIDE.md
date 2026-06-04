# 🚀 Beatzy — Running Guide

## Quick Start (Recommended)

The easiest way to run Beatzy is using **Docker Compose**, which handles all services automatically.

### Prerequisites
- Docker and Docker Compose installed
- Ports available: 5173 (frontend), 3000 (backend), 8000 (ML service), 5433 (postgres), 6379 (redis), 9000-9001 (minio)

### Option 1: Full Stack with Docker (Recommended)

```bash
# 1. Navigate to project root
cd /home/aayush27/Documents/Projects/Beatzy

# 2. Start all services (postgres, redis, minio, backend, ml-service, frontend)
docker-compose up -d

# 3. Watch logs (optional)
docker-compose logs -f

# 4. Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# ML Service: http://localhost:8000
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

# 5. Stop all services
docker-compose down
```

---

## Option 2: Development Mode (Frontend Only)

If you just want to test the **new UI design** without backend services:

```bash
# 1. Navigate to frontend directory
cd /home/aayush27/Documents/Projects/Beatzy/frontend

# 2. Install dependencies (IMPORTANT - do this first!)
npm install

# 3. Start the dev server
npm run dev

# 4. Open browser
# Frontend: http://localhost:5173
```

**Note**: Without backend, you can view the design but features like login, upload, etc. won't work.

---

## Option 3: Full Stack Manual (Development)

If you want to run everything manually for development:

### Step 1: Start Infrastructure Services

```bash
# Start postgres, redis, and minio only
docker-compose up -d postgres redis minio minio-create-bucket
```

### Step 2: Start Backend

```bash
cd /home/aayush27/Documents/Projects/Beatzy/backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start backend dev server
npm run dev
```

### Step 3: Start ML Service

```bash
cd /home/aayush27/Documents/Projects/Beatzy/ml-service

# Install dependencies (if running locally)
pip install -r requirements.txt

# Start ML service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 4: Start Frontend

```bash
cd /home/aayush27/Documents/Projects/Beatzy/frontend

# Install dependencies (IMPORTANT!)
npm install

# Start frontend dev server
npm run dev
```

### Access Points:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **ML Service**: http://localhost:8000
- **Swagger Docs**: http://localhost:3000/api-docs

---

## 🔧 Important: Install Frontend Dependencies First!

Before running the frontend, you **MUST** install dependencies:

```bash
cd /home/aayush27/Documents/Projects/Beatzy/frontend
npm install
```

This installs:
- React 19
- React Router 7
- Tailwind CSS 4
- Vite 6
- All other updated dependencies

**If you see build errors**, delete `node_modules` and `package-lock.json`, then run `npm install` again:

```bash
cd /home/aayush27/Documents/Projects/Beatzy/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Environment Variables

Make sure you have the required environment variables set. The app looks for:

### Frontend (.env or runtime)
```bash
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://beatzy:beatzy_secret@localhost:5433/beatzy
REDIS_URL=redis://:redis_secret@localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# AWS/MinIO (for file storage)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=beatzy-audio
AWS_S3_ENDPOINT=http://localhost:9000

# External APIs (optional for full functionality)
ACOUSTID_API_KEY=your_acoustid_api_key
STRIPE_SECRET_KEY=your_stripe_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

### Production storage (Supabase S3 / R2 / MinIO) — required for live uploads

Render (backend) and Hugging Face (ML) **must use the same bucket**. Local MinIO will not work across hosts. **Path-style addressing** is required (configured in code).

**Supabase example:**

| Variable | Example |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | Supabase S3 access key |
| `AWS_SECRET_ACCESS_KEY` | Supabase S3 secret |
| `AWS_S3_BUCKET` | `beatzy-audio` |
| `AWS_S3_ENDPOINT` | `https://<project>.supabase.co/storage/v1/s3` |
| `AWS_REGION` | `ap-southeast-2` (match your project) |

Processed audio is **deleted from the bucket after analysis** to stay under free-tier limits.

4. Redeploy backend and ML Space after saving secrets.
5. Verify: upload a track on https://beatzy-zeta.vercel.app — job should complete without `FileNotFoundError` in ML logs.

See also `README.md` → Production environment variables.

---

## 🎨 Viewing the New UI Design

To see the **premium glassmorphism redesign** that was just completed:

1. **Install dependencies** (critical step!):
   ```bash
   cd frontend
   npm install
   ```

2. **Start frontend**:
   ```bash
   npm run dev
   ```

3. **Visit these pages** to see the new design:
   - **Landing**: http://localhost:5173/
   - **Login**: http://localhost:5173/login
   - **Register**: http://localhost:5173/register
   - **Pricing**: http://localhost:5173/pricing
   - **Artist Echoes**: http://localhost:5173/artist-echoes

All pages now feature:
- Premium glassmorphism panels on `#050505`
- Monochrome accents (white / silver / gray)
- Subtle radial backgrounds (no neon pink/purple/cyan)
- Pure CSS visuals (no external image dependencies)
- Tailwind 4 CSS-first design system

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5174
```

### Docker issues
```bash
# Stop all containers
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v

# Rebuild containers
docker-compose up --build
```

### Tailwind classes not working
- Make sure you installed dependencies (`npm install`)
- Check that `frontend/src/index.css` was updated with the new Tailwind 4 system
- Verify `frontend/postcss.config.js` has `@tailwindcss/postcss`
- Ensure `frontend/tailwind.config.js` is DELETED (Tailwind 4 is CSS-first)

---

## 📦 What Was Updated

The UI makeover included:
- ✅ Complete Tailwind 4 migration (CSS-first)
- ✅ All dependencies updated to valid versions
- ✅ Premium glassmorphism theme
- ✅ All external image hotlinks removed
- ✅ Fixed navbar duplicate link bug
- ✅ Glass-styled components throughout (all app pages + auth + pricing + billing)
- ✅ Monochrome theme (neon palette removed)
- ✅ No double-brace JSX leaks

**Post-deploy checklist** (manual, not code):
1. Hugging Face Space → **Factory rebuild** so `/health` includes `storage` and fpcalc is present
2. Render → redeploy latest `main` after push
3. Live test on https://beatzy-zeta.vercel.app — upload a known track and confirm full Results

---

## Phase A — Production fixes

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client
2. **Authorized redirect URI:** `https://<your-backend>/api/auth/google/callback` (local: `http://localhost:3000/api/auth/google/callback`)
3. Set on Render (backend):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `BACKEND_URL=https://<your-backend-host>`
   - `FRONTEND_URL=https://<your-frontend-host>`
4. Backend now calls `passport.initialize()` — required for Google sign-in to work.

### Sync ML service to Hugging Face

```bash
export HF_SPACE_REPO=your-username/beatzy-ml
pip install huggingface_hub
cd ml-service && huggingface-cli upload "$HF_SPACE_REPO" . . --repo-type space
```

Or use `scripts/sync-ml-to-hf.sh` after setting `HF_SPACE_REPO`.

Verify storage after rebuild:

```bash
curl -s https://<space>.hf.space/health | jq '.storage'
# Expect: "reachable": true
```

Set `ML_SERVICE_URL` on the backend to your Space URL. Use path-style S3 / R2 env vars documented in `ml-service/.env.example`.

---

## 🎯 Recommended: Start with Frontend Only

For the quickest way to see the new UI:

```bash
cd /home/aayush27/Documents/Projects/Beatzy/frontend
npm install
npm run dev
```

Then visit http://localhost:5173 to explore the redesigned interface!
