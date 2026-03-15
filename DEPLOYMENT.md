# Deployment Guide — Polaroid Glossy

Read top-to-bottom the first time. Use the quick reference table when switching environments.

---

## Quick Reference — Dev vs Production

| Setting | Development (current) | Production |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite) | PostgreSQL connection string |
| `NEXTAUTH_URL` | ngrok HTTPS URL | `https://polaroidglossy.my` |
| `TOYYIBPAY_BASE_URL` | `https://dev.toyyibpay.com` (sandbox) | `https://toyyibpay.com` (live) |
| `TOYYIBPAY_RETURN_URL` | `{ngrok}/payment-status` | `https://polaroidglossy.my/payment-status` |
| `TOYYIBPAY_CALLBACK_URL` | `{ngrok}/api/toyyibpay/callback` | `https://polaroidglossy.my/api/toyyibpay/callback` |
| `AWS_S3_BUCKET` | `polaroid-glossy-dev` | `polaroid-glossy-prod` |
| `AWS_REGION` | `us-east-1` | `ap-southeast-1` (Singapore — closer to MY) |
| S3 image delivery | Direct S3 URL (public read) | CloudFront CDN |
| S3 IAM strategy | Shared single IAM user | Separate IAM users (Next.js + Spring Boot) |
| Google OAuth redirect | `http://localhost:3000` + ngrok URL | `https://polaroidglossy.my` only |
| Prisma provider | `sqlite` | `postgresql` |
| ToyyibPay keys | Sandbox keys | Live keys |

---

## 1. Local Development

### 1.1 Current Dev Credentials (already configured in `.env`)

| Variable | Value |
|---|---|
| `NEXTAUTH_URL` | `https://remissly-sirenic-jacinda.ngrok-free.dev` |
| `GOOGLE_CLIENT_ID` | `912176079688-q853e78d3l9n6tpatt72fj86iepato98.apps.googleusercontent.com` |
| `TOYYIBPAY_CATEGORY_CODE` | `npr3176z` |
| `TOYYIBPAY_BASE_URL` | `https://dev.toyyibpay.com` |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET` | `polaroid-glossy-dev` |
| `AWS_ACCESS_KEY_ID` | `AKIAT3ZKKEKVEGDA2FEW` |

> Secrets (`GOOGLE_CLIENT_SECRET`, `TOYYIBPAY_SECRET_KEY`, `AWS_SECRET_ACCESS_KEY`) are in `.env` — never commit.

### 1.2 Prerequisites

| Tool | Install |
|---|---|
| Node.js 20+ | `brew install node` |
| ngrok | `brew install ngrok/ngrok/ngrok` |

### 1.3 Install

```bash
git clone https://github.com/jerzagit/polaroid_glossy_backup.git
cd polaroid_glossy_backup
npm install
```

### 1.4 `.env` file (full template)

```env
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_SECRET=polaroidglossymy-local-dev-secret-key-2024
NEXTAUTH_URL=https://YOUR-NGROK-URL.ngrok-free.dev

# Google OAuth
# console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
# Authorized JavaScript origins: http://localhost:3000 + ngrok URL
# Authorized redirect URIs: http://localhost:3000/api/auth/callback/google + ngrok URL
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay (sandbox)
TOYYIBPAY_SECRET_KEY=your-sandbox-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com
TOYYIBPAY_RETURN_URL=https://YOUR-NGROK-URL.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok-free.dev/api/toyyibpay/callback

# Amazon S3 (dev — shared IAM user, Option A)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=polaroid-glossy-dev
```

### 1.5 S3 dev bucket (one-time setup)

1. AWS Console → S3 → **Create bucket** → `polaroid-glossy-dev` → region: `us-east-1`
2. **Uncheck** "Block all public access" (dev only)
3. Permissions tab → Bucket policy:

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

4. IAM → Users → Create user → attach `AmazonS3FullAccess` → Security credentials → Create access key

### 1.6 Database setup

```bash
npx prisma db push        # create/sync tables in dev.db
npx prisma studio         # visual DB browser → http://localhost:5555
```

### 1.7 Start all services

```bash
# Terminal 1 — App
npm run dev

# Terminal 2 — ngrok (required for ToyyibPay + Google OAuth via ngrok URL)
ngrok http 3000
# If ngrok URL changes: update NEXTAUTH_URL, TOYYIBPAY_RETURN_URL,
# TOYYIBPAY_CALLBACK_URL in .env, update Google Console redirect URIs,
# then restart Terminal 1

# Terminal 3 — DB viewer
npx prisma studio
```

> Access the app via the **ngrok URL**, not localhost — Google OAuth requires it.

### 1.8 End-to-end test checklist

| Step | Action | Verify |
|---|---|---|
| 1 | Open ngrok URL | App loads |
| 2 | Sign in with Google | Prisma Studio → `User` table |
| 3 | Products → 4R → Start Creating | — |
| 4 | Upload 2–3 JPG / HEIC photos | S3 console → `polaroid-glossy-dev/orders/` |
| 5 | Add custom text | — |
| 6 | Add to cart → Checkout → fill form | — |
| 7 | Select ToyyibPay → Place Order | Prisma Studio → `Order` status: `pending` |
| 8 | Complete payment on sandbox page | Prisma Studio → `Order` status: `processing`, paymentStatus: `paid` |
| 9 | Redirected to `/payment-status` | Order number shown |
| 10 | Check stored image URLs | Prisma Studio → `OrderItem.images` = S3 URLs |

### 1.9 Common issues

| Problem | Fix |
|---|---|
| ngrok URL changed | Update `NEXTAUTH_URL`, ToyyibPay URLs in `.env` + Google Console URIs → restart `npm run dev` |
| `NEXTAUTH_URL mismatch` | Always open app via ngrok URL, not `localhost` |
| S3 upload fails | Check `AWS_REGION` matches bucket region (`us-east-1`), check bucket policy, check IAM access key |
| ToyyibPay stuck on processing | Confirm `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` (sandbox, not live) |
| ToyyibPay callback not received | Check ngrok is running, check Terminal 1 logs for POST to `/api/toyyibpay/callback` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Prisma Studio port 5555 in use | Already running — open http://localhost:5555 |

---

## 2. Production Deployment

### 2.1 Code changes required

**`prisma/schema.prisma`** — change provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

**`src/lib/s3.ts`** — change returned URL to CloudFront:

```ts
// Replace the return line in uploadToS3():
return `https://YOUR-CLOUDFRONT-ID.cloudfront.net/${key}`;
```

Then run:

```bash
npx prisma migrate deploy   # applies migrations to PostgreSQL
```

### 2.2 Production environment variables

```env
# Database (PostgreSQL — Supabase or AWS RDS)
DATABASE_URL=postgresql://user:password@host:5432/polaroid_glossy?sslmode=require

# NextAuth
NEXTAUTH_SECRET=long-random-secret-min-32-chars  # openssl rand -base64 32
NEXTAUTH_URL=https://polaroidglossy.my

# Google OAuth
# Add redirect in Google Console: https://polaroidglossy.my/api/auth/callback/google
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay (LIVE keys — not sandbox)
TOYYIBPAY_SECRET_KEY=your-live-secret-key
TOYYIBPAY_CATEGORY_CODE=your-live-category-code
TOYYIBPAY_BASE_URL=https://toyyibpay.com
TOYYIBPAY_RETURN_URL=https://polaroidglossy.my/payment-status
TOYYIBPAY_CALLBACK_URL=https://polaroidglossy.my/api/toyyibpay/callback

# Amazon S3 (prod bucket, Next.js IAM — PutObject only)
AWS_ACCESS_KEY_ID=AKIA...        # separate IAM user for Next.js (Option B)
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=ap-southeast-1        # Singapore — closest to Malaysia
AWS_S3_BUCKET=polaroid-glossy-prod
```

### 2.3 S3 production bucket + CloudFront

1. Create bucket: `polaroid-glossy-prod` (region: `ap-southeast-1`)
2. Keep **"Block all public access" ON**
3. Create **CloudFront distribution** → origin: the S3 bucket
4. Create **two IAM users** (Option B — least privilege):

**Next.js IAM** (`polaroid-nextjs-prod`) — upload only:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": "arn:aws:s3:::polaroid-glossy-prod/*"
  }]
}
```

**Spring Boot IAM** (`polaroid-backend-prod`) — read + delete only:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::polaroid-glossy-prod/*"
  }]
}
```

### 2.4 Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel --prod

# Add env vars in Vercel dashboard or via CLI:
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add TOYYIBPAY_SECRET_KEY production
vercel env add TOYYIBPAY_CATEGORY_CODE production
vercel env add TOYYIBPAY_BASE_URL production
vercel env add TOYYIBPAY_RETURN_URL production
vercel env add TOYYIBPAY_CALLBACK_URL production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
vercel env add AWS_S3_BUCKET production
```

### 2.5 Deploy to VPS (alternative)

```bash
npm run build

npm install -g pm2
pm2 start npm --name "polaroid-glossy" -- start
pm2 save && pm2 startup
```

Nginx:
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

### 2.6 Go-live checklist

- [ ] `prisma/schema.prisma` changed to `provider = "postgresql"`
- [ ] `npx prisma migrate deploy` run against production PostgreSQL
- [ ] All environment variables set on hosting platform
- [ ] `NEXTAUTH_URL` = production domain
- [ ] Google OAuth redirect URI updated to production domain
- [ ] `TOYYIBPAY_BASE_URL=https://toyyibpay.com` (live, not sandbox)
- [ ] ToyyibPay live keys configured
- [ ] `polaroid-glossy-prod` S3 bucket created (ap-southeast-1)
- [ ] CloudFront distribution created and pointed to prod bucket
- [ ] `src/lib/s3.ts` updated to return CloudFront URL
- [ ] Separate IAM users created (Next.js PutObject only, Spring Boot GetObject only)
- [ ] `AWS_S3_BUCKET=polaroid-glossy-prod` set
- [ ] SSL certificate active (Vercel handles automatically)
- [ ] Full end-to-end order test on production before launch

---

## 3. Image Storage Flow

```
User selects photo
      │
      ▼
compressImage()              ← client-side (max 2048px, 80% JPEG)
      │
      ▼
POST /api/upload             ← Next.js server validates type + size (≤25MB)
      │
      ▼
S3 PutObject                 ← key: orders/YYYY-MM-DD/{uuid}.jpg
      │
      ▼
S3 URL → photo.s3Url         ← stored in React state
      │
      ▼
POST /api/orders             ← on checkout, item.images = [s3Url, ...]
      │
      ▼
OrderItem.images in DB       ← permanent S3/CloudFront URLs

      │  (later, admin side)
      ▼
Spring Boot GET /api/admin/orders/{id}
      │  reads S3 URLs from OrderItem.images[]
      ▼
Spring Boot GET /api/admin/orders/{id}/images/download
      │  fetches each URL from S3, streams as ZIP
      ▼
Admin downloads ZIP of all customer photos for printing
```

**Dev image URL:**
`https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo.jpg`

**Prod image URL (via CloudFront):**
`https://YOUR-CLOUDFRONT-ID.cloudfront.net/orders/2026-03-15/photo.jpg`
