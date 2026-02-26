# Project Commands

## Development
```bash
bun run dev    # Start dev server on localhost:3000
bun run build # Build for production
bun run start # Start production server
bun run lint  # Run ESLint
```

## Database
```bash
bun run db:generate  # Generate Prisma client
bun run db:push     # Push schema to database
bun run db:migrate  # Run migrations
bun run db:reset    # Reset database
```

## Environment
- Development: `.env` with localhost URLs
- Production: Update `NEXTAUTH_URL`, `TOYYIBPAY_*_URL` to production domain
- Database: SQLite at `file:./dev.db` (dev) or `file:./db/production.db` (prod)

## Key Dependencies
- Bun (package manager)
- Next.js 16
- Prisma (SQLite)
- NextAuth.js (Google OAuth)
- ToyyibPay (payments)
- Caddy (reverse proxy on port 81)
