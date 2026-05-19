# Beatzy — Music Intelligence Engine

A production-grade, Shazam-inspired platform that identifies songs and performs deep AI-based audio analysis.

## Features

- **Song Identification** via ACRCloud audio fingerprinting
- **Deep Audio Analysis**: BPM, energy, mood/emotion, audio event classification (YAMNet)
- **SaaS API** with tiered plans, API keys, and rate limiting
- **Stripe Subscriptions** for monetization
- **JWT + Google OAuth** authentication
- **Real-time waveform visualization**
- **Dashboard** with historical analysis

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│              React + Vite (Vite Dev Server / CDN)                │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────────────┐
│                     API GATEWAY (Node.js/Express)                │
│   Auth │ Upload │ Jobs │ Results │ Billing │ API Keys            │
└────┬─────────┬──────────┬──────────┬────────────────────────────┘
     │         │          │          │
  PostgreSQL  Redis      AWS S3    BullMQ Queue
                                     │
              ┌──────────────────────▼────────────────────────────┐
              │               ML Service (Python/FastAPI)          │
              │     librosa │ YAMNet │ ACRCloud Integration        │
              └───────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, TailwindCSS |
| Backend | Node.js, Express, BullMQ |
| ML Service | Python, FastAPI, librosa, TensorFlow (YAMNet) |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | AWS S3 |
| Auth | JWT + Google OAuth 2.0 |
| Payments | Stripe |
| Deployment | Docker + Kubernetes |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### Local Development

```bash
# Clone the repo
git clone https://github.com/aayush2724/Beatzy.git
cd Beatzy

# Copy env files
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **ML Service**: http://localhost:8000
- **API Docs (ML)**: http://localhost:8000/docs

### Manual Setup (without Docker)

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Folder Structure

```
beatzy/
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── api/               # Axios API clients
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── store/             # Zustand state management
│   │   └── hooks/             # Custom React hooks
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
├── backend/                   # Node.js API Gateway
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, rate limit, validation
│   │   ├── models/            # DB models (pg)
│   │   ├── workers/           # BullMQ job workers
│   │   └── index.js           # Entry point
│   ├── migrations/            # SQL migration files
│   └── package.json
│
├── ml-service/                # Python FastAPI ML Service
│   ├── app/
│   │   ├── routes/            # FastAPI routers
│   │   ├── services/          # Analysis logic
│   │   └── main.py            # Entry point
│   ├── models/                # Pre-downloaded ML models
│   └── requirements.txt
│
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## API Reference

### Authentication
```
POST /api/auth/register       - Register new user
POST /api/auth/login          - Login with email/password
GET  /api/auth/google         - Google OAuth redirect
POST /api/auth/refresh        - Refresh JWT
```

### Audio
```
POST /api/audio/upload        - Upload audio file
GET  /api/audio/jobs/:id      - Get job status
GET  /api/audio/results/:id   - Get analysis results
GET  /api/audio/history       - Get user's history
```

### API Keys (SaaS)
```
GET  /api/keys                - List API keys
POST /api/keys                - Generate new key
DELETE /api/keys/:id          - Revoke key
```

### Billing
```
GET  /api/billing/plans       - List subscription plans
POST /api/billing/subscribe   - Create subscription
POST /api/billing/webhook     - Stripe webhook
```

## Subscription Plans

| Plan | Price | Requests/mo | Features |
|------|-------|-------------|----------|
| Free | $0 | 100 | Basic analysis |
| Pro | $19/mo | 5,000 | Full analysis + API |
| Enterprise | $99/mo | Unlimited | Priority + SLA |

## License

MIT
