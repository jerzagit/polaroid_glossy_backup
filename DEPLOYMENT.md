# Deployment Guide — Polaroid Glossy

Covers local development setup and production deployment. Read top-to-bottom the first time; refer to the diff table for quick changes between environments.

---

## Quick Reference — Dev vs Production

| Setting | Development | Production |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite) | PostgreSQL connection string |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://polaroidglossy.my` |
| `TOYYIBPAY_BASE_URL` | `https://dev.toyyibpay.com` | `https://toyyibpay.com` |
| `TOYYIBPAY_RETURN_URL` | ngrok HTTPS URL | `https://polaroidglossy.my/payment-status` |
| `TOYYIBPAY_CALLBACK_URL` | ngrok HTTPS URL | `https://polaroidglossy.my/api/toyyibpay/callback` |
| `AWS_S3_BUCKET` | `polaroid-glossy-dev` | `polaroid-glossy-prod` |
| S3 image delivery | Direct S3 URL (public read) | CloudFront CDN |
| Google OAuth redirect | `http://localhost:3000/api/auth/callback/google` | `https://polaroidglossy.my/api/auth/callback/google` |
| Prisma provider | `sqlite` | `postgresql` |

---

## 1. Local Development

### 1.1 Prerequisites

| Tool | Install |
|---|---|
| Node.js 20+ | `brew install node` |
| ngrok | `brew install ngrok` |

### 1.2 Install dependencies

```bash
git clone https://github.com/jerzagit/polaroid_glossy_backup.git
cd polaroid_glossy_backup
npm install
```

### 1.3 Create `.env.local`

Create this file in the project root. **Never commit it.**

```bash
# ── Database (SQLite for local dev) ─────────────────────────────────
DATABASE_URL="file:./dev.db"

# ── NextAuth ─────────────────────────────────────────────────────────
NEXTAUTH_SECRET="paste output of: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# ── Google OAuth ──────────────────────────────────────────────────────
# console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
# Add authorized redirect: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxx"

# ── ToyyibPay (SANDBOX) ───────────────────────────────────────────────
# Use sandbox credentials from toyyibpay.com
# Start ngrok first, then fill the two URL fields with your ngrok URL
TOYYIBPAY_SECRET_KEY="your-sandbox-secret-key"
TOYYIBPAY_CATEGORY_CODE="your-category-code"
TOYYIBPAY_BASE_URL="https://dev.toyyibpay.com"
TOYYIBPAY_RETURN_URL="https://YOUR-NGROK-ID.ngrok.io/payment-status"
TOYYIBPAY_CALLBACK_URL="https://YOUR-NGROK-ID.ngrok.io/api/toyyibpay/callback"

# ── Amazon S3 (DEV bucket) ────────────────────────────────────────────
# AWS Console → S3 → create bucket: polaroid-glossy-dev (ap-southeast-1)
# IAM → create user → attach AmazonS3FullAccess → create access key
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="xxxx"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="polaroid-glossy-dev"
```

### 1.4 Database setup

```bash
# Create tables in dev.db
npx prisma db push

# Open visual DB browser at http://localhost:5555
npx prisma studio
```

### 1.5 S3 dev bucket setup (one-time)

1. AWS Console → S3 → **Create bucket** → name: `polaroid-glossy-dev` → region: `ap-southeast-1`
2. **Uncheck** "Block all public access" (dev convenience only)
3. Add bucket policy for public read:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::polaroid-glossy-dev/*"
    }
  ]
}
```

### 1.6 Start all services

Open three terminals:

```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — ngrok tunnel (required for ToyyibPay payment callback)
ngrok http 3000
# Copy the https://xxx.ngrok.io URL
# → Paste into TOYYIBPAY_RETURN_URL and TOYYIBPAY_CALLBACK_URL in .env.local
# → Restart Terminal 1 after updating .env.local

# Terminal 3 — DB viewer (optional but very useful)
npx prisma studio
```

### 1.7 End-to-end test checklist

| Step | Action | Verify here |
|---|---|---|
| 1 | Open `http://localhost:3000` | — |
| 2 | Sign in with Google | Prisma Studio → `User` table |
| 3 | Browse products → pick 4R → Start Creating | — |
| 4 | Upload 2–3 JPG or HEIC photos | AWS S3 console → `polaroid-glossy-dev/orders/` |
| 5 | Add custom text to a photo | — |
| 6 | Add to cart → checkout → fill name/email/phone/state | — |
| 7 | Select ToyyibPay → Place Order | Prisma Studio → `Order` (status: pending) |
| 8 | Complete payment on ToyyibPay sandbox page | Prisma Studio → `Order` (status: processing, paymentStatus: paid) |
| 9 | Redirected to `/payment-status` | Check order number shown |
| 10 | Inspect stored image URLs | Prisma Studio → `OrderItem` → `images` field = S3 URLs |

---

## 2. Production Deployment

### 2.1 Prisma — switch to PostgreSQL

Edit `prisma/schema.prisma`:

```prisma
// Change provider from "sqlite" to "postgresql"
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run migrations against the production database:

```bash
npx prisma migrate deploy
```

### 2.2 Production environment variables

Set these on your hosting platform (Vercel dashboard, or server `.env`):

```bash
# ── Database (PostgreSQL — Supabase or AWS RDS) ──────────────────────
DATABASE_URL="postgresql://user:password@host:5432/polaroid_glossy?sslmode=require"

# ── NextAuth ─────────────────────────────────────────────────────────
NEXTAUTH_SECRET="long-random-secret-min-32-chars"
NEXTAUTH_URL="https://polaroidglossy.my"

# ── Google OAuth ──────────────────────────────────────────────────────
# Add authorized redirect in Google Console:
# https://polaroidglossy.my/api/auth/callback/google
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxx"

# ── ToyyibPay (LIVE keys) ─────────────────────────────────────────────
TOYYIBPAY_SECRET_KEY="your-live-secret-key"
TOYYIBPAY_CATEGORY_CODE="your-live-category-code"
TOYYIBPAY_BASE_URL="https://toyyibpay.com"
TOYYIBPAY_RETURN_URL="https://polaroidglossy.my/payment-status"
TOYYIBPAY_CALLBACK_URL="https://polaroidglossy.my/api/toyyibpay/callback"

# ── Amazon S3 (PROD bucket) ───────────────────────────────────────────
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="xxxx"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="polaroid-glossy-prod"
```

### 2.3 S3 production bucket setup

1. Create bucket: `polaroid-glossy-prod` (ap-southeast-1)
2. Keep "Block all public access" **ON**
3. Set up a **CloudFront distribution** pointing to the bucket — serve images via CDN
4. Scope the IAM policy to minimum required:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::polaroid-glossy-prod/*"
    }
  ]
}
```

5. Update `src/lib/s3.ts` — replace the returned URL with your CloudFront domain:

```ts
// Change this line in uploadToS3():
return `https://YOUR-CLOUDFRONT-ID.cloudfront.net/${key}`;
```

### 2.4 Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel --prod

# Set env vars via CLI (or paste into Vercel dashboard)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... repeat for all vars
```

### 2.5 Deploy to VPS (alternative)

```bash
npm run build

# Process manager
npm install -g pm2
pm2 start npm --name "polaroid-glossy" -- start
pm2 save && pm2 startup
```

Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name polaroidglossy.my www.polaroidglossy.my;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2.6 Production go-live checklist

- [ ] PostgreSQL database provisioned (Supabase free tier is fine)
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] All environment variables set on hosting platform
- [ ] Google OAuth redirect URI updated to production domain
- [ ] ToyyibPay switched to **live** keys and `TOYYIBPAY_BASE_URL=https://toyyibpay.com`
- [ ] S3 prod bucket created with CloudFront in front
- [ ] `AWS_S3_BUCKET` points to prod bucket
- [ ] `src/lib/s3.ts` updated to return CloudFront URL
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] SSL certificate active (Vercel handles automatically)
- [ ] Full end-to-end order test done on production before announcing

---

## 3. Image Storage Flow

```
User selects photo
      │
      ▼
compressImage()          ← client-side, WhatsApp HD (max 2048px, 80% JPEG)
      │
      ▼
POST /api/upload         ← Next.js server
      │  validates type (JPG/PNG/WEBP/HEIC) + size (≤ 25 MB)
      ▼
S3 PutObject
      │  key: orders/YYYY-MM-DD/{uuid}.jpg
      ▼
returns S3 URL           ← stored in photo.s3Url (state)
      │
      ▼
POST /api/orders         ← on checkout
      │  item.images = [s3Url, s3Url, ...]
      ▼
OrderItem.images in DB   ← JSON array of permanent S3/CloudFront URLs
```

**Dev:** `https://polaroid-glossy-dev.s3.ap-southeast-1.amazonaws.com/orders/...`

**Prod:** `https://YOUR-CLOUDFRONT-ID.cloudfront.net/orders/...`
