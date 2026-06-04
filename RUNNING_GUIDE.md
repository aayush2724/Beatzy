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

### Production storage (Cloudflare R2) — required for live uploads

Render (backend) and Hugging Face (ML) **must use the same bucket**. Local MinIO will not work across hosts.

1. Create an R2 bucket named `beatzy-audio` in the Cloudflare dashboard.
2. Create an API token with Object Read & Write for that bucket.
3. Set on **both** Render and Hugging Face (Secrets):

| Variable | Example |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | R2 access key id |
| `AWS_SECRET_ACCESS_KEY` | R2 secret |
| `AWS_S3_BUCKET` | `beatzy-audio` |
| `AWS_S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `AWS_REGION` | `auto` |

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
- ✨ Premium glassmorphism panels
- 🎨 Sonic-lime (#D7FF5A), prism-violet (#8B5CF6), neon-cyan (#00F5FF) accents
- 🌌 Fixed gradient-mesh backgrounds
- 🎭 Pure CSS visuals (no external image dependencies)
- 🎯 Tailwind 4 CSS-first design system

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
- ✅ Glass-styled components throughout
- ✅ No double-brace JSX leaks

**Remaining work**: 7 app pages (Dashboard, Admin, Upload, Results, History, ApiKeys, Profile) still need glass theme updates.

---

## 🎯 Recommended: Start with Frontend Only

For the quickest way to see the new UI:

```bash
cd /home/aayush27/Documents/Projects/Beatzy/frontend
npm install
npm run dev
```

Then visit http://localhost:5173 to explore the redesigned interface!
