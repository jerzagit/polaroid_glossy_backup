# API Documentation

Complete API documentation for Polaroid Glossy MY.

> **Note:** Current APIs run inside the Next.js monolith (`/api/...`). Future Admin APIs will be served by the separate Spring Boot backend on port 8080. See [backend_architecture.md](./backend_architecture.md) for the full migration plan.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current APIs (Existing)](#current-apis-existing)
3. [Future Admin APIs](#future-admin-apis)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Architecture Overview

### Current Architecture (Monolithic)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│  │  Pages  │ │  API    │ │ Auth    │ │  Database   │  │
│  │         │ │ Routes  │ │ NextAuth│ │  (Prisma)   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Future Architecture (Separated)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Customer App   │────▶│   Customer API  │────▶│   Database      │
│   (Frontend)    │     │   (Existing)    │     │   (Shared)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐
│  Admin Panel    │────▶│   Admin API     │
│   (Frontend)    │     │   (Future)      │
└─────────────────┘     └─────────────────┘
```

---

## Current APIs (Existing)

### Base URL

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

---

### 1. Authentication

#### GET /api/auth/[...nextauth]

NextAuth.js handlers for Google OAuth.

**Supported Providers:**
- Google OAuth

**Response:** NextAuth.js session object

---

### 2. Orders

#### GET /api/orders

Get orders (by user, email, or all).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | Filter by user ID |
| email | string | Filter by customer email |
| orderNumber | string | Get specific order |

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "order": {...}
}
```

#### POST /api/orders

Create new order.

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+60123456789",
  "customerState": "w",
  "notes": "Leave at door",
  "items": [
    {
      "sizeId": "4r",
      "quantity": 5,
      "images": ["url1.jpg", "url2.jpg"],
      "customTexts": ["Happy Birthday!", "Love you"],
      "unitPrice": 1.00
    }
  ],
  "subtotal": 5.00,
  "shipping": 11.00,
  "total": 16.00,
  "paymentMethod": "toyyibpay"
}
```

#### PUT /api/orders

Update order status (admin).

**Request:**
```json
{
  "orderId": "order_123",
  "status": "processing",
  "trackingNumber": "TRACK123",
  "message": "Order confirmed"
}
```

#### DELETE /api/orders

Cancel order.

**Query:** `?orderId=order_123&reason=customer_request`

---

### 3. Products (Catalog API)

#### GET /api/products

Get full product catalog — merges `PrintSize` DB table with `products-meta.json` metadata.

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "4r",
      "name": "4R",
      "displayName": "4R (4 x 6 inches)",
      "width": 4, "height": 6, "price": 1.00,
      "tag": "BESTSELLER",
      "accentColor": "#f59e0b",
      "shortDescription": "Classic polaroid look and feel.",
      "fullDescription": "The 4R is the definitive...",
      "images": ["/images/hero-polaroids.png"],
      "features": ["True polaroid feel", "Best value"],
      "specs": { "dimensions": "4 × 6 inches", "paper": "Glossy 260gsm", ... },
      "rating": 4.9,
      "reviewCount": 1204,
      "tiktokVideos": [],
      "popular": true
    }
  ]
}
```

#### GET /api/products/:id

Get single product by ID.

**Response:** `{ "success": true, "product": { ...same shape as above... } }`

> **Note:** These endpoints currently merge `products-meta.json` with the DB. Once the Spring Boot admin backend is live, they will instead call `http://localhost:8080/api/products`.

---

### 4. Print Sizes (Legacy)

#### GET /api/print-sizes

Get all active print sizes.

**Response:**
```json
{
  "success": true,
  "printSizes": [
    {
      "id": "4r",
      "name": "4R",
      "displayName": "4R (4 x 6 inches)",
      "width": 4,
      "height": 6,
      "price": 1.00,
      "description": "Most popular",
      "isActive": true
    }
  ]
}
```

---

### 4. Reviews

#### GET /api/reviews

Get reviews.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sizeId | string | Get reviews for print size |
| userId | string | Get reviews by user |
| orderId | string | Get review for order |

#### POST /api/reviews

Create review (verified purchase).

**Request:**
```json
{
  "userId": "user_123",
  "orderId": "order_123",
  "sizeId": "4r",
  "rating": 5,
  "title": "Great quality!",
  "comment": "Love the prints",
  "images": ["review1.jpg"]
}
```

#### PUT /api/reviews

Update own review.

**Request:**
```json
{
  "reviewId": "review_123",
  "userId": "user_123",
  "rating": 4,
  "title": "Updated title",
  "comment": "Updated comment"
}
```

#### DELETE /api/reviews

Delete own review.

**Query:** `?reviewId=review_123&userId=user_123`

---

### 5. User Profile

#### GET /api/user/profile

Get or create user profile.

**Query:** `?email=john@example.com`

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+60123456789",
    "avatar": "https://...",
    "createdAt": "2024-01-01"
  }
}
```

#### PUT /api/user/profile

Update user profile.

**Request:**
```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+60123456789"
}
```

---

### 6. Payment - ToyyibPay

#### POST /api/toyyibpay/create-bill

Create payment bill.

**Request:**
```json
{
  "orderId": "order_123",
  "orderNumber": "PP-ABC123",
  "amount": 36.00,
  "customerEmail": "john@example.com",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "billCode": "ABC123",
  "paymentUrl": "https://toyyibpay.com/ABC123"
}
```

#### POST /api/toyyibpay/callback

Payment webhook (ToyyibPay server calls this).

**Request (ToyyibPay):**
```json
{
  "billcode": "ABC123",
  "refno": "PP-ABC123",
  "status": "1",
  "amount": "3600"
}
```

---

## Future Admin APIs

### Base URL

```
Development: http://localhost:8080/api/admin
Production:  https://api.your-domain.com/api/admin
```

---

### 1. Authentication

#### POST /auth/login

Admin login.

```json
// Request
{
  "email": "admin@polaroid.com",
  "password": "secure-password"
}

// Response
{
  "success": true,
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "admin": {
    "id": "admin_123",
    "email": "admin@polaroid.com",
    "name": "Admin",
    "role": "super_admin",
    "permissions": ["orders", "products", "users", "settings", "analytics"]
  }
}
```

#### POST /auth/refresh

Refresh token.

```json
// Request
{
  "refreshToken": "token"
}
```

#### POST /auth/logout

Logout.

#### GET /auth/me

Get current admin.

---

### 2. Orders Management

#### GET /orders

List orders with filters.

| Query | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | pending, processing, posted, on_delivery, delivered, cancelled, refunded |
| search | string | Order number, name, email |
| dateFrom | date | From date |
| dateTo | date | To date |
| sortBy | string | createdAt, total, status |
| sortOrder | string | asc, desc |

```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /orders/:id

Get order details with status history.

#### POST /orders

Create order (admin/guest).

```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+60123456789",
  "customerState": "w",
  "items": [...],
  "notes": "Special instructions",
  "subtotal": 25.00,
  "shipping": 11.00,
  "total": 36.00,
  "paymentMethod": "bank_transfer"
}
```

#### PUT /orders/:id

Update order details (address, notes).

#### PUT /orders/:id/status

Update order status.

```json
{
  "status": "posted",
  "trackingNumber": "TRACK123456",
  "message": "Shipped via Pos Laju",
  "notifyCustomer": true
}
```

Valid statuses: `pending` → `processing` → `posted` → `on_delivery` → `delivered`
- Or: `pending`/`processing` → `cancelled` → `refunded`

#### DELETE /orders/:id

Cancel order.

```json
{
  "reason": "Out of stock",
  "notifyCustomer": true
}
```

#### POST /orders/:id/refund

Process refund.

```json
{
  "amount": 25.00,
  "reason": "Customer request",
  "method": "toyyibpay"
}
```

#### GET /orders/export

Export orders.

**Query:** `?format=csv&status=processing&dateFrom=2024-01-01`

---

### 3. Product Management

Product data is split into two layers. The admin backend manages both:

| Layer | Table | Managed by | Contains |
|-------|-------|------------|---------|
| Pricing | `print_sizes` | Admin | id, name, dimensions, price, isActive |
| Marketing | `product_meta` | Marketing+ | images, descriptions, tag, accentColor, features, TikTok |

---

#### 3a. Print Sizes (Pricing Layer)

##### GET /sizes

List all print sizes including inactive.

```json
{
  "success": true,
  "sizes": [
    {
      "id": "4r",
      "name": "4R",
      "displayName": "4R (4 x 6 inches)",
      "width": 4.0,
      "height": 6.0,
      "price": 1.00,
      "description": "Most popular - Classic polaroid style",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Access:** Marketing+

##### POST /sizes

Create a new print size.

```json
{
  "name": "5R",
  "displayName": "5R (5 x 7 inches)",
  "width": 5.0,
  "height": 7.0,
  "price": 2.00,
  "description": "Larger format prints",
  "isActive": true
}
```

**Access:** Admin only

##### PUT /sizes/:id

Update a print size (price, name, description).

```json
{
  "price": 1.20,
  "description": "Updated description"
}
```

**Access:** Admin only

##### PATCH /sizes/:id/toggle

Toggle a size active/inactive (hides it from the storefront).

**Response:**
```json
{ "success": true, "isActive": false }
```

**Access:** Admin only

##### DELETE /sizes/:id

Soft delete — sets `isActive: false`. Does not destroy historical order data.

**Access:** Admin only

---

#### 3b. Product Metadata (Marketing Content Layer)

One metadata record per print size. Created automatically when a new print size is added.

##### GET /products

List all products — merged `print_sizes` + `product_meta`.

| Query | Type | Description |
|-------|------|-------------|
| isActive | boolean | Filter by active status |
| search | string | Filter by name/tag |

```json
{
  "success": true,
  "products": [
    {
      "id": "4r",
      "name": "4R",
      "displayName": "4R (4 x 6 inches)",
      "width": 4.0,
      "height": 6.0,
      "price": 1.00,
      "isActive": true,
      "tag": "BESTSELLER",
      "accentColor": "#f59e0b",
      "shortDescription": "Classic polaroid look and feel.",
      "fullDescription": "The 4R is the definitive polaroid experience...",
      "images": [
        "https://cdn.supabase.co/.../hero-polaroids.png",
        "https://cdn.supabase.co/.../product-collection.png"
      ],
      "features": ["True polaroid feel", "Best value", "Frame-ready"],
      "tiktokVideos": [
        {
          "videoId": "7123456789012345678",
          "url": "https://www.tiktok.com/@polaroidglossymy/video/7123456789012345678",
          "caption": "4R unboxing 📸"
        }
      ],
      "rating": 4.9,
      "reviewCount": 1204
    }
  ]
}
```

**Access:** Marketing+

##### GET /products/:id

Get single product full detail.

**Access:** Marketing+

##### PUT /products/:id/meta

Update marketing metadata — copy, tag, accent color, features.

```json
{
  "shortDescription": "Classic polaroid look and feel — our most loved size.",
  "fullDescription": "The 4R is the definitive polaroid experience...",
  "tag": "BESTSELLER",
  "accentColor": "#f59e0b",
  "features": ["True polaroid feel", "Best value", "Frame-ready", "Custom text support"]
}
```

**Access:** Marketing+

##### POST /products/:id/images

Upload a new product image. File is stored in Supabase Storage under `products/{id}/`, URL is appended to the `images` array.

**Request:** `multipart/form-data` with `file` field (JPG/PNG/WEBP, max 10MB)

```json
{
  "success": true,
  "imageUrl": "https://cdn.supabase.co/storage/.../products/4r/abc123.jpg",
  "images": [
    "https://cdn.supabase.co/.../hero-polaroids.png",
    "https://cdn.supabase.co/.../abc123.jpg"
  ]
}
```

**Access:** Marketing+

##### DELETE /products/:id/images

Remove a product image by URL. Also deletes the file from Supabase Storage.

**Query:** `?imageUrl=https://cdn.supabase.co/.../abc123.jpg`

**Access:** Marketing+

##### PUT /products/:id/images/reorder

Reorder the image carousel. Send the full `images` array in the desired order.

```json
[
  "https://cdn.supabase.co/.../product-collection.png",
  "https://cdn.supabase.co/.../hero-polaroids.png"
]
```

**Access:** Marketing+

---

#### 3c. TikTok Video Management

TikTok videos are stored as a JSONB array in `product_meta.tiktok_videos`. No scraping — admin manually adds video URLs after customers tag the brand.

##### POST /products/:id/tiktok

Add a TikTok video to a product.

```json
{
  "videoId": "7123456789012345678",
  "url": "https://www.tiktok.com/@polaroidglossymy/video/7123456789012345678",
  "caption": "Customer unboxing our 4R prints 📸"
}
```

**Response:**
```json
{
  "success": true,
  "tiktokVideos": [
    {
      "videoId": "7123456789012345678",
      "url": "https://www.tiktok.com/@polaroidglossymy/video/7123456789012345678",
      "caption": "Customer unboxing our 4R prints 📸"
    }
  ]
}
```

**Access:** Marketing+

##### DELETE /products/:id/tiktok/:videoId

Remove a TikTok video from a product.

**Access:** Marketing+

---

#### 3d. Product Analytics

##### GET /products/:id/analytics

Sales performance for a specific print size.

**Query:** `?from=2026-01-01&to=2026-03-31`

```json
{
  "success": true,
  "data": {
    "productId": "4r",
    "period": { "from": "2026-01-01", "to": "2026-03-31" },
    "totalOrderItems": 1204,
    "totalQuantitySold": 8932,
    "totalRevenue": 8932.00,
    "averageOrderQuantity": 7.4,
    "salesByMonth": [
      { "month": "2026-01", "quantity": 312, "revenue": 312.00 },
      { "month": "2026-02", "quantity": 298, "revenue": 298.00 },
      { "month": "2026-03", "quantity": 594, "revenue": 594.00 }
    ],
    "topCustomerStates": [
      { "state": "Selangor", "orders": 340 },
      { "state": "Kuala Lumpur", "orders": 218 }
    ]
  }
}
```

**Access:** Admin only

---

### 5. Cart Management

#### GET /cart

Get cart by session ID.

**Query:** `?sessionId=session_123`

#### POST /cart/items

Add item to cart.

```json
{
  "sessionId": "session_123",
  "userId": "user_123",
  "sizeId": "4r",
  "quantity": 5,
  "images": ["url1.jpg"],
  "customTexts": ["Happy!"],
  "unitPrice": 1.00
}
```

#### PUT /cart/items/:id

Update cart item quantity.

```json
{
  "quantity": 10
}
```

#### DELETE /cart/items/:id

Remove item from cart.

#### DELETE /cart

Clear cart.

**Query:** `?sessionId=session_123`

---

### 6. Users Management

#### GET /users

List users.

| Query | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| search | string | Name or email |
| hasOrders | boolean | Filter by order presence |
| dateFrom | date | Registered from |
| dateTo | date | Registered to |

#### GET /users/:id

Get user details with orders.

#### PUT /users/:id

Update user details.

```json
{
  "name": "New Name",
  "phone": "+60123456789"
}
```

#### DELETE /users/:id

Deactivate user.

#### GET /users/:id/orders

Get user's order history.

---

### 7. Reviews Management

#### GET /reviews

List reviews.

| Query | Type | Description |
|-------|------|-------------|
| status | string | pending, approved, rejected |
| sizeId | string | Filter by print size |
| rating | number | Filter by stars |

#### PUT /reviews/:id/approve

Approve review.

```json
{
  "notifyUser": true
}
```

#### PUT /reviews/:id/reject

Reject review.

```json
{
  "reason": "Contains inappropriate content"
}
```

#### DELETE /reviews/:id

Delete review.

---

### 8. Analytics

#### GET /analytics/overview

Dashboard summary.

```json
{
  "success": true,
  "data": {
    "todayOrders": 15,
    "todayRevenue": 450.00,
    "weekOrders": 85,
    "weekRevenue": 2800.00,
    "monthOrders": 320,
    "monthRevenue": 12500.00,
    "pendingOrders": 12,
    "processingOrders": 8,
    "totalUsers": 150,
    "newUsersThisMonth": 25,
    "averageRating": 4.5,
    "totalReviews": 89
  }
}
```

#### GET /analytics/orders

Order analytics.

**Query:** `?period=month&groupBy=day`

```json
{
  "success": true,
  "data": {
    "totalOrders": 320,
    "totalRevenue": 12500.00,
    "averageOrderValue": 39.06,
    "ordersByStatus": {
      "pending": 12,
      "processing": 8,
      "posted": 45,
      "on_delivery": 15,
      "delivered": 240
    },
    "dailyOrders": [
      { "date": "2024-01-01", "orders": 10, "revenue": 350 }
    ]
  }
}
```

#### GET /analytics/products

Product performance.

#### GET /analytics/users

User analytics.

#### GET /analytics/revenue

Revenue reports.

---

### 9. Settings

#### GET /settings

Get all settings.

#### PUT /settings

Update settings.

```json
{
  "siteName": "Polaroid Glossy MY",
  "siteDescription": "Custom polaroid prints",
  "contactEmail": "contact@polaroid.com",
  "contactPhone": "+60123456789",
  "shippingCost": 11.00,
  "freeShippingThreshold": 100.00,
  "businessHours": {
    "monday": "9:00 - 18:00",
    "tuesday": "9:00 - 18:00"
  },
  "socialLinks": {
    "facebook": "https://facebook.com/...",
    "instagram": "https://instagram.com/..."
  }
}
```

#### GET /settings/payment

Get payment settings.

#### PUT /settings/payment

Update payment settings.

```json
{
  "toyyibpay": {
    "enabled": true,
    "categoryCode": "npr3176z",
    "secretKey": "encrypted-key"
  },
  "bankTransfer": {
    "enabled": true,
    "bankName": "Maybank",
    "accountNumber": "1234567890",
    "accountName": "Polaroid Glossy"
  }
}
```

#### GET /settings/theme

Get theme settings.

#### PUT /settings/theme

Update theme.

```json
{
  "primaryTheme": "soft_pink",
  "customColors": {
    "primary": "#FFB6C1",
    "secondary": "#E6E6FA"
  }
}
```

---

### 10. Notifications

#### GET /notifications

List notifications.

| Query | Type | Description |
|-------|------|-------------|
| read | boolean | Filter by read status |
| type | string | order, review, payment, system |

#### PUT /notifications/:id/read

Mark as read.

#### PUT /notifications/read-all

Mark all as read.

#### GET /notifications/settings

Get notification preferences.

#### PUT /notifications/settings

Update preferences.

```json
{
  "email": {
    "newOrder": true,
    "orderStatusChanged": false,
    "newReview": true,
    "weeklyReport": true
  },
  "push": {
    "newOrder": true,
    "urgent": true
  }
}
```

---

### 11. Webhooks

#### GET /webhooks

List webhooks.

#### POST /webhooks

Create webhook.

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["order.created", "order.status_changed", "payment.completed"],
  "secret": "webhook-secret",
  "isActive": true
}
```

Events: `order.created`, `order.status_changed`, `payment.completed`, `payment.failed`, `review.created`, `user.registered`

#### DELETE /webhooks/:id

Delete webhook.

#### POST /webhooks/:id/test

Test webhook.

---

### 12. File Upload

#### POST /upload

Upload file.

**Headers:** `Content-Type: multipart/form-data`

**Body:** `file`, `folder` (products, banners, reviews)

**Response:**
```json
{
  "success": true,
  "url": "https://cdn.your-domain.com/images/products/abc.jpg",
  "filename": "abc.jpg",
  "size": 102400,
  "mimeType": "image/jpeg"
}
```

#### DELETE /upload/:filename

Delete file.

---

### 13. Health

#### GET /health

Health check.

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "database": "connected"
}
```

---

## Authentication

### Admin JWT Flow

```
1. POST /auth/login → Get JWT token
2. Include in header: Authorization: Bearer <token>
3. Token expires in 1 hour
4. Use /auth/refresh to get new token
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| super_admin | All access |
| admin | orders, products, users, reviews, settings |
| staff | orders (read/update), products (read), users (read) |

---

## Error Handling

All errors return:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid input data |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| General | 100/minute |
| Auth | 10/minute |
| Export | 5/minute |
| Upload | 20/minute |

---

## Versioning

- Base: `/v1`
- Header: `Accept: application/vnd.polaroid.v1+json`

---

## Implementation Priority

| Priority | API | Description |
|----------|-----|-------------|
| P0 | Auth | Admin login/jwt |
| P0 | Orders CRUD | Full order management |
| P0 | Analytics | Dashboard data |
| P0 | Print Sizes | Pricing management (enable/disable, price changes) |
| P0 | Product Metadata | Descriptions, images, TikTok videos per product |
| P1 | Users | User management |
| P1 | Settings | Site settings |
| P2 | Reviews | Moderation |
| P2 | Product Analytics | Per-product sales performance |
| P2 | Cart | Admin cart management |
| P2 | Webhooks | External events |
| P3 | Notifications | Admin notifications |
| P3 | Upload | Media management |
| P3 | Reports | Export functionality |
