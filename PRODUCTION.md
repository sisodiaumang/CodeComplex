# Production Deployment Guide (VM Hosting)

This guide walks you through deploying the DevWar application on a Virtual Machine (VM) using **PM2** for process management and **Nginx** as a high-performance reverse proxy.

---

## Prerequisites

Ensure your VM (Ubuntu/Debian, CentOS, RedHat, or Windows Server) has the following installed:
1. **Node.js** (v18 or higher recommended)
2. **NPM**
3. **MongoDB** (Local instance or an Atlas connection URI)
4. **Redis** (Required for background jobs and rate limiting)
5. **PM2** (`npm install -g pm2`)
6. **Nginx**

---

## Step 1: Environment Variables

Prepare your production environment variables.

### Backend (`backendServer/.env`)
Create or edit `backendServer/.env` with production configurations:
```ini
PORT=8000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb://your_prod_user:your_prod_password@127.0.0.1:27017/devwar?authSource=admin
JWT_ACCESS_SECRET=your-super-long-secure-access-secret-at-least-32-chars
JWT_REFRESH_SECRET=your-super-long-secure-refresh-secret-at-least-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
REDIS_URL=redis://127.0.0.1:6379

# Add other keys (XAI, Groq, Cloudinary, etc.) as needed
```

### Client (`client/.env.local`)
Create or edit `client/.env.local` to point to your Nginx proxy domain:
```ini
# Since Nginx acts as a reverse proxy, we can route all api/socket traffic to the same host
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
```

---

## Step 2: Build the Application

Build both the backend and client apps on the VM to generate production bundles.

```bash
# Build Backend
cd backendServer
npm install --omit=dev  # Install production dependencies only
npm run build           # Compiles typescript into dist/

# Build Client
cd ../client
npm install
npm run build           # Compiles Next.js app to .next/
```

---

## Step 3: Run with PM2

Run both services simultaneously using the provided PM2 config file (`ecosystem.config.cjs`). PM2 cluster mode enables multiple instances to run concurrently matching available CPU cores, providing load balancing, error recovery, and zero-downtime updates.

From the root project directory:
```bash
# Start all services
pm2 start ecosystem.config.cjs

# Make PM2 restart automatically on VM reboot
pm2 startup
pm2 save
```

### Monitoring commands:
- Check application status: `pm2 status`
- Monitor resource usage: `pm2 monit`
- View combined logs: `pm2 logs`
- Restart applications: `pm2 restart all`

---

## Step 4: Configure Nginx

Nginx acts as the entry point for the VM, managing TLS (SSL) termination, routing web socket requests, and caching static assets.

1. Copy the provided `nginx.conf` template contents to your active Nginx site configurations:
   - On Linux systems, this is typically `/etc/nginx/sites-available/devarena` (or directly inside `nginx.conf`).
2. Create a symlink to enable it:
   ```bash
   sudo ln -s /etc/nginx/sites-available/devarena /etc/nginx/sites-enabled/
   ```
3. Update the configuration to match your details:
   - Replace `devarena.example.com` with your actual domain.
   - Update static folder path aliases `/var/www/devArena/client/...` to match the exact absolute directory path of your project on the VM.
4. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Step 5: Secure with SSL (Let's Encrypt)

Secure your deployment using free HTTPS certificates from Let's Encrypt.

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```
2. Request and install certificates automatically:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
3. Certbot will prompt you to configure redirection. Select `Redirect` to force all HTTP requests to go through HTTPS.
4. Once completed, uncomment the redirect code inside your Nginx server block to finalize:
   ```nginx
   # Redirect all HTTP requests to HTTPS
   return 301 https://$host$request_uri;
   ```
5. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
