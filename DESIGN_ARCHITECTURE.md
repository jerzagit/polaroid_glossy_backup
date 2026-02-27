# Design Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │  Pages  │ │  API    │ │ NextAuth│ │  Prisma     │   │
│  │         │ │ Routes  │ │ (OAuth) │ │  (SQLite)   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                                    │
         │ Image Upload                       │ DB
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│  Supabase       │                  │  SQLite         │
│  Storage        │                  │  (dev.db)       │
│  (images)       │                  └─────────────────┘
└─────────────────┘
         │
         ▼ (future)
┌─────────────────────────────────────────────────────────┐
│                 Backend (Spring Boot)                     │
│  Port 8080 - Admin API, Analytics, User Management       │
└─────────────────────────────────────────────────────────┘
```

## Payment Flow Diagram

```mermaid
flowchart TD
    A[User uploads photos] --> B[Selects size & quantity]
    B --> C[Adds to cart]
    C --> D[Fills checkout form<br/>Name, Email, Phone, State]
    D --> E{Selects Payment Method}

    E -->|Bank Transfer| F[POST /api/orders]
    E -->|ToyyibPay| G[POST /api/orders]

    F --> H[Create Order<br/>Status: pending<br/>PaymentStatus: pending]
    H --> I[Show bank transfer details<br/>24hr deadline]

    G --> H
    H --> J[POST /api/toyyibpay/create-bill]
    J --> K[ToyyibPay API<br/>Create Bill]
    K --> L[Redirect to ToyyibPay<br/>payment page]

    L --> M{Payment Result}

    M -->|Success| N[ToyyibPay redirects to<br/>/payment-status?status_id=1]
    M -->|Pending| O[ToyyibPay redirects to<br/>/payment-status?status_id=2]
    M -->|Failed| P[ToyyibPay redirects to<br/>/payment-status?status_id=0]

    K --> Q[ToyyibPay calls<br/>/api/toyyibpay/callback<br/>webhook]
    Q --> R{Update Order}
    R -->|status=1| S[paymentStatus: paid<br/>status: processing]
    R -->|status=2| T[paymentStatus: pending]
    R -->|status=0| U[paymentStatus: failed]

    N --> V[/payment-status page<br/>Show success UI]
    O --> W[/payment-status page<br/>Show pending UI]
    P --> X[/payment-status page<br/>Show failed UI]

    style A fill:#e1f5fe
    style I fill:#fff3e0
    style S fill:#e8f5e9
    style V fill:#e8f5e9
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | Get order by order number |
| PUT | `/api/orders` | Update order status (admin) |
| DELETE | `/api/orders` | Cancel order |
| POST | `/api/toyyibpay/create-bill` | Create ToyyibPay bill |
| POST | `/api/toyyibpay/callback` | ToyyibPay webhook callback |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js (Google OAuth) |
| GET/PUT | `/api/user/profile` | User profile management |
| GET/POST/PUT/DELETE | `/api/reviews` | Customer reviews |
| GET | `/api/print-sizes` | Available print sizes |

## Order Status Flow

```
pending → processing → posted → on_delivery → delivered
   │
   └─→ cancelled → refunded
```

## Payment Status Flow

```
pending → paid      (via ToyyibPay callback, status=1)
pending → failed    (payment declined, status=0)
```

## Database Schema

### User
- `id`, `supabaseId` (unique), `email`, `name`, `avatar`, `phone`
- `createdAt`, `updatedAt`
- Relations: `orders[]`, `reviews[]`

### PrintSize
- `id` (e.g. "4r"), `name`, `displayName`, `width`, `height`
- `price`, `description`, `isActive`
- Relations: `orderItems[]`, `cartItems[]`, `reviews[]`

### Order
- `id`, `orderNumber` (unique, e.g. "PP-ABC123")
- `userId?`, `customerName`, `customerEmail`, `customerPhone?`, `customerState?`
- `status` (pending/processing/posted/on_delivery/delivered/cancelled/refunded)
- `paymentStatus` (pending/paid/failed), `paymentMethod` (bank_transfer/toyyibpay)
- `toyyibpayRef?`, `paidAt?`
- `subtotal`, `shipping`, `total`
- `notes?`, `trackingNumber?`, `shippedAt?`, `deliveredAt?`, `cancelledAt?`, `cancelReason?`
- Relations: `items[]`, `statusHistory[]`, `reviews[]`

### OrderItem
- `id`, `orderId`, `sizeId`, `quantity`, `unitPrice`, `totalPrice`
- `images` (JSON array of URLs), `customTexts?` (JSON array)
- `productId?` (optional product reference)

### OrderStatusHistory
- `id`, `orderId`, `status`, `message?`, `createdAt`

### Review
- `id`, `userId`, `orderId`, `sizeId`
- `rating` (1-5), `title`, `comment`, `images?` (JSON)
- `isVerified` (verified purchase)
- Unique: one review per user per order

### Cart / CartItem
- Session-based cart for anonymous users
- `sessionId` (unique per browser session)
- `userId?` (linked when user logs in)

## Theme System

4 built-in color themes:
- Soft Pink
- Lavender Dream
- Coral Sunset
- Mint Fresh

Theme is persisted in `ThemeContext` and applied via CSS variables.
