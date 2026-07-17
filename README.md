# ⚔️ CodeComplex

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black?style=flat-square&logo=socket.io)](https://socket.io/)

**CodeComplex** is a premier real-time competitive engineering and coding platform. Developers can face off in live battles across various domains including DSA, bug-fixing, backend engineering, frontend assembly, fullstack tasks, and prompt-engineering wars. 

The platform supports matchmaking, team configurations, real-time code executions, Elo-based rating tiers, social/friend systems, notifications, and spectator modes.

---

## 🏗️ Architecture & Project Structure

The project is structured as a monorepo containing a separate TypeScript Express server and a Next.js client, with support for Docker orchestration and production PM2 deployment.

```
CodeComplex/
├── backendServer/          # Express backend application
│   ├── src/                # TypeScript source files (controllers, routes, models, sockets, jobs)
│   ├── openapi.yaml        # API specifications (Swagger/OpenAPI 3.0)
│   └── Dockerfile          # Production Docker container configuration
├── client/                 # Next.js frontend application
│   ├── src/                # Next.js 15 App Router components, views, hooks, and stores
│   └── Dockerfile          # Frontend container configuration
├── docker-compose.yml      # Orchestrates client, backend, Redis, and MongoDB
├── ecosystem.config.cjs    # PM2 production process configuration
├── nginx.conf              # Nginx template reverse-proxy with rate-limiting & websockets
└── PRODUCTION.md           # Production deployment & hosting guide (PM2 + Nginx + Certbot SSL)
```

---

## 🚀 Key Features

*   **Real-time Coding Battles:** Multiplayer lobbies with Socket.IO supporting custom lobbies, team configurations (Team A vs. Team B), and real-time game state synchronization.
*   **Flexible Battle Modes:** Face off in Data Structures & Algorithms, bug patching, API backend creation, frontend component styling, and prompt battles.
*   **Elo Rating & Leaderboards:** Competitive ranking system featuring overall and categorized Elo ratings with global, weekly, monthly, country-specific, and friends-only leaderboards.
*   **Robust Authentication:** Secure cookie-based HTTP-only session tokens (JWT access + refresh rotation) alongside user registration, OTP email verification, and password recovery.
*   **Voice & Text Chat:** Integrated live text chat (with global messaging) and WebRTC voice support for active battle lobbies.
*   **Friendship Network:** Full social features: user lookup, sending/accepting friend requests, mutual friend lists, and a friend-specific leaderboard.
*   **Live Spectating:** Spectator controls enabling external users to view live matches and code submissions in real time.
*   **Achievements & Badges:** Unlocking achievements based on match outcomes, code submission accuracy, speed, and other competitive milestones.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI & Component Logic:** React 19, TypeScript
- **Styling:** Tailwind CSS v4 (Teal Dark/Light theme)
- **State Management:** Zustand (Auth states, global configurations)
- **Data Fetching:** TanStack React Query (Automatic caching, updates, and mutation handling)
- **Networking:** Axios client featuring custom automatic token refresh interceptors

### Backend
- **Framework:** Node.js, Express, TypeScript
- **Database:** MongoDB (via Mongoose) for structured profiles, match logs, and lobby stats
- **Cache & Message Broker:** Redis (handling queues, rate limiting, and temporary state)
- **Real-Time Communication:** Socket.IO for secure websocket streams and WebRTC signal routing
- **Security:** Helmet, CORS, Express-Rate-Limit, HPP, and secure password hashing via bcrypt
- **Request Validation:** Zod schema-based validation middlewares
- **Logging:** Pino high-performance logger

---

## ⚙️ Environment Configuration

To run CodeComplex locally or via Docker, configure environment variables for both folders.

### 1. Backend (`backendServer/.env`)
Create `backendServer/.env` following the structure in `backendServer/.env.example`:
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
EMAIL_FROM_ADDRESS=noreply@codecomplex.com

# Cloudinary (Avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Judges (Optional)
GROQ_API_KEY=your_groq_api_key
XAI_API_KEY=your_xai_api_key
```

### 2. Frontend (`client/.env.local`)
Create `client/.env.local` to point to your backend:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

---

## 🏃 Quick Start (Local Development)

Ensure you have **Node.js 18+**, **MongoDB 5.0+**, and **Redis** running locally.

### Start the Backend
```bash
cd backendServer
npm install
npm run dev
```
The server will boot on [http://localhost:8000](http://localhost:8000). You can explore the REST endpoints via the `openapi.yaml` spec.

### Start the Frontend
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment (Zero Dependency)

You can spin up the entire ecosystem—including MongoDB, Redis, the Express Backend, and the Next.js Frontend—with a single command:

1. Create a root-level `.env` file or ensure environment variables are present on your system matching `docker-compose.yml`.
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. Once running:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000](http://localhost:8000)

---

## 🌐 Production Hosting

For production setups on virtual machines (VMs):
1. **PM2** process configuration handles clustering and auto-restarts (`ecosystem.config.cjs`).
2. **Nginx** handles load balancing, static caching, HTTPS redirects, and reverse-proxying (`nginx.conf`).
3. Follow the detailed steps in the [Production Deployment Guide](PRODUCTION.md) to set up PM2, configure Nginx, and secure domains with Let's Encrypt SSL.
