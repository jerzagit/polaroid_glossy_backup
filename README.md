# Polaroid Glossy MY

A modern e-commerce platform for printing digital photos as beautiful physical polaroid prints. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

- **Photo Upload** - Upload multiple photos with custom text
- **Multiple Sizes** - 2R, 3R, 4R, and A4 print sizes
- **Futuristic Product Catalog** - Animated card grid with image carousel, glow borders, expandable specs, and star ratings
- **Individual Product Pages** - Full detail page per product with image gallery, spec table, reviews tab, and TikTok embeds
- **Shopping Cart** - Full cart experience with persistent storage
- **Order Management** - Track orders with order numbers
- **User Accounts** - Google OAuth authentication via NextAuth.js
- **Payment Gateway** - ToyyibPay integration (Malaysia)
- **Bank Transfer** - Manual bank transfer payment option
- **Customer Reviews** - Verified purchase reviews
- **ENG / MY Language Toggle** - Full UI in English and Bahasa Malaysia
- **TikTok Reviews** - Official TikTok oEmbed embeds on product pages
- **Theme System** - 4 color themes (Soft Pink, Lavender Dream, Coral Sunset, Mint Fresh)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
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
polaroid_glossy/
├── prisma/
│   └── schema.prisma           # Database schema (SQLite)
├── public/
│   └── images/                 # Static images (product photos, hero, etc.)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth.js Google OAuth
│   │   │   ├── orders/         # Order CRUD
│   │   │   ├── products/       # Product catalog (GET /api/products, /api/products/[id])
│   │   │   ├── print-sizes/    # Legacy print size catalog
│   │   │   ├── reviews/        # Customer reviews
│   │   │   ├── toyyibpay/      # Payment gateway
│   │   │   └── user/           # User profile
│   │   ├── products/[id]/      # Individual product detail page
│   │   ├── payment-status/     # Payment result page
│   │   ├── faq/                # FAQ page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (upload flow)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── ProductCatalog.tsx  # Futuristic product card grid
│   │   └── ThemeSwitcher.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── LanguageContext.tsx # ENG/MY i18n (Lang, Trans, translations)
│   ├── data/
│   │   └── products-meta.json  # Marketing metadata (images, descriptions, ratings, TikTok)
│   ├── hooks/                  # Custom hooks
│   └── lib/                   # Utilities (db, supabase, utils, imageCompression)
├── backend-polaroid-glossy/    # Spring Boot backend (separate service, port 8080)
├── Caddyfile                   # Caddy reverse proxy config (port 81)
├── ADMIN_API.md                # Admin API documentation
├── AGENTS.md                   # Dev commands reference
├── DEPLOYMENT.md               # Deployment guide
├── DESIGN_ARCHITECTURE.md      # System design & payment flow diagrams
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

### Product Data Flow

Product data is assembled at the API layer by merging two sources:

```
Prisma PrintSize (DB)  +  products-meta.json  →  /api/products → ProductCatalog
         ↑                      ↑
  price, dimensions       images, descriptions,
  isActive flag           ratings, TikTok URLs,
                          accent colors, features
```

To add or update product content (images, descriptions, tags), edit `src/data/products-meta.json`. To change prices or disable a size, update the `PrintSize` table in the DB.

## i18n (Language Toggle)

The UI supports English (`en`) and Bahasa Malaysia (`my`). The toggle is in the header (ENG / MY pill buttons). All strings come from `LanguageContext.tsx` via the `t` object returned by `useLanguage()`. Never hardcode BM strings in components.

## TikTok Reviews

Product pages embed real TikTok videos via the official TikTok oEmbed API. Video URLs are stored in `products-meta.json` under each product's `tiktokVideos[]` array. To add a new video, append an entry:

```json
{
  "videoId": "7xxxxxxxxxxxxxxxx",
  "url": "https://www.tiktok.com/@polaroidglossymy/video/7xxxxxxxxxxxxxxxx",
  "caption": "Customer unboxing 📦"
}
```

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
