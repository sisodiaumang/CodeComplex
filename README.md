# CodeComplex

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**CodeComplex** is a premier real-time competitive engineering and coding platform. Developers face off in live multiplayer duels across six distinct engineering domains: Data Structures & Algorithms (DSA), Bug Fixing, Backend API Engineering, Frontend Layout Assembly, Prompt War duels, and Full-stack Projects.

The platform combines Socket.IO real-time state synchronization, WebRTC live voice channels, 3-tier fallback matchmaking (Live Humans → Ghost Opponent Replays → Adaptive AI Bots), hybrid code execution sandboxes (Judge0, local subprocesses, and Docker container runners), AI Vision LLM grading, domain-specific Elo rating ladders, multi-tiered leaderboards, social networks, and automated background maintenance jobs.

---

## 🏗️ Architecture & Project Structure

CodeComplex is structured as a monorepo containing a TypeScript Express API & WebSocket server alongside a Next.js 16 App Router web client, backed by Docker Compose container orchestration.

```
CodeComplex/
├── [backendServer/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer)           # TypeScript Express 5 API & WebSocket Server
│   ├── [src/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src)                 # Application logic & services
│   │   ├── [config/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/config)          # Environment variables & schema validation
│   │   ├── [controllers/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/controllers)     # REST request handlers (Auth, Battle, Admin, Rating, etc.)
│   │   ├── [db/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/db)              # Database connections & category seeding scripts
│   │   ├── [jobs/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/jobs)            # Background cron jobs (stale rooms, token cleanup, reminders)
│   │   ├── [middlewares/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/middlewares)     # Auth, error handling, rate limiting, and socket auth
│   │   ├── [models/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/models)           # Mongoose schemas (Users, Battles, Submissions, AI Keys)
│   │   ├── [routes/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/routes)           # Express API endpoints
│   │   ├── [services/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services)         # Judging engines, AI Gateway, local runners, match logic
│   │   └── [sockets/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/sockets)          # Real-time Socket.IO chat and WebRTC voice handlers
│   ├── [openapi.yaml](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/openapi.yaml)        # OpenAPI 3.0 API Specification
│   └── [Dockerfile](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/Dockerfile)          # Backend production container specification
├── [client/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client)                  # Next.js 16 (App Router) Frontend
│   ├── [src/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/src)                 # React 19 source code
│   │   ├── [app/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/src/app)             # App router pages ((auth), (app), battle, admin, profile, etc.)
│   │   ├── [components/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/src/components)      # UI components, Monaco code editor, theme toggles, toast system
│   │   ├── [lib/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/src/lib)             # Custom Axios client with auto-refresh interceptors & themes
│   │   └── [stores/](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/src/stores)          # Zustand global state stores (Auth, Socket, Toast, Theme)
│   └── [Dockerfile](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/client/Dockerfile)          # Client production container configuration
├── [docker-compose.yml](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/docker-compose.yml)      # Production container orchestration for Client, Backend, MongoDB 6 & Redis 7
├── [nginx.conf](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/nginx.conf)              # Host Nginx reverse-proxy template with WebSocket & rate-limiting
└── [PRODUCTION.md](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/PRODUCTION.md)           # Production Docker & Docker Compose deployment guide
```

---

## ⚡ Key Features & Battle Modes

### 1. Six Specialized Battle Modes
*   **DSA (Data Structures & Algorithms):** Algorithmic puzzles compiled and executed concurrently against test cases.
*   **Bug Fix:** High-pressure debugging of broken code snippets and edge-case logic.
*   **Backend:** Real-world API engineering. The backend engine materializes submitted source trees, boots isolated Docker containers, maps dynamic host ports, checks server health, and executes automated HTTP test suites against the live container.
*   **Frontend:** UI component and layout assembly evaluated by LLM Vision models comparing submission code, styles, and dimensions against reference solutions and design mockups.
*   **Prompt War:** Prompt engineering duels graded against scenario rubrics using AI models, equipped with automated AI-generation detection to penalize AI-generated prompt templates.
*   **Projects:** End-to-end full-stack challenges.

### 2. Multi-Engine Code Judging System
*   **Judge0 Remote API:** External compiler sandbox for remote execution across multiple languages (C++, Java, Python, JavaScript, TypeScript).
*   **Local Subprocess Runner:** High-speed fallback execution engine ([localRunner.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/localRunner.service.ts)) using native compilers/runtimes (`g++`, `node`, `python`, `javac`).
*   **Docker Container Sandbox:** Isolated backend API runner ([backendJudge.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/backendJudge.service.ts)) providing zero-trust execution with CPU, memory, and process limits.
*   **AI Vision & Rubric Engine:** Intelligent evaluation powered by Grok / Llama Scout ([frontendJudge.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/frontendJudge.service.ts), [promptJudge.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/promptJudge.service.ts)).

### 3. AI Gateway & Multi-Model Orchestration
*   **Model Rotation & Fallbacks:** Dynamic model routing ([aiGateway.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/aiGateway.service.ts)) across Llama 3.3 70B, GPT OSS 120B, Llama 4 Scout 17B, Qwen 3 32B, and Llama 3.1 8B.
*   **Budgeting & Limits:** Tracks spend limits per model, automatically falling back to lower-cost models if budget limits are reached.
*   **Security & Telemetry:** AES-256-CBC encrypted storage for custom database API keys ([ApiKey.model.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/models/apiKey.model.ts)) and token usage tracking ([TokenUsage.model.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/models/tokenUsage.model.ts)).

### 4. 3-Tier Matchmaking Engine (Ghost Opponents & Adaptive AI Bots)
*   **Tier 1 (Live Human Matchmaking):** Searches for active online human opponents matching the player's Elo rating bracket.
*   **Tier 2 (Ghost Opponent Replay):** If no active human opponent joins within 15 seconds, the matchmaking engine ([matchmakingFallback.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/matchmakingFallback.service.ts)) searches past completed matches in MongoDB to stream a recorded historical submission attempt by a real player as a "Ghost Opponent".
*   **Tier 3 (Adaptive AI Bot Simulator):** If no ghost recording exists, the engine pairs the player with `devbot_v1` ([botSimulator.service.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/services/botSimulator.service.ts)):
    *   **Rating-Calibrated Skill:** Dynamically adjusts bot typing speed, solve duration, and failure probability based on the host's Elo rating (Bronze / Silver / Gold / Master).
    *   **Difficulty Scaling:** Calculates target solve windows based on question difficulty (EASY: 1.5–3 mins, MEDIUM: 3.5–6 mins, HARD: 6–10 mins).
    *   **Realistic Jitter & Multi-Stage Submissions:** Simulates human typing indicators with random intervals and emits multi-stage partial submissions (Stage 1 at ~30%, Stage 2 at ~70%, and Stage 3 final submission).
    *   **Strict Human-Only Rule:** 2v2 and Team matches strictly enforce 100% human-only player pools.

### 5. Real-Time Communication & WebRTC Voice
*   **Match Lobbies & State:** Socket.IO synchronization for countdowns, team allocation (Team A vs. Team B), code submissions, and round outcomes.
*   **Integrated Live Chat:** Real-time text channels for battle lobbies and global communication ([battleChat.socket.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/sockets/battleChat.socket.ts)).
*   **WebRTC Voice Stream:** In-battle peer-to-peer voice channels with signal routing ([battleVoice.socket.ts](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/src/sockets/battleVoice.socket.ts)).
*   **Live Spectating:** Real-time observation mode for spectators to watch active matches and code progress live.

### 6. Competitive Elo Rating & Social Network
*   **Domain-Specific Elo:** Independent ratings for DSA, Bug Fix, Frontend, Backend, Prompt War, and Projects, alongside an overall composite rating.
*   **Tier System:** Rank progression from Unranked, Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, to Challenger.
*   **Leaderboards:** Global, Weekly, Monthly, Country-specific (using ISO country codes), and Friends-only leaderboards.
*   **Social Network:** User discovery, friend requests, mutual friend management, and customizable profiles with Cloudinary avatar integration.

### 7. Automated Maintenance Cron Jobs
*   **Unverified User Cleanup:** Purges unverified registrations after expiration.
*   **Token & OTP Maintenance:** Periodic invalidation of expired refresh tokens and OTP secrets.
*   **Stale Room Garbage Collection:** Automatically cleans abandoned lobbies and inactive matches.
*   **Rating Recovery:** Background recalculation and integrity checks for user ratings.
*   **Grind Reminders:** Sends periodic battle activity reminders.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Core:** React 19, TypeScript
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Styling:** Tailwind CSS v4 (Custom Teal Dark/Light themes)
- **State Management:** Zustand (Auth session, socket connections, UI toasts, themes)
- **Data Fetching:** TanStack React Query v5 (Caching, synchronization, automatic retries)
- **Networking:** Custom Axios instance with automatic JWT token refresh interceptors
- **Icons & UI:** Lucide React

### Backend
- **Framework:** Node.js, Express 5 (Module format), TypeScript
- **Database:** MongoDB 6 via Mongoose 9
- **Cache & Storage:** Redis 7 (via `ioredis`) for queues, rate limiting, and temporary state
- **Real-Time:** Socket.IO 4 & WebRTC signaling
- **Security:** Helmet 8, CORS, Express-Rate-Limit, HPP, and password hashing via bcrypt
- **Request Validation:** Zod schema-based validation middlewares
- **Logging & Telemetry:** Pino logger with latency tracking middleware
- **Email Transporter:** Nodemailer (SMTP integration for OTP verification & recovery)

---

## ⚙️ Environment Configuration

Set up environment variables for both backend and client before running the application.

### 1. Backend Configuration (`backendServer/.env`)
Create `backendServer/.env`:
```ini
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/codecomplex
REDIS_URL=redis://127.0.0.1:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_key_at_least_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email Transporter (SMTP)
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM_ADDRESS=support@codecomplex.site
OWNER_EMAIL=admin@codecomplex.site

# Cloudinary (Avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth (Google & GitHub)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_CALLBACK_URL=http://localhost:8000/api/v1/auth/callback

# Code Execution & AI Judges
JUDGE_MODE=local                      # 'local' or 'remote'
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=your_judge0_key         # Optional
GROQ_API_KEY=your_groq_api_key
XAI_API_KEY=your_xai_api_key
```

### 2. Client Configuration (`client/.env.local`)
Create `client/.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js:** 18.0+ or 20.0+
- **MongoDB:** 5.0+ running locally or a MongoDB Atlas URI
- **Redis:** 6.0+ running locally

### 1. Backend Setup & Seeding
```bash
cd backendServer
npm install

# Run database seeders to populate problem sets
npm run seed              # Seed DSA questions
npm run seed:prompt-war   # Seed Prompt War scenarios
npm run seed:frontend     # Seed Frontend challenges & reference assets
npm run seed:backend      # Seed Backend API challenges
npm run seed:bug-fix      # Seed Bug Fix challenges

# Start backend development server
npm run dev
```
The Express server starts at [http://localhost:8000](http://localhost:8000).

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment (Zero-Dependency Setup)

Spin up the entire ecosystem—MongoDB, Redis, Express Backend, and Next.js Frontend—with Docker Compose:

1. Ensure root environment variables match `docker-compose.yml`.
2. Build and start containers:
   ```bash
   docker-compose up --build
   ```
3. Access endpoints:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend:** [http://localhost:8000](http://localhost:8000)

---

## 🌐 Production Hosting

For production environments using **Docker & Docker Compose**:
1. **Container Orchestration:** Spin up all containers (Frontend, Backend, MongoDB, Redis) in detached mode using `docker-compose up --build -d`.
2. **Reverse Proxy & SSL:** Configure host Nginx to proxy `https://yourdomain.com` traffic to `127.0.0.1:3000` (frontend) and `127.0.0.1:8000` (backend & websockets), securing the domain with Let's Encrypt SSL via Certbot.
3. Follow the complete step-by-step guide in [PRODUCTION.md](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/PRODUCTION.md) for environment configuration, container logs management, seeding, and Nginx SSL setup.

---

## 📖 API Documentation

The complete REST API specification is documented using OpenAPI 3.0:
- **Spec File:** [backendServer/openapi.yaml](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/backendServer/openapi.yaml)
- **Health Check Endpoint:** `GET /health`
- **Root Status:** `GET /`

---

## 📄 License

This project is open-source under the [ISC License](LICENSE).
