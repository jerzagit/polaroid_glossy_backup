# Deploying the Frontend to Vercel

This Next.js app is a **thin client** of the Spring Boot backend
(`https://polaroid-glossy-backend.fly.dev`), which owns the database,
authentication, payments, and file uploads. The frontend has **no database
dependency** (Prisma/SQLite was removed) and runs entirely on Vercel's
serverless platform.

## 1. Push the cleaned-up branch to GitHub

```bash
git add -A
git commit -m "chore: make frontend Vercel-ready (remove local DB layer, fix build)"
git push frontend feature/local-backend-payment-mock
```

> The `frontend` remote points at `jerzagit/polaroid_glossy_backup.git`.

## 2. Import the project in Vercel

1. Go to <https://vercel.com/new>
2. Import the **`polaroid_glossy_backup`** repository.
3. Framework preset: **Next.js** (auto-detected).
4. Build & Output settings — leave defaults:
   - Build Command: `next build` (Vercel reads it from `package.json`)
   - Output Directory: `.next`
   - Install Command: `npm install` (or `bun install` if you enable Bun)
5. Click **Deploy**.

## 3. Environment Variables (Vercel → Project → Settings → Environment Variables)

Add these for the **Production** (and Preview) environments:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_API_BASE` | `https://polaroid-glossy-backend.fly.dev/api` |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>.vercel.app` |
| `NEXTAUTH_SECRET` | generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | your Google OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` (only if frontend needs direct Supabase access) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key (optional, see above) |

**Do NOT** set `NEXT_PUBLIC_MOCK_PAYMENTS` in production (it enables a fake
payment path). ToyyibPay keys are configured on the **backend** (Fly secrets),
not here.

## 4. Google OAuth redirect URIs

In the Google Cloud Console → APIs & Services → Credentials → your OAuth
client, add the Vercel URLs to **Authorized redirect URIs**:

```
https://<your-vercel-domain>.vercel.app/api/auth/callback/google
https://<your-vercel-domain>-<branch>.vercel.app/api/auth/callback/google   (preview deploys)
```

## 5. Backend CORS

Ensure the Spring Boot backend allows the Vercel origin
(`https://<your-vercel-domain>.vercel.app`) in its CORS configuration, since
the browser calls the backend directly.

## 6. ToyyibPay return URL

On the backend (Fly secrets), set the ToyyibPay return URL to your Vercel
payment-status page so customers land back on the frontend after paying:

```
TOYYIBPAY_RETURN_URL=https://<your-vercel-domain>.vercel.app/payment-status
```

## Notes

- `output: "standalone"` was removed — Vercel handles the build output itself.
- The old local API routes (`/api/orders`, `/api/print-sizes`, `/api/reviews`,
  `/api/toyyibpay/*`, `/api/user/profile`) and `/auth/callback` were removed;
  the backend serves all of these. Only `/api` (health) and
  `/api/auth/[...nextauth]` (Google OAuth) remain on the frontend.
- `next.config.ts` still has `typescript.ignoreBuildErrors: true`; you may want
  to remove that later to catch type errors at build time.
