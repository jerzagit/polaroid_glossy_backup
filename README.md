# Polaroid Glossy MY

Transform your digital photos into beautiful physical polaroid prints. Choose from multiple sizes, add custom text, and create memories that last forever.

## Features

- **Photo Upload** - Upload multiple photos at once
- **Custom Text** - Add personal messages to your polaroid prints
- **Multiple Sizes** - Choose from 2R, 3R, 4R, and A4 sizes
- **Cart & Checkout** - Full shopping cart experience
- **Order Tracking** - Track your order status with order number
- **User Accounts** - Sign in with Google to manage orders
- **Customer Reviews** - View and submit reviews
- **Theme Switching** - Choose from 4 color themes (Soft Pink, Lavender Dream, Coral Sunset, Mint Fresh)

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Component library
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication
- **Supabase** - Backend database
- **Framer Motion** - Animations

## Getting Started

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Themes

| Theme | Description |
|-------|-------------|
| Soft Pink | Pastel pink palette |
| Lavender Dream | Soft violet tones |
| Coral Sunset | Warm coral/peach |
| Mint Fresh | Fresh mint green |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles + themes
├── components/
│   ├── ui/               # shadcn/ui components
│   └── ThemeSwitcher.tsx # Theme switcher component
├── contexts/
│   ├── AuthContext.tsx   # Authentication context
│   └── ThemeContext.tsx  # Theme context
└── lib/
    ├── supabase/         # Supabase client
    ├── db.ts            # Database client
    └── utils.ts         # Utility functions
```

## Environment Variables

Create a `.env` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## License

MIT
