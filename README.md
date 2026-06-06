<p align="center">
  <img src="docs/logo.svg" alt="Beatzy Logo" width="200" />
</p>

<h1 align="center">Beatzy — Music Intelligence Engine</h1>

<p align="center">
  <strong>A production-grade, Shazam-inspired platform for song identification, deep AI audio analysis, and SaaS API access.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=flat-square&logo=kubernetes" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  <a href="https://beatzy-zeta.vercel.app"><img src="https://img.shields.io/badge/🎵_Live_Demo-beatzy--zeta.vercel.app-D7FF5A?style=for-the-badge" alt="Live Demo" /></a>
</p>

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend** | [beatzy-zeta.vercel.app](https://beatzy-zeta.vercel.app) |
| **Backend API** | [beatzy-tvrl.onrender.com](https://beatzy-tvrl.onrender.com) |
| **ML Service** | [aayush-27-beatzy-ml.hf.space](https://aayush-27-beatzy-ml.hf.space) |
| **API Docs** | [beatzy-tvrl.onrender.com/api/docs](https://beatzy-tvrl.onrender.com/api/docs) |

> **Note:** The platform now features a high-performance **Audio Control Center** with real-time spectral decoding, chord synchronization, and beat-reactive visuals.

---

## ✨ Advanced Features

| Category | Capability |
|----------|-----------|
| 🎵 **Real-time Identification** | Fingerprinting with AcoustID + iTunes fallback and debounced song suggestions |
| 🧠 **Neural Control Center** | Playback engine with live chord tracking, spectral stability metering, and neural phase sync |
| 🔊 **Hybrid ML Analysis** | Tempo, mood (XGBoost), energy, and YAMNet neural event classification (527 labels) |
| 📊 **Pro Dashboard** | Recharts analytics, spectral DNA mapping, and interactive force-directed artist echoes |
| 🛡️ **Admin Terminal** | Telemetry overview, user directory, and automated audit security logs |
| 🔑 **SaaS API** | Tiered API key system with rate limiting per plan and automated documentation |
| 💳 **Stripe Billing** | Full subscription lifecycle with checkout, webhooks, and customer portal |
| 🔐 **Enterprise Auth** | JWT + refresh token rotation + Google OAuth 2.0 integration |
| ⚡ **Real-time Engine** | Socket.IO for live spectral upload progress and job orchestration |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph CLIENT["Client Layer"]
        FE["React + Vite SPA<br/><i>Zustand · Recharts · Framer Motion</i>"]
    end

    subgraph API["API Gateway — Node.js / Express"]
        AUTH["Auth<br/><i>JWT + OAuth</i>"]
        UPLOAD["Upload<br/><i>Multer + S3</i>"]
        JOBS["Jobs<br/><i>BullMQ Queue</i>"]
        RESULTS["Results<br/><i>Cached via Redis</i>"]
        BILLING["Billing<br/><i>Stripe</i>"]
        KEYS["API Keys<br/><i>Rate Limited</i>"]
        ADMIN["Admin<br/><i>Stats · Audit</i>"]
        SWAGGER["Swagger UI<br/><i>/api/docs</i>"]
    end

    subgraph ML["ML Service — Python / FastAPI"]
        LIBROSA["librosa<br/><i>BPM · Energy · Key</i>"]
        YAMNET["YAMNet<br/><i>Event Classification</i>"]
        ACOUSTID["AcoustID<br/><i>Fingerprint Matching</i>"]
        MOOD["Mood Classifier<br/><i>XGBoost</i>"]
        WAVEFORM["Waveform<br/><i>Amplitude Envelope</i>"]
    end

    subgraph DATA["Data Layer"]
        PG[("PostgreSQL 16")]
        REDIS[("Redis 7")]
        S3[("AWS S3")]
    end

    subgraph INFRA["Infrastructure"]
        DOCKER["Docker Compose<br/><i>Development</i>"]
        K8S["Kubernetes<br/><i>Production</i>"]
        CI["GitHub Actions<br/><i>CI/CD</i>"]
    end

    FE -->|HTTPS / WS| API
    AUTH --> PG
    UPLOAD --> S3
    JOBS --> REDIS
    RESULTS --> REDIS
    RESULTS --> PG
    BILLING -->|Webhooks| PG

    API -->|BullMQ Job| ML
    LIBROSA --> S3
    ACOUSTID --> S3

    ML -->|Results| PG

    style CLIENT fill:#1a1a2e,stroke:#D7FF5A,color:#fff
    style API fill:#16213e,stroke:#D7FF5A,color:#fff
    style ML fill:#0f3460,stroke:#8B5CF6,color:#fff
    style DATA fill:#1a1a2e,stroke:#D7FF5A,color:#fff
    style INFRA fill:#1a1a2e,stroke:#555,color:#aaa
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Zustand, TailwindCSS, Recharts, Framer Motion, Socket.IO Client, Three.js |
| **Backend** | Node.js 20, Express, BullMQ, Socket.IO, Swagger UI |
| **ML Service** | Python 3.11, FastAPI, librosa, TensorFlow (YAMNet), Scikit-learn (XGBoost), AcoustID |
| **Database** | PostgreSQL 16 |
| **Cache / Queue** | Redis 7 |
| **Storage** | AWS S3 / MinIO |
| **Auth** | JWT (access + refresh rotation) + Google OAuth 2.0 |
| **Payments** | Stripe (Checkout, Webhooks, Billing Portal) |
| **Deployment** | Docker Compose (dev) · Kubernetes + Kustomize (prod) |

---

## 📚 API Endpoints

### Backend API (`/api`)

#### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/refresh` | Refresh JWT tokens (rotation) |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/logout` | Logout (invalidate refresh token) |

#### Audio

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audio/upload` | Upload audio file for analysis |
| `POST` | `/api/audio/upload-batch` | Upload multiple files (batch processing) |
| `POST` | `/api/audio/analyze-url` | Analyze a remote audio URL |
| `GET` | `/api/audio/jobs/{jobId}` | Get job status |
| `DELETE` | `/api/audio/jobs/{jobId}` | Delete a job |
| `GET` | `/api/audio/history` | Get user analysis history (with filters) |
| `GET` | `/api/audio/search` | Search songs via Spotify/iTunes |

#### Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/results/{jobId}` | Get analysis results for a job |
| `GET` | `/api/results` | List all user results (max 100) |

#### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/keys` | List all API keys |
| `POST` | `/api/keys` | Generate a new API key (Pro/Enterprise) |
| `DELETE` | `/api/keys/{id}` | Revoke an API key |

#### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/billing/plans` | List subscription plans |
| `POST` | `/api/billing/subscribe` | Create Stripe checkout session |
| `GET` | `/api/billing/subscription` | Get current subscription status |
| `POST` | `/api/billing/portal` | Open Stripe billing portal |
| `POST` | `/api/billing/webhook` | Stripe webhook endpoint |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/me` | Get detailed user profile |
| `PATCH` | `/api/users/me` | Update user name |
| `PATCH` | `/api/users/me/password` | Change password |
| `GET` | `/api/users/usage` | Get 30-day usage breakdown |

#### Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/library/favorites` | Get favorite jobs |
| `POST` | `/api/library/favorites/{jobId}` | Add job to favorites |
| `DELETE` | `/api/library/favorites/{jobId}` | Remove from favorites |
| `GET` | `/api/library/collections` | List user collections |
| `POST` | `/api/library/collections` | Create a collection |
| `POST` | `/api/library/collections/{id}/items` | Add item to collection |
| `POST` | `/api/library/share/{jobId}` | Share a job (get shareable URL) |
| `DELETE` | `/api/library/share/{jobId}` | Disable sharing |

#### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users (admin only) |
| `GET` | `/api/admin/users/{id}` | Get single user detail |
| `PATCH` | `/api/admin/users/{id}` | Update user flags |
| `GET` | `/api/admin/stats` | Platform-wide KPIs |
| `GET` | `/api/admin/audit-log` | Paginated audit log |

#### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/r/{shareToken}` | Get shared analysis result |
| `GET` | `/api/public/status` | Service health check |

### ML Service API (`/`)

#### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Full audio analysis (BPM, mood, YAMNet, Spotify enrichment) |
| `GET` | `/spotify/search` | Search tracks by name/artist |

#### Waveform

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/waveform` | Generate amplitude envelope for visualization |

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended)
- Node.js 20+ and Python 3.11+ (for manual setup)

### Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/aayush2724/Beatzy.git
cd Beatzy

# 2. Configure environment
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your API keys (AcoustID, Spotify, Stripe, AWS, etc.)

# 3. Launch all services
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| ML Service | http://localhost:8000 |
| ML Docs (FastAPI) | http://localhost:8000/docs |

---

## ☸️ Kubernetes Deployment

Production manifests are in the `k8s/` directory with Kustomize support.

```bash
# Apply all manifests
kubectl apply -k k8s/
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/aayush2724">Aayush</a>
</p>