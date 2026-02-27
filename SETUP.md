# Local Development Setup

This guide covers setting up the project for local development.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Bun | >= 1.0 | Package manager |
| Node.js | >= 18 | Alternative to Bun |
| Git | Any | Version control |

Install Bun:
```bash
# Windows (PowerShell)
irm https://bun.sh/install | iex

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

## Installation

### 1. Clone & Install

```bash
git clone <repository-url>
cd polaroid-glossy-clean
bun install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your local values:

```env
# Database (SQLite)
DATABASE_URL=file:./dev.db

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Supabase (for image storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ToyyibPay (Malaysian payment gateway)
TOYYIBPAY_SECRET_KEY=your-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code

# IMPORTANT: ToyyibPay requires public URLs (not localhost)
# For local development, use ngrok:
# 1. Run: ngrok http 3000
# 2. Use the https URL from ngrok for the values below
TOYYIBPAY_RETURN_URL=https://your-ngrok-url.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://your-ngrok-url.ngrok-free.dev/api/toyyibpay/callback
```

#### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API / Google People API
4. Go to Credentials → OAuth 2.0 Client IDs
5. Create credentials
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Add authorized JavaScript origins: `http://localhost:3000`

#### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. In Project Settings → API, copy the **Project URL** and **anon/public** key
3. In Storage, create a bucket named `polaroid-glossy` and set it to **Public**

### 3. Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (creates/updates SQLite database)
bun run db:push
```

This creates `dev.db` in the project root.

### 4. Start Development Server

```bash
bun run dev
```

The app runs at **http://localhost:3000**

## Database Management

### Reset Database

```bash
# Drops all tables and recreates
bun run db:reset
```

### View Database

```bash
# Using SQLite CLI (macOS/Linux)
sqlite3 dev.db

# Using SQLite Browser (Windows)
# Download from https://sqlitebrowser.org/
```

### Prisma Studio (GUI)

```bash
npx prisma studio
```

Opens a web interface to view/edit database records.

## Common Issues

### "Bun not found"

Restart your terminal after installation, or add Bun to PATH:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

### "Database locked"

Close any database connections (Prisma Studio, other instances) and try again.

### "Module not found"

Clear the cache and reinstall:
```bash
rm -rf node_modules .next
bun install
bun run build
```

### Port 3000 in use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

Or change the port in `package.json`:
```json
"dev": "next dev -p 3001"
```

## Next Steps

After setup:
1. Read [ENVIRONMENT.md](./ENVIRONMENT.md) to understand all configuration options
2. Read [TOYYIBPAY_FLOW.md](./TOYYIBPAY_FLOW.md) for payment integration details
3. Read [DEPLOYMENT.md](./DEPLOYMENT.md) when ready to deploy
