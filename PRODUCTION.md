# Production Deployment Guide (Docker & Docker Compose)

This guide walks you through deploying the **CodeComplex** application in production using **Docker & Docker Compose** for container orchestration, and **Nginx** as a high-performance reverse proxy with **Let's Encrypt SSL**.

---

## Prerequisites

Ensure your production server or VM (Ubuntu/Debian, CentOS, RedHat, or AWS EC2 / DigitalOcean Droplet) has the following installed:

1. **Docker Engine** (v20.10+ recommended)
2. **Docker Compose** (v2.0+ recommended plugin)
3. **Nginx** (Installed on host for SSL termination & domain routing)
4. **Certbot** (`sudo apt install certbot python3-certbot-nginx`)

---

## Step 1: Production Environment Setup

Create a root-level `.env` file in the project root directory (`CodeComplex/.env`):

```ini
NODE_ENV=production
PORT=8000
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Database & Cache URIs
MONGODB_URI=mongodb://devarena-mongodb:27017/codecomplex
REDIS_URL=redis://devarena-redis:6379

# Security Tokens (Generate strong 32+ character secrets)
JWT_ACCESS_SECRET=your-super-long-secure-access-secret-at-least-32-chars
JWT_REFRESH_SECRET=your-super-long-secure-refresh-secret-at-least-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email Transporter (SMTP)
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM_ADDRESS=support@yourdomain.com
OWNER_EMAIL=admin@yourdomain.com

# Cloudinary (Avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth (Google & GitHub)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_CALLBACK_URL=https://yourdomain.com/api/v1/auth/callback

# Code Execution & AI Judges
JUDGE_MODE=local
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=your_judge0_key
GROQ_API_KEY=your_groq_api_key
XAI_API_KEY=your_xai_api_key

# Frontend Client Public Variables (Passed during build)
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
```

---

## Step 2: Build and Launch Containers

Run Docker Compose to build images for the frontend client and Express backend, and spin up isolated containers alongside MongoDB 6 and Redis 7:

```bash
# Build and start all services in detached mode
docker-compose up --build -d

# Check running containers
docker-compose ps
```

### Essential Container Commands:
- **View Container Logs:** `docker-compose logs -f --tail=100`
- **View Specific Service Logs:** `docker-compose logs -f backend`
- **Restart Services:** `docker-compose restart`
- **Stop Containers:** `docker-compose down`
- **Rebuild Single Service:** `docker-compose up --build -d backend`

---

## Step 3: Configure Host Nginx Reverse Proxy

Nginx acts as the host entry point, managing TLS (SSL) termination, forwarding WebSocket streams for Socket.IO/WebRTC, and routing API traffic to Docker containers.

1. Copy the provided [`nginx.conf`](file:///d:/PROGRAMMING/projects/New%20folder%20-%20Copy/devArena/nginx.conf) to your Nginx sites configuration:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/codecomplex
   sudo ln -s /etc/nginx/sites-available/codecomplex /etc/nginx/sites-enabled/
   ```

2. Update domain and proxy targets inside `/etc/nginx/sites-available/codecomplex`:
   - Replace `devarena.example.com` with your actual domain (`yourdomain.com`).
   - Frontend container maps to `127.0.0.1:3000`.
   - Express backend container maps to `127.0.0.1:8000`.

3. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Step 4: Secure Domain with SSL (Let's Encrypt Certbot)

Enable HTTPS for your domain using Certbot:

```bash
# Request and install SSL certificate automatically
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal verification
sudo certbot renew --dry-run
```

Certbot automatically configures SSL directives and HTTP-to-HTTPS redirects inside your Nginx configuration.

---

## Step 5: Database Seeding & Maintenance

Populate the database with default challenges directly through the running backend container:

```bash
# Run all seeding scripts inside the backend container
docker-compose exec backend npm run seed
docker-compose exec backend npm run seed:prompt-war
docker-compose exec backend npm run seed:frontend
docker-compose exec backend npm run seed:backend
docker-compose exec backend npm run seed:bug-fix
```

---

## Summary Architecture

```
[ Client Browser ]
        │
        ▼ (HTTPS / WSS)
   [ Host Nginx ]
   ├── Port 443 -> Forward to 127.0.0.1:3000 (Frontend Container)
   ├── /api/    -> Forward to 127.0.0.1:8000 (Backend Container)
   └── /socket.io/ -> Forward to 127.0.0.1:8000 (Backend Container)
        │
        ▼
   [ Docker Compose Network ]
   ├── Frontend Container (Next.js 16)
   ├── Backend Container  (Express 5 API & Socket.IO)
   ├── MongoDB Container  (Port 27017)
   └── Redis Container    (Port 6379)
```
