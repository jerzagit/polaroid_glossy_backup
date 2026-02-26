# Environment Configuration

This guide explains all environment variables and how to switch between development and production environments.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database file path |
| `NEXTAUTH_SECRET` | Yes | Random string for session encryption |
| `NEXTAUTH_URL` | Yes | Your domain URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `TOYYIBPAY_SECRET_KEY` | Yes | ToyyibPay API secret |
| `TOYYIBPAY_CATEGORY_CODE` | Yes | ToyyibPay category code |
| `TOYYIBPAY_RETURN_URL` | Yes | Payment return page URL |
| `TOYYIBPAY_CALLBACK_URL` | Yes | Payment webhook URL |

## Development vs Production

### Development (.env)

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
TOYYIBPAY_RETURN_URL=http://localhost:3000/payment-status
TOYYIBPAY_CALLBACK_URL=http://localhost:3000/api/toyyibpay/callback
```

### Production (.env)

```env
DATABASE_URL=file:./db/production.db
NEXTAUTH_URL=https://your-domain.com
TOYYIBPAY_RETURN_URL=https://your-domain.com/payment-status
TOYYIBPAY_CALLBACK_URL=https://your-domain.com/api/toyyibpay/callback
```

## Switching Environments

### Step 1: Edit .env

```bash
# For production, update these variables:
DATABASE_URL=file:./db/production.db
NEXTAUTH_URL=https://your-domain.com
TOYYIBPAY_RETURN_URL=https://your-domain.com/payment-status
TOYYIBPAY_CALLBACK_URL=https://your-domain.com/api/toyyibpay/callback
```

### Step 2: Create Production Database

```bash
# Create db directory
mkdir -p db

# Update DATABASE_URL in .env, then:
bun run db:push
```

### Step 3: Rebuild

```bash
bun run build
```

### Step 4: Restart Server

```bash
bun run start
```

## Generating NEXTAUTH_SECRET

```bash
# Using Bun
bun run -e "console.log(crypto.randomUUID())"

# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Google OAuth Setup

### Development
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Production
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`

## ToyyibPay Setup

### Important: ToyyibPay Requires Public URLs

ToyyibPay's servers cannot reach `localhost`. For development, you need a public URL:

**Option 1: ngrok (Recommended for local development)**

```bash
# Install ngrok if not
 installed Start your# dev server first: bun run dev

# In another terminal, start ngrok tunnel
ngrok http 3000

# Update .env with theexample ngrok URL ():
TOYYIBPAY_RETURN_URL=https://your-ngrok-url.ngrok-free.dev/payment-status
TOYYIBPAY_CALLBACK_URL=https://your-ngrok-url.ngrok-free.dev/api/toyyibpay/callback

# Restart dev server for changes to take effect
```

**Option 2: Deploy to a public server**

Use your production domain URL.

### ToyyibPay Dashboard Configuration

- Return URL: `https://your-url/payment-status`
- Callback URL: `https://your-url/api/toyyibpay/callback`

Update these URLs in your ToyyibPay merchant dashboard.

## Security Notes

- Never commit `.env` to version control
- Use different secrets for development and production
- Keep `NEXTAUTH_SECRET` private - it's used for session encryption
- Rotate secrets periodically in production
