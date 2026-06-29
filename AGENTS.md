# Project Commands

## Development

```bash
bun run dev    # Start dev server on localhost:3000
bun run build  # Build for production (standalone output)
bun run start  # Start production server
bun run lint   # Run ESLint
```

## Database

```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database (dev)
bun run db:migrate   # Run migrations
bun run db:reset     # Reset database (drops all data)
npx prisma studio    # Open DB GUI at localhost:5555
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

- **Bank Transfer** - Manual, admin confirms
- **ToyyibPay** - Online payment (FPX, card, e-wallet)

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

## Next.js 16 Gotcha: Async Params

Route handler `params` must be awaited in Next.js 15+:

```ts
// ✅ Correct
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```
