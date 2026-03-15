# Local Development Setup

Complete guide to get the app running locally with login, image upload, and payment all working end-to-end.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js 20+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| npm | comes with Node.js |
| ngrok | `brew install ngrok/ngrok/ngrok` |
| AWS account | [aws.amazon.com](https://aws.amazon.com) (free tier is fine) |
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

## Step 2 — ngrok (do this first — you need the URL for Google + ToyyibPay)

Sign up at [dashboard.ngrok.com](https://dashboard.ngrok.com) (free), then:

```bash
# Add your authtoken (one-time)
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Start tunnel
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.dev` URL — you need it in the next steps.

> **Tip:** Get a free static domain at ngrok dashboard → Domains so the URL never changes between restarts.

---

## Step 3 — Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. **Create Credentials** → OAuth 2.0 Client ID → Web application
3. Add to **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://YOUR-NGROK-URL.ngrok-free.dev
   ```
4. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://YOUR-NGROK-URL.ngrok-free.dev/api/auth/callback/google
   ```
5. Copy **Client ID** and **Client Secret**

---

## Step 4 — ToyyibPay (sandbox)

1. Register at [toyyibpay.com](https://toyyibpay.com)
2. Dashboard → get your **Secret Key** and **Category Code**
3. Use sandbox base URL: `https://dev.toyyibpay.com`

---

## Step 5 — Amazon S3

### Create the bucket

1. [s3.console.aws.amazon.com](https://s3.console.aws.amazon.com) → **Create bucket**
2. Name: `polaroid-glossy-dev`
3. Region: pick the one closest to you
4. Uncheck **"Block all public access"** → acknowledge warning
5. Create bucket
6. Go to bucket → **Permissions** tab → **Bucket policy** → paste:

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

1. [console.aws.amazon.com/iam](https://console.aws.amazon.com/iam) → **Users** → **Create user**
2. Name: `polaroid-glossy-dev`
3. Attach policy: **AmazonS3FullAccess**
4. After creating → **Security credentials** tab → **Create access key**
5. Use case: **Application running outside AWS**
6. Copy **Access key ID** and **Secret access key** (only shown once)

---

## Step 6 — Fill in `.env`

Edit the `.env` file in the project root:

```env
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_SECRET=polaroidglossymy-local-dev-secret-key-2024
NEXTAUTH_URL=https://YOUR-NGROK-URL.ngrok-free.dev

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay (sandbox)
TOYYIBPAY_SECRET_KEY=your-sandbox-secret
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com
TOYYIBPAY_RETURN_URL=https://YOUR-NGROK-URL.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok-free.dev/api/toyyibpay/callback

# Amazon S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=us-east-1        # match the region of your bucket
AWS_S3_BUCKET=polaroid-glossy-dev
```

---

## Step 7 — Database Setup

```bash
# Create tables in dev.db
npx prisma db push

# Open visual DB browser (keep this running in its own terminal)
npx prisma studio
# → http://localhost:5555
```

---

## Step 8 — Start the App

```bash
npm run dev
# → http://localhost:3000
```

**Access via the ngrok URL** (not localhost) so Google OAuth works:
`https://YOUR-NGROK-URL.ngrok-free.dev`

---

## End-to-End Test Checklist

| Step | Action | Verify |
|------|--------|--------|
| 1 | Open ngrok URL in browser | Page loads |
| 2 | Sign in with Google | Prisma Studio → `User` table |
| 3 | Browse Products → pick 4R → Start Creating | — |
| 4 | Upload 2–3 photos (JPG or HEIC) | AWS S3 console → `polaroid-glossy-dev/orders/` folder |
| 5 | Add custom text to a photo | — |
| 6 | Add to cart → Checkout → fill name/email/phone/state | — |
| 7 | Select ToyyibPay → Place Order | Prisma Studio → `Order` (status: pending) |
| 8 | Complete payment on ToyyibPay sandbox page | Prisma Studio → `Order` (status: processing, paymentStatus: paid) |
| 9 | Redirected to `/payment-status` | Order number shown |
| 10 | Check image URLs | Prisma Studio → `OrderItem` → `images` = S3 URLs |

---

## Database Management

```bash
# Visual browser (recommended)
npx prisma studio        # → http://localhost:5555

# Reset all tables
npx prisma db push --force-reset

# Raw SQLite access
sqlite3 prisma/dev.db
```

---

## Common Issues

### ngrok URL changed after restart
Update `NEXTAUTH_URL`, `TOYYIBPAY_RETURN_URL`, `TOYYIBPAY_CALLBACK_URL` in `.env`, update Google Console redirect URIs, then restart `npm run dev`.

**Fix:** Use ngrok's free static domain (dashboard → Domains) — same URL every time.

### "NEXTAUTH_URL mismatch"
The URL you're accessing the app from must match `NEXTAUTH_URL` in `.env`. Always access via the ngrok URL, not `localhost`.

### S3 upload fails
- Check `AWS_REGION` matches the bucket's region exactly
- Check bucket policy allows public read
- Check IAM user has `AmazonS3FullAccess`

### ToyyibPay callback not received
- Confirm ngrok is running and URL matches `.env`
- Check Terminal 1 (npm run dev) logs for incoming POST to `/api/toyyibpay/callback`

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
```
