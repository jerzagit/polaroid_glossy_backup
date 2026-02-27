# Polaroid Glossy MY

A modern e-commerce platform for printing digital photos as beautiful physical polaroid prints. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

- **Photo Upload** - Upload multiple photos with custom text
- **Multiple Sizes** - 2R, 3R, 4R, and A4 print sizes
- **Shopping Cart** - Full cart experience with persistent storage
- **Order Management** - Track orders with order numbers
- **User Accounts** - Google OAuth authentication via NextAuth.js
- **Payment Gateway** - ToyyibPay integration (Malaysia)
- **Bank Transfer** - Manual bank transfer payment option
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
| Storage | Supabase Storage (images) |
| Payments | ToyyibPay |
| Animations | Framer Motion |
| Reverse Proxy | Caddy (port 81) |
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
│   └── schema.prisma           # Database schema (SQLite)
├── public/
│   └── images/                 # Static images
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth.js
│   │   │   ├── orders/         # Order CRUD
│   │   │   ├── print-sizes/    # Print size catalog
│   │   │   ├── reviews/        # Customer reviews
│   │   │   ├── toyyibpay/      # Payment gateway
│   │   │   └── user/           # User profile
│   │   ├── payment-status/     # Payment result page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ThemeSwitcher.tsx
│   ├── contexts/               # React contexts (Auth, Theme)
│   ├── hooks/                  # Custom hooks
│   └── lib/                   # Utilities (db, supabase, utils)
├── backend-polaroid-glossy/    # Spring Boot backend (separate service)
├── Caddyfile                   # Caddy reverse proxy config (port 81)
├── ADMIN_API.md                # Admin API documentation
├── AGENTS.md                   # Dev commands reference
├── DEPLOYMENT.md               # Deployment guide
├── DESIGN_ARCHITECTURE.md      # System design & payment flow
├── ENVIRONMENT.md              # Environment configuration
├── SETUP.md                    # Local development setup
├── TOYYIBPAY_FLOW.md           # ToyyibPay payment flow
├── backend_architecture.md     # Spring Boot backend architecture
└── .env.example                # Environment variables template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server (port 3000) |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

## Architecture

The project consists of two services:

1. **Frontend (Next.js)** - This repository. Handles UI, API routes, auth, and database.
2. **Backend (Spring Boot)** - Located in `backend-polaroid-glossy/`. A separate REST API for admin features. See [backend_architecture.md](./backend_architecture.md).

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Local development setup guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Environment variables reference |
| [DESIGN_ARCHITECTURE.md](./DESIGN_ARCHITECTURE.md) | System design & payment flow diagrams |
| [TOYYIBPAY_FLOW.md](./TOYYIBPAY_FLOW.md) | ToyyibPay integration details |
| [ADMIN_API.md](./ADMIN_API.md) | Full API documentation (current + future admin APIs) |
| [backend_architecture.md](./backend_architecture.md) | Spring Boot backend blueprint |

## License

MIT
