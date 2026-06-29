# Environment Configuration

All environment variables for local development and production.

---

## Full Variable Reference

| Variable | Required | Dev Value | Description |
|----------|----------|-----------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite (dev) or PostgreSQL URL (prod) |
| `NEXTAUTH_SECRET` | Yes | any long string | Session encryption key |
| `NEXTAUTH_URL` | Yes | ngrok HTTPS URL | Base URL of the app (must be public for OAuth) |
| `GOOGLE_CLIENT_ID` | Yes | from Google Console | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | from Google Console | Google OAuth client secret |
| `TOYYIBPAY_SECRET_KEY` | Yes | sandbox key | ToyyibPay merchant secret |
| `TOYYIBPAY_CATEGORY_CODE` | Yes | sandbox code | ToyyibPay category code |
| `TOYYIBPAY_BASE_URL` | Yes | `https://dev.toyyibpay.com` | Sandbox or live ToyyibPay base URL |
| `TOYYIBPAY_RETURN_URL` | Yes | ngrok URL + `/payment-status` | Redirect after payment |
| `TOYYIBPAY_CALLBACK_URL` | Yes | ngrok URL + `/api/toyyibpay/callback` | ToyyibPay webhook |
| `AWS_ACCESS_KEY_ID` | Yes | IAM access key | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM secret key | AWS credentials |
| `AWS_REGION` | Yes | `us-east-1` or `ap-southeast-1` | S3 bucket region |
| `AWS_S3_BUCKET` | Yes | `polaroid-glossy-dev` | S3 bucket name |

---

## Development `.env`

```env
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_SECRET=polaroidglossymy-local-dev-secret-key-2024
NEXTAUTH_URL=https://YOUR-NGROK-ID.ngrok-free.dev

# Google OAuth
# console.cloud.google.com → Credentials → OAuth 2.0
# Authorized JavaScript origins: http://localhost:3000 + ngrok URL
# Authorized redirect URIs: http://localhost:3000/api/auth/callback/google + ngrok URL
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay (sandbox)
TOYYIBPAY_SECRET_KEY=your-sandbox-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com
TOYYIBPAY_RETURN_URL=https://YOUR-NGROK-ID.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://YOUR-NGROK-ID.ngrok-free.dev/api/toyyibpay/callback

# Amazon S3 (dev bucket)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=polaroid-glossy-dev
```

## Production `.env`

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/polaroid_glossy?sslmode=require

# NextAuth
NEXTAUTH_SECRET=long-random-string-min-32-chars
NEXTAUTH_URL=https://polaroidglossy.my

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ToyyibPay (live)
TOYYIBPAY_SECRET_KEY=your-live-secret-key
TOYYIBPAY_CATEGORY_CODE=your-live-category-code
TOYYIBPAY_BASE_URL=https://toyyibpay.com
TOYYIBPAY_RETURN_URL=https://polaroidglossy.my/payment-status
TOYYIBPAY_CALLBACK_URL=https://polaroidglossy.my/api/toyyibpay/callback

# Amazon S3 (prod bucket + CloudFront)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=polaroid-glossy-prod
```

---

## Google OAuth Setup

### Dev — Google Console settings
- **Authorized JavaScript origins:**
  ```
  http://localhost:3000
  https://YOUR-NGROK-ID.ngrok-free.dev
  ```
- **Authorized redirect URIs:**
  ```
  http://localhost:3000/api/auth/callback/google
  https://YOUR-NGROK-ID.ngrok-free.dev/api/auth/callback/google
  ```

### Prod — Google Console settings
- **Authorized JavaScript origins:** `https://polaroidglossy.my`
- **Authorized redirect URIs:** `https://polaroidglossy.my/api/auth/callback/google`

---

## ToyyibPay Setup

ToyyibPay cannot reach `localhost` — a public URL is required even for local dev.

| Environment | Base URL | How to get public URL |
|---|---|---|
| Development | `https://dev.toyyibpay.com` | ngrok |
| Production | `https://toyyibpay.com` | your domain |

**Sandbox test credentials** are available after registering at [toyyibpay.com](https://toyyibpay.com).

---

## Amazon S3 Setup

### Dev bucket (one-time)

1. AWS Console → S3 → **Create bucket**
2. Name: `polaroid-glossy-dev`, Region: your nearest region
3. Uncheck **"Block all public access"** (dev convenience)
4. Add bucket policy (Permissions tab → Bucket policy):

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

### IAM credentials

1. IAM → Users → Create user → attach **AmazonS3FullAccess**
2. Security credentials → Create access key → Application outside AWS
3. Copy **Access key ID** and **Secret access key**

### Region note

Whatever region your bucket is in, set `AWS_REGION` to that same value.
Image URLs will be: `https://{bucket}.s3.{region}.amazonaws.com/orders/...`

---

## Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Security Notes

- Never commit `.env` to git (it is in `.gitignore`)
- Use different secrets for dev and prod
- In production, use a scoped IAM policy — not `AmazonS3FullAccess`
- Rotate `NEXTAUTH_SECRET` if compromised — it invalidates all active sessions
