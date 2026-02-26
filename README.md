# Polaroid Glossy MY

A modern e-commerce platform for printing digital photos as beautiful physical polaroid prints. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

- **Photo Upload** - Upload multiple photos with custom text
- **Multiple Sizes** - 2R, 3R, 4R, and A4 print sizes
- **Shopping Cart** - Full cart experience with persistent storage
- **Order Management** - Track orders with order numbers
- **User Accounts** - Google OAuth authentication
- **Payment Gateway** - ToyyibPay integration (Malaysia)
- **Customer Reviews** - Verified purchase reviews
- **Theme System** - 4 color themes (Soft Pink, Lavender Dream, Coral Sunset, Mint Fresh)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite + Prisma ORM |
| Auth | NextAuth.js (Google OAuth) |
| Payments | ToyyibPay |
| Animations | Framer Motion |
| Package Manager | Bun |

## Quick Start

```bash
# Install dependencies
bun install

# Setup database
bun run db:generate
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
polaroid-glossy-clean/
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   └── images/             # Static images
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── ThemeSwitcher.tsx
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities
├── Caddyfile               # Caddy reverse proxy config
├── DEPLOYMENT.md           # Deployment guide
├── SETUP.md                # Local setup guide
├── ENVIRONMENT.md          # Environment configuration
└── .env.example            # Environment variables template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

## Documentation

- [SETUP.md](./SETUP.md) - Local development setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment configuration

## License

MIT
