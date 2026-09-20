# Project Commands

## Development

```bash
npm run dev    # Start dev server on localhost:3000
npm run build  # Build for production (standalone output)
npm run start  # Start production server
npm run lint   # Run ESLint
```

## Database

```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database (dev)
npx prisma migrate dev   # Run migrations
npx prisma migrate reset # Reset database (drops all data)
npx prisma studio        # Open DB GUI at localhost:5555
```

## Environment

- Development: `.env` with localhost URLs
- Production: Update `NEXTAUTH_URL`, `TOYYIBPAY_*_URL` to production domain
- Database: SQLite at `file:./dev.db` (dev) or `file:./db/production.db` (prod)

## Key Dependencies

- **Bun** - Package manager and runtime
- **Next.js 16** - Full-stack React framework (App Router + Turbopack)
- **Prisma** - ORM with SQLite
- **NextAuth.js** - Google OAuth authentication
- **Supabase** - Image storage (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **ToyyibPay** - Malaysian payment gateway
- **Framer Motion** - Page and card animations
- **Caddy** - Reverse proxy (port 81 → localhost:3000)
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **heic2any** - HEIC image conversion (client-side)

## Project Layout

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth.js Google OAuth
│   │   ├── orders/               # Order CRUD
│   │   ├── products/             # Product catalog
│   │   │   ├── route.ts          # GET /api/products (list)
│   │   │   └── [id]/route.ts     # GET /api/products/:id (detail)
│   │   ├── print-sizes/          # Legacy print size catalog
│   │   ├── reviews/              # Customer reviews (CRUD)
│   │   ├── toyyibpay/
│   │   │   ├── callback/         # ToyyibPay webhook
│   │   │   └── create-bill/      # Create payment bill
│   │   └── user/profile/         # User profile
│   ├── products/[id]/            # Product detail page
│   │   └── page.tsx
│   ├── payment-status/           # Payment result page
│   ├── faq/                      # FAQ page
│   └── page.tsx                  # Home page (upload flow)
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── ProductCatalog.tsx        # Futuristic product card grid
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── LanguageContext.tsx       # ENG/MY i18n
├── data/
│   └── products-meta.json        # Product marketing metadata
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── imageCompression.ts       # Client-side image compression + HEIC
│   ├── supabase/                 # Supabase client (browser + server)
│   └── utils.ts
└── providers/
```

## Print Sizes (Default / Fallback)

| ID | Name | Size | Price |
|----|------|------|-------|
| `2r` | 2R | 2.5 × 3.5 in | RM 0.50 |
| `3r` | 3R | 3.5 × 5 in | RM 0.75 |
| `4r` | 4R | 4 × 6 in | RM 1.00 |
| `a4` | A4 | 8.3 × 11.7 in | RM 3.50 |

Prices are stored in the `PrintSize` DB table. The above are fallback values used when the DB is unavailable.

## Product Metadata

Marketing data lives in `src/data/products-meta.json` — images, descriptions, tags, accent colors, features, TikTok video IDs, ratings. Edit this file to update product copy and media without touching the DB.

## Order Status Flow

```
pending → processing → posted → on_delivery → delivered
pending/processing → cancelled → refunded
```

## Payment Methods

- **ToyyibPay** (default) - Online payment (FPX, card, e-wallet)
- **Bank Transfer** - Manual, admin confirms

## Checkout Form Fields

| Field | Type | Required | Validation | Max |
|---|---|---|---|---|
| Full Name | text | Yes | Non-empty trimmed | 100 |
| Email | email | Yes | Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, red border on invalid | 254 |
| Phone | tel | Yes | Numeric only, `+60` prefix (non-editable, shown in input) | 10 digits |
| Address Line 1 | text | Yes | Non-empty trimmed | 200 |
| Address Line 2 | text | No | — | 200 |
| City | text | Yes | Non-empty trimmed | 100 |
| Postal / Zip Code | tel | Yes | Numeric only | 10 |
| State | select | Yes | 13 states + 3 federal territories | — |
| Country | text | Disabled | Pre-filled "Malaysia" | — |
| Notes | textarea | No | Character counter shown | 500 |

## Upload Progress

- `uploadProgress` state tracks `{ done, total }` during S3 upload
- UI shows "Uploading 2 / 5" in real-time after compression completes
- Spinner icon persists during both compression and S3 upload phases

## Caddyfile

Caddy runs on port 81 and reverse-proxies to the Next.js app on port 3000. The `XTransformPort` query param allows proxying to other local ports.

## Backend (Spring Boot)

A separate Java/Spring Boot service is planned in `backend-polaroid-glossy/`. See [backend_architecture.md](./backend_architecture.md) for details. Runs on port 8080.

## Common Debugging

```bash
# Test product API directly
curl -s http://localhost:3000/api/products | jq .
curl -s http://localhost:3000/api/products/4r | jq .

# Test reviews API
curl -s http://localhost:3000/api/reviews | jq .

# Check DB records
npx prisma studio
```

## Workflow: New Feature / Changes

1. **Branch**: `git checkout -b feat/<description>` from `local-dev`
2. **Code**: Make changes, test locally (`npm run dev`)
3. **Commit & Push**: `git add . && git commit -m "<type>: <description>" && git push origin <branch>`
4. **PR**: Create PR to `main` via GitHub (link printed after push)
5. **Merge**: Merge PR on GitHub → **Netlify auto-deploys production**
6. **Sync local-dev**: `git checkout local-dev && git merge main`
7. **If backend changes needed**, tell the backend team what endpoints/mock data to update

### Backend tiers

Every server route that talks to Spring Boot goes through `src/lib/backend.ts` (`apiBase`, `backendFetch`, `proxyOrFallback`) — no route builds its own `NEXT_PUBLIC_BACKEND_API_BASE` URL, and no route imports Prisma.

- **Tier 0 — static reads** (products, product detail, reviews, testimonials): fall back to hardcoded JSON from `src/data/products-meta.json` and route constants when the backend is unreachable, so browsing and marketing pages keep working offline.
- **Tier 1 — backend-owned writes and admin data** (orders, cart, addresses, user profile, upload, ToyyibPay, admin): never fabricate data. Return `503 { success: false, error: 'Backend unavailable' }` when the backend is down.

Client components never call the backend directly — they call the Next.js `/api/*` proxy, which forwards `Authorization`/`Cookie` server-side. The `backend_jwt` browser token lives behind `src/lib/auth-token.ts` (`getToken`/`setToken`/`clearToken`); do not read `localStorage` for it directly.

## Next.js 16 Gotcha: Async Params

Route handler `params` must be awaited in Next.js 15+:

```ts
// ✅ Correct
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

## Handoff: opencode → Command Code Desktop

Workflow: **opencode plans, Command Code executes.** Use opencode for research/planning, then hand off to Command Code Desktop which runs on **DeepSeek V4.1 Flash** (`deepseek/deepseek-v4.1-flash`, configured in `~/.commandcode/config.json`).

1. In opencode, plan the task (Tab → Plan mode).
2. Run `/handoff` — writes a self-contained `PLAN.md` (root) with goal, context, files, constraints, steps, verification.
3. In Command Code Desktop: open this repo, start a thread, reference `@PLAN.md`, and let it execute.
4. One-time setup already done: `cmd` v1.58.0 installed, Go plan subscribed, model default is `deepseek/deepseek-v4.1-flash`. Optionally run `/import opencode` in Command Code to pull over opencode skills/agents/commands/MCP/AGENTS.md.

Notes:

- `/import opencode` copies opencode skills/agents/commands/MCP into Command Code config (`~/.commandcode/` and `.commandcode/`); `AGENTS.md` stays the shared memory file for both.
- Session transcripts are NOT shared between the two tools — the handoff is always via `PLAN.md`.
- When Command Code finishes, review its changes and sync back to `local-dev` per the branch workflow above.
