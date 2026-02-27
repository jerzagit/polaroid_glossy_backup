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
```

## Environment

- Development: `.env` with localhost URLs
- Production: Update `NEXTAUTH_URL`, `TOYYIBPAY_*_URL` to production domain
- Database: SQLite at `file:./dev.db` (dev) or `file:./db/production.db` (prod)

## Key Dependencies

- **Bun** - Package manager and runtime
- **Next.js 16** - Full-stack React framework (App Router)
- **Prisma** - ORM with SQLite
- **NextAuth.js** - Google OAuth authentication
- **Supabase** - Image storage (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **ToyyibPay** - Malaysian payment gateway
- **Caddy** - Reverse proxy (port 81 → localhost:3000)
- **shadcn/ui** - Component library (Radix UI + Tailwind)

## Project Layout

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth.js Google OAuth
│   │   ├── orders/               # Order CRUD
│   │   ├── print-sizes/          # Print size catalog
│   │   ├── reviews/              # Customer reviews
│   │   ├── toyyibpay/
│   │   │   ├── callback/         # ToyyibPay webhook
│   │   │   └── create-bill/      # Create payment bill
│   │   └── user/profile/         # User profile
│   ├── payment-status/           # Payment result page
│   └── page.tsx                  # Home page
├── components/ui/                # shadcn/ui components
├── contexts/                     # AuthContext, ThemeContext
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── supabase/                 # Supabase client (browser + server)
│   └── utils.ts
└── providers/
```

## Print Sizes (Default)

| ID | Name | Size | Price |
|----|------|------|-------|
| `2r` | 2R | 2.5 × 3.5 in | RM 0.50 |
| `3r` | 3R | 3.5 × 5 in | RM 0.75 |
| `4r` | 4R | 4 × 6 in | RM 1.00 |
| `a4` | A4 | 8.3 × 11.7 in | RM 3.50 |

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
