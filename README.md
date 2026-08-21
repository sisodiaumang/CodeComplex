# CodeComplex

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5-red?style=flat-square&logo=redis)](https://bullmq.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**CodeComplex** is a premier real-time competitive engineering and coding platform. Developers face off in live multiplayer duels across six distinct engineering domains: Data Structures & Algorithms (DSA), Bug Fixing, Backend API Engineering, Frontend Layout Assembly, Prompt War duels, and Full-stack Projects.

The platform combines Socket.IO real-time state synchronization, WebRTC live voice channels, 3-tier fallback matchmaking (Live Humans → Ghost Opponent Replays → Adaptive AI Bots), hybrid code execution sandboxes (Judge0, local subprocesses, and Docker container runners), BullMQ decoupled email queues, AI Vision LLM grading, domain-specific Elo rating ladders, multi-tiered leaderboards, social networks, and automated background maintenance jobs.

---

## 🏗️ Architecture & Project Structure

CodeComplex is structured as a monorepo containing a TypeScript Express API & WebSocket server alongside a Next.js 16 App Router web client, backed by Docker Compose container orchestration.

```
CodeComplex/
├── backendServer/           # TypeScript Express 5 API, WebSocket & Queue Worker
│   ├── src/                 # Application logic & services
│   │   ├── config/          # Environment variables & schema validation
│   │   ├── controllers/     # REST request handlers (Auth, Battle, Admin, Rating, etc.)
│   │   ├── db/              # Database connections & category seeding scripts
│   │   ├── jobs/            # Background cron jobs (stale rooms, token cleanup, reminders)
│   │   ├── middlewares/     # Auth, error handling, rate limiting, and socket auth
│   │   ├── models/          # Mongoose schemas (Users, Battles, Submissions, AI Keys)
│   │   ├── queues/          # BullMQ Redis producer queues (emailQueue.ts)
│   │   ├── routes/          # Express API endpoints
│   │   ├── services/        # Judging engines, AI Gateway, local runners, match logic
│   │   ├── sockets/         # Real-time Socket.IO chat and WebRTC voice handlers
│   │   └── workers/         # Standalone BullMQ Worker processes (emailWorker.ts)
│   ├── openapi.yaml        # OpenAPI 3.0 API Specification
│   ├── Dockerfile          # Backend API container specification
│   └── Dockerfile.worker   # Decoupled BullMQ Worker container specification
├── client/                  # Next.js 16 (App Router) Frontend
│   ├── src/                 # React 19 source code
│   │   ├── app/             # App router pages ((auth), (app), battle, admin, profile, etc.)
│   │   ├── components/      # UI components, Monaco code editor, theme toggles, toast system
│   │   ├── lib/             # Custom Axios client with auto-refresh interceptors & themes
│   │   └── stores/          # Zustand global state stores (Auth, Socket, Toast, Theme)
│   └── Dockerfile          # Client production container configuration
├── docker-compose.yml      # Production container orchestration (Client, Backend, Worker, MongoDB 6 & Redis 7)
├── ecosystem.config.cjs    # PM2 Process Manager configuration (API + Email Queue Worker)
├── nginx.conf              # Host Nginx reverse-proxy template with WebSocket & rate-limiting
└── PRODUCTION.md           # Production Docker & Docker Compose deployment guide
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

### 2. Solo Practice Mode & LeetCode-Style Reference Solutions
*   **Single-Player Practice:** Practice mode (`isSolo: true`) across all 6 battle domains and topics without rating pressure.
*   **Submission-Gated Solutions:** Reference solutions unlock automatically **only after the first submission attempt** to encourage problem-solving.
*   **LeetCode-Style Code Stripping:** Strips boilerplate driver code (`int main()`, `public class Main`, driver functions) by default for clean solution reading, with an interactive `Show Main ()` toggle.
*   **1-Click Workspace Apply & Submit:** Copy code, apply directly to the Monaco editor, or click **"Submit Solution"** directly from the solution panel for instant grading.

### 3. Multi-Engine Code Judging System
*   **Judge0 Remote API:** External compiler sandbox for remote execution across multiple languages (C++, Java, Python, JavaScript, TypeScript).
*   **Local Subprocess Runner:** High-speed fallback execution engine ([localRunner.service.ts](./backendServer/src/services/localRunner.service.ts)) using native compilers/runtimes (`g++`, `node`, `python`, `javac`).
*   **Docker Container Sandbox:** Isolated backend API runner ([backendJudge.service.ts](./backendServer/src/services/backendJudge.service.ts)) providing zero-trust execution with CPU, memory, and process limits.
*   **AI Vision & Rubric Engine:** Intelligent evaluation powered by Grok / Llama Scout ([frontendJudge.service.ts](./backendServer/src/services/frontendJudge.service.ts), [promptJudge.service.ts](./backendServer/src/services/promptJudge.service.ts)).

### 4. Decoupled Asynchronous BullMQ Email Worker
*   **Non-Blocking Queue Pipeline:** High-concurrency email handling via BullMQ + Redis Queue ([emailQueue.ts](./backendServer/src/queues/emailQueue.ts)) with automatic exponential backoff retries.
*   **Standalone Worker Process:** Dedicated worker container ([emailWorker.ts](./backendServer/src/workers/emailWorker.ts)) handling verification OTPs, onboarding welcome mails, email change alerts, grind reminders, and site moderation reports.

### 5. Real-Time Online Users Telemetry & Admin Console
*   **Gateway Presence Inspection:** Real-time Socket.IO connection pool inspection ([getOnlineUsersInfo()](./backendServer/src/index.ts)) tracking unique active sessions without database write overhead.
*   **Live Admin Telemetry:** Live connected user metrics card, live session feed widget, and real-time `Online` / `Offline` status badges in the Admin User Database.

### 6. Smart Username Availability Suggestions
*   **Conflict Resolution:** Generates intelligent, contextual username alternatives (`username_dev`, `real_username`, `username_code`) when a username is already taken during signup, displayed as interactive clickable badges.

### 7. AI Gateway & Multi-Model Orchestration
*   **Model Rotation & Fallbacks:** Dynamic model routing ([aiGateway.service.ts](./backendServer/src/services/aiGateway.service.ts)) across Llama 3.3 70B, GPT OSS 120B, Llama 4 Scout 17B, Qwen 3 32B, and Llama 3.1 8B.
*   **Budgeting & Limits:** Tracks spend limits per model, automatically falling back to lower-cost models if budget limits are reached.
*   **Security & Telemetry:** AES-256-CBC encrypted storage for custom database API keys ([ApiKey.model.ts](./backendServer/src/models/apiKey.model.ts)) and token usage tracking ([TokenUsage.model.ts](./backendServer/src/models/tokenUsage.model.ts)).

### 8. 3-Tier Matchmaking Engine (Ghost Opponents & Adaptive AI Bots)
*   **Tier 1 (Live Human Matchmaking):** Searches for active online human opponents matching the player's Elo rating bracket.
*   **Tier 2 (Ghost Opponent Replay):** If no active human opponent joins within 15 seconds, the matchmaking engine ([matchmakingFallback.service.ts](./backendServer/src/services/matchmakingFallback.service.ts)) searches past completed matches in MongoDB to stream a recorded historical submission attempt by a real player as a "Ghost Opponent".
*   **Tier 3 (Adaptive AI Bot Simulator):** If no ghost recording exists, the engine pairs the player with `devbot_v1` ([botSimulator.service.ts](./backendServer/src/services/botSimulator.service.ts)).

### 9. Real-Time Communication & WebRTC Voice
*   **Match Lobbies & State:** Socket.IO synchronization for countdowns, team allocation, code submissions, and round outcomes.
*   **Integrated Live Chat & Voice:** Real-time text channels ([battleChat.socket.ts](./backendServer/src/sockets/battleChat.socket.ts)) and WebRTC peer-to-peer voice channels ([battleVoice.socket.ts](./backendServer/src/sockets/battleVoice.socket.ts)).

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
- **Cache & Queue:** Redis 7 (via `ioredis`) and BullMQ for decoupled asynchronous job queues
- **Real-Time:** Socket.IO 4 & WebRTC signaling
- **Worker Pipeline:** BullMQ standalone worker process (`emailWorker.ts`)
- **Security:** Helmet 8, CORS, Express-Rate-Limit, HPP, bcrypt, AES-256-CBC
- **Email Transporter:** Nodemailer (SMTP / Resend integration for OTP verification & onboarding)

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

# Email Transporter (SMTP / Resend)
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

### 1. Backend API & Queue Worker Setup
```bash
cd backendServer
npm install

# Run database seeders to populate problem sets
npm run seed              # Seed DSA questions
npm run seed:prompt-war   # Seed Prompt War scenarios
npm run seed:frontend     # Seed Frontend challenges & reference assets
npm run seed:backend      # Seed Backend API challenges
npm run seed:bug-fix      # Seed Bug Fix challenges

# Start Express API server & BullMQ Email Worker in separate terminals
npm run dev               # Terminal 1: Starts Express API server on port 8000
npm run dev:worker        # Terminal 2: Starts BullMQ Email Worker process
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment (Zero-Dependency Setup)

Spin up the entire ecosystem—MongoDB, Redis, Express Backend API, BullMQ Email Worker, and Next.js Frontend—with Docker Compose:

1. Ensure root environment variables match `docker-compose.yml`.
2. Build and start containers:
   ```bash
   docker-compose up --build -d
   ```
3. Access endpoints:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)

---

## 🌐 Production Hosting

For production environments using **Docker & Docker Compose**:
1. **Container Orchestration:** Spin up all services (Client, Backend API, Worker, MongoDB, Redis) in detached mode using `docker-compose up --build -d`.
2. **Reverse Proxy & SSL:** Configure host Nginx to proxy `https://yourdomain.com` traffic to `127.0.0.1:3000` (frontend) and `127.0.0.1:8000` (backend & websockets), securing the domain with Let's Encrypt SSL via Certbot.
3. Follow the complete step-by-step guide in [PRODUCTION.md](./PRODUCTION.md) for environment configuration, container logs management, seeding, and Nginx SSL setup.

---

## 🚀 High-Scale Performance Architecture & Benchmarks

CodeComplex is engineered to handle extreme real-time traffic spikes and high-concurrency competitive duels. Under empirical stress testing at **2,000 concurrent user connections**, the platform delivers the following performance metrics:

### Empirical Benchmark Results

| Workload / Endpoint | Target Route | Throughput (RPS) | 2xx Success Rate | Median Latency (p50) | Rating |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage (SSR + Microcache)** | `https://codecomplex.site/` | **428.57 Requests/Sec** | **100%** | **413 ms** | Sub-half second ⚡ |
| **Global Leaderboard API (Redis Cached)** | `/api/v1/leaderboard/global` | **17,088 Requests/Sec** 🚀 | **100%** | **0 ms** | Instant RAM Cache 🔥 |
| **Authenticated Profile API (JWT)** | `/api/v1/user/me` | **15,487 Requests/Sec** ⚡ | **100%** | **0 ms** | Sub-millisecond JWT Auth |

### Key Optimizations for Maximum Throughput

1. **Multi-Replica Container Scaling ([`docker-compose.yml`](./docker-compose.yml)):**
   - Express backend scaled across 4 worker container instances (`codecomplex-backend-1` to `4`) listening on ports `8000–8003`, fully utilizing all host CPU cores.
   - Host Nginx round-robin upstream load balancing with persistent keepalive pools (256 connections) and 200r/s rate limits.

2. **Database Connection Pool Expansion & Compound Covered Indexes:**
   - Mongoose `maxPoolSize` expanded to **100 connections per container** (400 total DB connections) in [`connectDB.ts`](./backendServer/src/db/connectDB.ts), eliminating database connection wait queues.
   - Compound covered indexes (`{ "ratings.dsa": -1, userId: 1 }`) in [`userProfile.model.ts`](./backendServer/src/models/userProfile.model.ts) enable sub-millisecond MongoDB Index-Only Scans (`IXSCAN`).

3. **Sub-Millisecond Redis Response Caching:**
   - Express response caching middleware ([`cache.middleware.ts`](./backendServer/src/middlewares/cache.middleware.ts)) caches read-heavy JSON payloads directly in Redis memory (`X-Cache: HIT`), delivering over **17,000+ Requests/Sec**.

4. **Nginx RAM Microcaching & Standalone Build Mode:**
   - Next.js 16 standalone build configuration (`output: "standalone"`) in [`next.config.ts`](./client/next.config.ts) reduces memory footprint per container to ~119MB.
   - Nginx RAM microcaching (`proxy_cache_valid 200 2s;`) absorbs page request floods directly at the web server layer.

5. **Linux Kernel TCP Socket Tuning:**
   - Host OS kernel tuned with `net.core.somaxconn=65535` and `net.ipv4.tcp_max_syn_backlog=65535` to maximize TCP listen backlog queues and eliminate connection drops under load.

---

## 📖 API Documentation

The complete REST API specification is documented using OpenAPI 3.0:
- **Spec File:** [backendServer/openapi.yaml](./backendServer/openapi.yaml)
- **Health Check Endpoint:** `GET /health`
- **Root Status:** `GET /`

---

## 📄 License

This project is open-source under the [ISC License](LICENSE).
