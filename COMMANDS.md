# 🎵 Quick Command Reference

## Kill Ports (if needed)

```bash
# Kill backend port
fuser -k 3001/tcp

# Kill frontend port
fuser -k 5173/tcp

# Kill both
fuser -k 3001/tcp 5173/tcp
```

## Start Servers

**Backend (Terminal 1):**
```bash
cd ~/Documents/Projects/Beatzy/backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd ~/Documents/Projects/Beatzy/frontend
npm run dev
```

## Clear Caches (if design doesn't update)

**Clear Vite Cache:**
```bash
cd ~/Documents/Projects/Beatzy/frontend
rm -rf node_modules/.vite dist
```

**Clear Browser:**
- `F12` → Application → Storage → "Clear site data"
- `Ctrl+Shift+R` (hard refresh)

## Check What's Running

```bash
# Check processes on ports
netstat -tuln | grep -E "3001|5173"

# Check Node processes
ps aux | grep node
```

## Docker Services (if needed)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Quick Restart Everything

```bash
# Kill all ports
fuser -k 3001/tcp 5173/tcp

# Start backend (in one terminal)
cd ~/Documents/Projects/Beatzy/backend && npm run dev

# Start frontend (in another terminal)
cd ~/Documents/Projects/Beatzy/frontend && npm run dev
```

---

**Current Status:**
- ✅ Backend port 3001 - cleared
- ✅ Landing.jsx - recreated
- ✅ CSS - updated with gallery styles
- ✅ Vite cache - cleared
- 🎯 Ready to start frontend!
