# 🎵 Beatzy Quick Start Guide

## 🚀 Starting the Application

### Option 1: Using the Startup Script (Recommended)

```bash
./start-dev.sh
```

This will:
- Kill any existing processes on ports 3001 and 5173
- Start the backend on port 3001
- Start the frontend on port 5173

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` error:

**For Backend (port 3001):**
```bash
fuser -k 3001/tcp
```

**For Frontend (port 5173):**
```bash
fuser -k 5173/tcp
```

### Frontend Still Shows Old Design

The issue is Vite's aggressive CSS cache. Follow these steps:

**1. Clear Vite Cache:**
```bash
cd frontend
rm -rf node_modules/.vite dist
```

**2. Restart Frontend:**
```bash
npm run dev
```

**3. Clear Browser Cache:**
- Open DevTools (`F12`)
- Go to **Application** tab → **Storage** → **"Clear site data"**
- Go to **Network** tab → Check **"Disable cache"**
- Hard refresh: `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)

**4. Verify CSS is Updated:**
- Open `http://localhost:5173` in browser
- `F12` → **Sources** tab → find `index.css`
- Search for `#ff2e97` (new magenta color)
- If you still see `#d7ff5a` (old lime), repeat steps 1-3

---

## 🎨 What You Should See

Once the cache clears, you'll see:

1. **Dark midnight purple background** (`#0a0613`)
2. **Magenta accents** (`#ff2e97`) on buttons, brand logo, highlights
3. **9 floating artist portraits** at screen edges with subtle opacity (0.16)
4. **Mouse parallax** — move mouse and portraits shift based on depth
5. **3D ambient objects** — spinning vinyl, cube, glowing orbs (very subtle)
6. **Animated gradient mesh** — radial blobs of magenta/violet/cyan

---

## 📍 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api-docs

---

## 🔧 Dependencies Check

Ensure all services are running:

- **PostgreSQL:** Port 5433
- **Redis:** Port 6379
- **MinIO:** Port 9000

Start services with:
```bash
docker-compose up -d postgres redis minio
```

---

## 🎯 New Design Features

### Color Palette
- **Base:** `#0a0613` → `#0c0818` → `#0f0a20` (midnight surfaces)
- **Primary Accent:** `#ff2e97` (electric magenta)
- **Secondary:** `#9d4edd` (bright violet)
- **Tertiary:** `#22d3ee` (aqua cyan)
- **Accent:** `#ffb347` (warm amber)

### Components Added
1. **FloatingArtists.jsx** — 9 artist portraits with mouse parallax
2. **Ambient3D.jsx** — 3D floating music objects (vinyl, cube, orbs)

### CSS Updates
- Artist gallery layer with depth-based parallax
- 3D object system with floating animations
- Enhanced gradient mesh background
- Updated all brand colors from lime to magenta

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] No console errors in browser DevTools
- [ ] Magenta colors visible (not lime green)
- [ ] Artist portraits visible and moving with mouse
- [ ] 3D objects floating in background
- [ ] Smooth animations and transitions

---

## 📝 Notes

- The frontend runs on Vite for hot module replacement
- The backend uses nodemon for auto-restart on changes
- All artist images are in `frontend/public/artists/`
- CSS is in `frontend/src/index.css`
- If changes don't appear, always clear Vite cache first

---

## 🆘 Need Help?

1. Check browser console for errors (`F12` → Console)
2. Check terminal output for server errors
3. Verify all environment variables are set correctly
4. Ensure Docker services are running
5. Try clearing all caches and restarting

---

**Last Updated:** June 3, 2026
