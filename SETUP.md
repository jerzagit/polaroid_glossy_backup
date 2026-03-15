# Local Development Setup

Complete guide to get the app running locally with Google login, S3 image upload, and ToyyibPay payment — end-to-end.

---

## Current Dev Configuration (already set up)

All credentials below are already configured in `.env`. This section is a reference for onboarding a new dev or resetting the environment.

| What | Value |
|---|---|
| ngrok URL | `https://remissly-sirenic-jacinda.ngrok-free.dev` |
| Google Client ID | `912176079688-q853e78d3l9n6tpatt72fj86iepato98.apps.googleusercontent.com` |
| ToyyibPay | **Production** — category `npr3176z`, base `https://toyyibpay.com` |
| S3 Bucket | `polaroid-glossy-dev` (region: `us-east-1`) |
| S3 IAM User | `polaroid-glossy-dev-user` (Access Key ID: `AKIAT3ZKKEKVEGDA2FEW`) |
| DB | PostgreSQL local — `polaroid_glossy_dev` (dev) / `polaroid_glossy_uat` (UAT) |
| Prisma Studio | http://localhost:5555 |

> **Share the S3 Secret Access Key with the Spring Boot backend dev** — same IAM user, same bucket for dev (Option A). See `BACKEND_HANDOFF.md` § 3 for details.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js 20+ | `brew install node` |
| npm | comes with Node.js |
| ngrok | `brew install ngrok/ngrok/ngrok` |
| AWS account | [aws.amazon.com](https://aws.amazon.com) (free tier) |
| Google Cloud account | [console.cloud.google.com](https://console.cloud.google.com) |
| ToyyibPay account | [toyyibpay.com](https://toyyibpay.com) |

---

## Step 1 — Clone & Install

```bash
git clone https://github.com/jerzagit/polaroid_glossy_backup.git
cd polaroid_glossy_backup
npm install
```

---

## Step 2 — ngrok (start this first)

ngrok gives ToyyibPay and Google OAuth a public HTTPS URL to reach your local machine.

```bash
# One-time: add authtoken from dashboard.ngrok.com
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Start tunnel
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.dev` URL — you'll need it for Google Console and `.env`.

> **Tip:** Get a **free static domain** at ngrok dashboard → Domains. Same URL every restart — no need to update `.env` or Google Console each time.

---

## Step 3 — Google OAuth (one-time)

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. **Create Credentials** → OAuth 2.0 Client ID → Web application
3. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://YOUR-NGROK-URL.ngrok-free.dev
   ```
4. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://YOUR-NGROK-URL.ngrok-free.dev/api/auth/callback/google
   ```
5. Copy **Client ID** and **Client Secret** → paste into `.env`

---

## Step 4 — ToyyibPay Sandbox (one-time)

1. Register at [toyyibpay.com](https://toyyibpay.com)
2. Dashboard → copy **Secret Key** and **Category Code**
3. In `.env` set `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` (sandbox)

> **Important:** The app reads `TOYYIBPAY_BASE_URL` to decide sandbox vs live. Never hardcode the URL. See `src/app/api/toyyibpay/create-bill/route.ts`.

---

## Step 5 — Amazon S3 (one-time)

### Create bucket

1. [s3.console.aws.amazon.com](https://s3.console.aws.amazon.com) → **Create bucket**
2. Name: `polaroid-glossy-dev` — Region: pick closest (we use `us-east-1`)
3. **Uncheck** "Block all public access" → acknowledge warning
4. Permissions tab → **Bucket policy** → paste:

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

### Create IAM credentials

1. IAM → **Users** → **Create user** → name: `polaroid-glossy-dev-user`
2. Attach policy: **AmazonS3FullAccess** (dev only — scoped in production)
3. User → **Security credentials** tab → **Create access key**
4. Use case: **Application running outside AWS**
5. Copy **Access key ID** and **Secret access key** (only shown once)

> For production, create **two separate IAM users** with scoped policies — see `DEPLOYMENT.md` § 2.3 and `BACKEND_HANDOFF.md` § 3.

---

## Step 6 — Fill in `.env`

```env
# Database (PostgreSQL local)
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/polaroid_glossy_dev

# NextAuth
NEXTAUTH_SECRET=polaroidglossymy-local-dev-secret-key-2024
NEXTAUTH_URL=https://YOUR-NGROK-URL.ngrok-free.dev

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay — use PRODUCTION keys + URL (sandbox keys won't work with prod URL)
TOYYIBPAY_SECRET_KEY=your-toyyibpay-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_BASE_URL=https://toyyibpay.com
TOYYIBPAY_RETURN_URL=https://YOUR-NGROK-URL.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok-free.dev/api/toyyibpay/callback

# Amazon S3 (dev — shared IAM user, Option A)
AWS_ACCESS_KEY_ID=AKIAT3ZKKEKVEGDA2FEW
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=polaroid-glossy-dev
```

---

## Step 7 — Database

```bash
# Create local PostgreSQL databases (one-time)
createdb polaroid_glossy_dev
createdb polaroid_glossy_uat

# Push schema to dev database
npx prisma db push

# Seed print sizes (run once per fresh database)
psql polaroid_glossy_dev -c "
INSERT INTO print_sizes (id, name, \"displayName\", width, height, price, description, \"isActive\", \"createdAt\", \"updatedAt\") VALUES
('2r','2R','2R (2.5×3.5 in)',2.5,3.5,3.00,'Wallet-size print',true,NOW(),NOW()),
('3r','3R','3R (3.5×5 in)',3.5,5.0,4.00,'Classic small print',true,NOW(),NOW()),
('4r','4R','4R (4×6 in)',4.0,6.0,5.00,'Most popular size',true,NOW(),NOW()),
('a4','A4','A4 (8.3×11.7 in)',8.27,11.69,12.00,'Large format print',true,NOW(),NOW())
ON CONFLICT (id) DO NOTHING;"

# Visual browser — keep open in a separate terminal
npx prisma studio     # → http://localhost:5555
```

### Tables to know

| Table | Purpose |
|---|---|
| `User` | Google OAuth accounts |
| `Order` | Customer orders — check status + paymentStatus |
| `OrderItem` | Line items — `images` field contains S3 URLs |
| `OrderStatusHistory` | Audit trail of status changes |
| `PrintSize` | 2R, 3R, 4R, A4 pricing |
| `ProductMeta` | Marketing content (images, descriptions, TikTok) |

---

## Step 8 — Start the App

```bash
# Terminal 1
npm run dev          # → http://localhost:3000

# Terminal 2
ngrok http 3000      # → https://xxxx.ngrok-free.dev

# Terminal 3
npx prisma studio    # → http://localhost:5555
```

**Always open the app via the ngrok URL** — not localhost. Google OAuth requires a matching `NEXTAUTH_URL`.

---

## End-to-End Test Checklist

| Step | Action | Verify |
|------|--------|--------|
| 1 | Open `https://YOUR-NGROK-URL.ngrok-free.dev` | App loads |
| 2 | Sign in with Google | Prisma Studio → `User` table has your account |
| 3 | Products → pick 4R → Start Creating | Upload interface opens with 4R pre-selected |
| 4 | Upload 2–3 JPG or HEIC photos | AWS S3 console → `polaroid-glossy-dev/orders/YYYY-MM-DD/` folder |
| 5 | Add custom text to one photo | — |
| 6 | Add to cart → Checkout → fill name / email / phone / state | — |
| 7 | Select ToyyibPay → Place Order | Prisma Studio → `Order` status: `pending` |
| 8 | Complete payment on ToyyibPay sandbox | Prisma Studio → `Order` status: `processing`, paymentStatus: `paid` |
| 9 | Redirected to `/payment-status` | Order number displayed |
| 10 | Inspect image URLs | Prisma Studio → `OrderItem.images` = S3 HTTPS URLs (not base64) |

---

## Database Management

```bash
# Visual browser (recommended)
npx prisma studio                  # http://localhost:5555

# Reset all data (keeps schema)
npx prisma db push --force-reset

# Raw SQL access
sqlite3 prisma/dev.db
.tables
SELECT * FROM orders;
.quit
```

---

## Common Issues

### ngrok URL changed after restart
Update `NEXTAUTH_URL`, `TOYYIBPAY_RETURN_URL`, `TOYYIBPAY_CALLBACK_URL` in `.env` and Google Console redirect URIs → restart `npm run dev`.
**Permanent fix:** Use ngrok free static domain (dashboard → Domains).

### App shows auth error / redirect loop
`NEXTAUTH_URL` in `.env` must match the URL you're accessing. If you open `localhost:3000`, set `NEXTAUTH_URL=http://localhost:3000`. If you open via ngrok, set it to the ngrok URL.

### ToyyibPay stuck on processing / payment page broken
- Confirm `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` (sandbox, not `toyyibpay.com`)
- Check Terminal 1 logs — should show `Creating ToyyibPay bill...` then `ToyyibPay bill response:`

### ToyyibPay callback not received
- Confirm ngrok is running
- Check Terminal 1 for `POST /api/toyyibpay/callback` log entry
- Order status won't update to `processing` without the callback

### S3 upload fails
- `AWS_REGION` must exactly match bucket's region (`us-east-1`)
- Bucket policy must allow public `s3:GetObject`
- IAM user must have `AmazonS3FullAccess` (or at minimum `s3:PutObject`)

### Prisma Studio port 5555 already in use
It's already running — open http://localhost:5555 directly.

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
```
