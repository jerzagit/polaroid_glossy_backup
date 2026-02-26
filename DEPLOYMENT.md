# Deployment Guide

Complete guide for deploying Polaroid Glossy to production.

## Deployment Options

1. **Caddy Server** (Recommended) - Reverse proxy with automatic SSL
2. **Docker** - Containerized deployment
3. **Vercel** - Platform as a Service

---

## Option 1: Caddy Server (Recommended)

### Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| RAM | 1 GB | 2 GB |
| CPU | 1 core | 2 cores |
| Storage | 10 GB | 20 GB |
| Domain | Required | Point A record to server IP |

### Step 1: Prepare Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git unzip

# Install Bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Step 2: Upload Project

```bash
# From your local machine
scp -r ./polaroid-glossy-clean user@your-server:/home/user/polaroid/
```

### Step 3: Install Dependencies & Build

```bash
# SSH into server
ssh user@your-server

cd /home/user/polaroid

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate
```

### Step 4: Configure Production Environment

```bash
# Create production .env
nano .env
```

```env
# Database - use separate production database
DATABASE_URL=file:./db/production.db

# Use your actual domain
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key

# Google OAuth - update in Google Cloud Console
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret

# ToyyibPay - update in merchant dashboard
TOYYIBPAY_SECRET_KEY=your-production-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_RETURN_URL=https://your-domain.com/payment-status
TOYYIBPAY_CALLBACK_URL=https://your-domain.com/api/toyyibpay/callback
```

### Step 5: Create Production Database

```bash
mkdir -p db
bun run db:push
```

### Step 6: Build Application

```bash
bun run build
```

### Step 7: Configure Caddy

Edit the Caddyfile:

```bash
nano Caddyfile
```

```Caddyfile
your-domain.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### Step 8: Start Application

```bash
# Start the Next.js app in background
nohup bun run start > server.log 2>&1 &

# Verify it's running
curl http://localhost:3000
```

### Step 9: Start Caddy

```bash
# Validate Caddyfile
caddy validate --config Caddyfile

# Start Caddy
caddy start

# Or run in foreground for debugging
caddy run
```

### Step 10: Verify Deployment

Visit `https://your-domain.com` - Caddy automatically provisions SSL.

---

## Option 2: Docker

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./

EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Build & Run

```bash
# Build image
docker build -t polaroid-glossy .

# Run container
docker run -d -p 3000:3000 --env-file .env polaroid-glossy
```

### Docker Compose (Optional)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## Option 3: Vercel

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

- `DATABASE_URL` (use Vercel Postgres or external DB)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TOYYIBPAY_*` variables

---

## Post-Deployment Checklist

- [ ] Domain DNS points to server IP
- [ ] SSL certificate auto-provisioned (Caddy)
- [ ] Google OAuth redirect URIs updated
- [ ] ToyyibPay URLs updated in dashboard
- [ ] Database migrated (`bun run db:push`)
- [ ] Application builds successfully
- [ ] Payment flow works
- [ ] Authentication works
- [ ] Database backup configured

---

## Maintenance

### View Logs

```bash
# Production server logs
tail -f server.log

# System logs
sudo journalctl -u caddy -f
```

### Update Application

```bash
# Pull latest changes
git pull

# Install updates
bun install

# Rebuild
bun run build

# Restart
pkill -f "node.*next"
nohup bun run start > server.log 2>&1 &
```

### Database Backup

```bash
# Backup SQLite database
cp db/production.db backups/db-$(date +%Y%m%d).db

# Or use crontab for automated backups
crontab -e
# Add: 0 2 * * * cp /home/user/polaroid/db/production.db /home/user/polaroid/backups/db-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### 500 Internal Server Error

```bash
# Check logs
tail -f server.log

# Common causes:
# - Missing environment variables
# - Database not initialized
# - Permission issues
```

### SSL Certificate Issues

```bash
# Stop Caddy
caddy stop

# Delete existing certificates
rm -rf ~/.local/share/caddy

# Start Caddy again
caddy start
```

### Payment Not Working

1. Check ToyyibPay dashboard for errors
2. Verify callback URL is publicly accessible
3. Check `server.log` for callback errors

### Authentication Not Working

1. Verify Google OAuth redirect URIs match exactly
2. Check `NEXTAUTH_URL` is correct
3. Ensure `NEXTAUTH_SECRET` is set
