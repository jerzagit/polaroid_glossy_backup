# Polaroid Glossy MY

A modern e-commerce platform for printing digital photos as beautiful physical polaroid prints. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

- **Photo Upload** — Upload multiple photos with client-side compression (WhatsApp HD quality)
- **Image Storage** — Photos uploaded to Amazon S3 automatically on selection
- **Multiple Sizes** — 2R, 3R, 4R, and A4 print sizes
- **Futuristic Product Catalog** — Animated card grid with image carousel, glow borders, expandable specs, and star ratings
- **Individual Product Pages** — Full detail page per product with image gallery, spec table, reviews tab, and TikTok embeds
- **Shopping Cart** — Full cart experience with persistent storage
- **Order Management** — Track orders with order numbers
- **User Accounts** — Google OAuth authentication via NextAuth.js
- **Payment Gateway** — ToyyibPay integration (Malaysia) with sandbox + live support
- **Bank Transfer** — Manual bank transfer payment option
- **Customer Reviews** — Verified purchase reviews
- **ENG / MY Language Toggle** — Full UI in English and Bahasa Malaysia
- **TikTok Reviews** — Official TikTok oEmbed embeds on product pages
- **Theme System** — 4 color themes (Soft Pink, Lavender Dream, Coral Sunset, Mint Fresh)
- **Admin Panel** — Product management UI at `/admin/products`

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite (dev) / PostgreSQL (prod) + Prisma ORM |
| Auth | NextAuth.js v5 (Google OAuth) |
| Image Storage | Amazon S3 (ap-southeast-1) |
| Payments | ToyyibPay (sandbox + live) |
| Animations | Framer Motion |
| Package Manager | npm |

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> For payment testing you also need ngrok running — see [SETUP.md](./SETUP.md).

## Project Structure

```
polaroid_glossy/
├── prisma/
│   └── schema.prisma           # Database schema (SQLite dev / PostgreSQL prod)
├── public/
│   └── images/                 # Static images (product photos, hero, etc.)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth.js Google OAuth
│   │   │   ├── orders/         # Order CRUD
│   │   │   ├── upload/         # POST /api/upload — S3 image upload
│   │   │   ├── products/       # Product catalog (GET /api/products, /api/products/[id])
│   │   │   ├── reviews/        # Customer reviews
│   │   │   ├── toyyibpay/      # Payment gateway (create-bill, callback)
│   │   │   ├── admin/products/ # Admin product management
│   │   │   └── user/           # User profile
│   │   ├── admin/products/     # Admin product management UI
│   │   ├── products/[id]/      # Individual product detail page
│   │   ├── payment-status/     # Payment result page
│   │   ├── faq/                # FAQ page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (upload → cart → checkout flow)
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
│   └── lib/
│       ├── db.ts               # Prisma client
│       ├── s3.ts               # Amazon S3 client + uploadToS3()
│       ├── imageCompression.ts # Client-side HEIC/JPG compression
│       └── translations.ts     # ENG/MY string maps
├── ADMIN_API.md                # Admin API documentation
├── AGENTS.md                   # Dev commands reference
├── BACKEND_HANDOFF.md          # SQL schema + API contract for Spring Boot backend
├── DEPLOYMENT.md               # Full deployment guide (dev vs production)
├── DESIGN_ARCHITECTURE.md      # System design & payment flow diagrams
├── ENVIRONMENT.md              # Environment variables reference
├── SETUP.md                    # Local development setup
├── TOYYIBPAY_FLOW.md           # ToyyibPay payment flow
├── backend_architecture.md     # Spring Boot backend architecture blueprint
└── .env                        # Environment variables (never commit secrets)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push schema to database |
| `npx prisma studio` | Open DB browser at localhost:5555 |
| `npx prisma migrate deploy` | Run migrations (production) |

## Image Upload Flow

```
User selects photo
      ↓
compressImage()          ← client-side (max 2048px, 80% JPEG quality)
      ↓
POST /api/upload         ← Next.js server validates + uploads to S3
      ↓
S3 key: orders/YYYY-MM-DD/{uuid}.jpg
      ↓
S3 URL stored in photo.s3Url (React state)
      ↓
POST /api/orders         ← checkout uses S3 URLs in item.images[]
      ↓
OrderItem.images in DB   ← permanent S3 URLs
```

## Product Data Flow

Product data is assembled at the API layer by merging two sources:

```
Prisma PrintSize (DB)  +  ProductMeta (DB)  →  /api/products → ProductCatalog
         ↑                      ↑
  price, dimensions       images, descriptions,
  isActive flag           ratings, TikTok URLs,
                          accent colors, features
                    (falls back to products-meta.json if DB empty)
```

## i18n (Language Toggle)

The UI supports English (`en`) and Bahasa Malaysia (`my`). The toggle is in the header (ENG / MY pill buttons). All strings come from `LanguageContext.tsx` via the `t` object returned by `useLanguage()`. Never hardcode BM strings in components — add them to `src/lib/translations.ts`.

## TikTok Reviews

Product pages embed real TikTok videos via the official TikTok oEmbed API. Video URLs are stored in `products-meta.json` (or `ProductMeta` DB table) under each product's `tiktokVideos[]` array. To add a new video, append an entry:

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
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Dev vs production environment guide |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | All environment variables explained |
| [TOYYIBPAY_FLOW.md](./TOYYIBPAY_FLOW.md) | ToyyibPay payment integration details |
| [ADMIN_API.md](./ADMIN_API.md) | Full API documentation |
| [BACKEND_HANDOFF.md](./BACKEND_HANDOFF.md) | SQL seed data + API contract for Spring Boot backend |
| [DESIGN_ARCHITECTURE.md](./DESIGN_ARCHITECTURE.md) | System design & payment flow diagrams |
| [backend_architecture.md](./backend_architecture.md) | Spring Boot backend blueprint |

## License

MIT
