# Backend Handoff — Polaroid Glossy

> **Purpose:** Complete SQL schema, seed data, and API contract for the Spring Boot backend.
> The Next.js frontend calls all endpoints listed here at runtime.
> Backend base URL: `https://api.polaroidglossy.my` (proxied as `/api` in dev).

---

## 0. UAT Database Connection

Both Next.js and Spring Boot must point to the **same PostgreSQL database** for UAT.

| | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `polaroid_glossy_uat` |
| Username | `jerza` |
| Password | *(none — local trust auth)* |

**Next.js** (`.env.uat`):
```
DATABASE_URL=postgresql://jerza@localhost:5432/polaroid_glossy_uat
```

**Spring Boot** (`application-uat.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/polaroid_glossy_uat
spring.datasource.username=jerza
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=validate
```

> The full `spring-boot-uat.properties` file is in the project root — copy it to Spring Boot's `src/main/resources/application-uat.properties`.

> Run Spring Boot with: `java -jar app.jar --spring.profiles.active=uat`

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Seed Data](#2-seed-data)
3. [Image Storage (Amazon S3)](#3-image-storage-amazon-s3)
4. [API Contract — Products](#4-api-contract--products)
5. [API Contract — Orders (Admin)](#5-api-contract--orders-admin)
6. [API Contract — Reviews](#6-api-contract--reviews)
7. [Order Status Flow](#7-order-status-flow)
8. [CORS Configuration](#8-cors-configuration)
9. [Field Type Summary](#9-field-type-summary)
10. [JPA Entity Notes](#10-jpa-entity-notes)

---

## 1. Database Schema

### `users`

```sql
CREATE TABLE users (
    id            VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id   VARCHAR(100)  UNIQUE,
    email         VARCHAR(255)  UNIQUE NOT NULL,
    name          VARCHAR(255),
    avatar        VARCHAR(500),
    phone         VARCHAR(20),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### `print_sizes`

```sql
CREATE TABLE print_sizes (
    id            VARCHAR(20)   PRIMARY KEY,   -- '2r', '3r', '4r', 'a4'
    name          VARCHAR(20)   NOT NULL,       -- '2R', '3R', etc.
    display_name  VARCHAR(100)  NOT NULL,
    width         DECIMAL(5,2)  NOT NULL,       -- inches
    height        DECIMAL(5,2)  NOT NULL,       -- inches
    price         DECIMAL(8,2)  NOT NULL,       -- RM per print
    description   TEXT,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### `product_meta`

```sql
CREATE TABLE product_meta (
    id                   VARCHAR(20)   PRIMARY KEY REFERENCES print_sizes(id),
    tag                  VARCHAR(50)   NOT NULL DEFAULT 'STANDARD',
    accent_color         VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
    images               JSONB         NOT NULL DEFAULT '[]',     -- ["url1","url2"]
    features             JSONB         NOT NULL DEFAULT '[]',     -- ["feature1",...]
    tiktok_videos        JSONB         NOT NULL DEFAULT '[]',     -- [{videoId,url,caption}]
    short_description    TEXT,
    full_description     TEXT,
    spec_dimensions      VARCHAR(100),
    spec_paper           VARCHAR(100),
    spec_finish          VARCHAR(100),
    spec_print_method    VARCHAR(100),
    spec_processing_time VARCHAR(100),
    spec_min_qty         INT           NOT NULL DEFAULT 1,
    rating               DECIMAL(3,2)  NOT NULL DEFAULT 4.80,
    review_count         INT           NOT NULL DEFAULT 0,
    popular              BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### `orders`

```sql
CREATE TABLE orders (
    id              VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(50)   UNIQUE NOT NULL,     -- e.g. PP-M0ABCD-XY12
    user_id         VARCHAR(36)   REFERENCES users(id),
    customer_name   VARCHAR(255)  NOT NULL,
    customer_email  VARCHAR(255)  NOT NULL,
    customer_phone  VARCHAR(20),
    customer_state  VARCHAR(5)    DEFAULT 'w',          -- 'w' = West Malaysia, 'e' = East
    status          VARCHAR(20)   NOT NULL DEFAULT 'pending',
    subtotal        DECIMAL(10,2) NOT NULL,
    shipping        DECIMAL(10,2) NOT NULL DEFAULT 0,
    total           DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(20)   DEFAULT 'bank_transfer', -- 'bank_transfer' | 'toyyibpay'
    payment_status  VARCHAR(20)   DEFAULT 'pending',        -- 'pending' | 'paid' | 'failed'
    toyyibpay_ref   VARCHAR(100),                           -- ToyyibPay BillCode
    paid_at         TIMESTAMP,
    notes           TEXT,
    tracking_number VARCHAR(100),
    shipped_at      TIMESTAMP,
    delivered_at    TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancel_reason   TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### `order_items`

```sql
CREATE TABLE order_items (
    id           VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     VARCHAR(36)   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    size_id      VARCHAR(20)   NOT NULL REFERENCES print_sizes(id),
    quantity     INT           NOT NULL,
    unit_price   DECIMAL(8,2)  NOT NULL,
    total_price  DECIMAL(10,2) NOT NULL,
    images       JSONB         NOT NULL DEFAULT '[]',   -- S3 URLs of uploaded photos
    custom_texts JSONB         DEFAULT '[]',            -- custom caption per photo
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### `order_status_history`

```sql
CREATE TABLE order_status_history (
    id         VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   VARCHAR(36)  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(20)  NOT NULL,
    message    TEXT,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

### `reviews`

```sql
CREATE TABLE reviews (
    id          VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     VARCHAR(36)   NOT NULL REFERENCES users(id),
    order_id    VARCHAR(36)   NOT NULL REFERENCES orders(id),
    size_id     VARCHAR(20)   NOT NULL REFERENCES print_sizes(id),
    rating      INT           NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(255)  NOT NULL,
    comment     TEXT          NOT NULL,
    images      JSONB         DEFAULT '[]',
    is_verified BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, order_id)
);
```

---

## 2. Seed Data

### `print_sizes`

> Already seeded in both `polaroid_glossy_dev` and `polaroid_glossy_uat`. Run this only for a fresh database.

```sql
INSERT INTO print_sizes (id, name, "displayName", width, height, price, description, "isActive", "createdAt", "updatedAt") VALUES
('2r', '2R', '2R (2.5×3.5 in)',  2.50,  3.50,  3.00, 'Wallet-size print, great for albums',            TRUE, NOW(), NOW()),
('3r', '3R', '3R (3.5×5 in)',    3.50,  5.00,  4.00, 'Classic small print',                            TRUE, NOW(), NOW()),
('4r', '4R', '4R (4×6 in)',      4.00,  6.00,  5.00, 'Most popular size — standard photo print',       TRUE, NOW(), NOW()),
('a4', 'A4', 'A4 (8.3×11.7 in)', 8.27, 11.69, 12.00, 'Large format print, poster quality',            TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

> Note: Column names use Prisma's camelCase mapping (`"displayName"`, `"isActive"`) because the schema uses `@@map` without custom column names.

### `product_meta`

```sql
INSERT INTO product_meta (
    id, tag, accent_color, images, features, tiktok_videos,
    short_description, full_description,
    spec_dimensions, spec_paper, spec_finish, spec_print_method,
    spec_processing_time, spec_min_qty, rating, review_count, popular
) VALUES
('2r','MINI','#6366f1',
 '["/images/customer-1.png","/images/customer-2.png","/images/product-collection.png"]',
 '["Wallet-size","Keepsake ready","Pocket-friendly"]',
 '[{"videoId":"7000000000000000001","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000001","caption":"Mini 2R polaroids for wedding favours 💍"}]',
 'Wallet-size polaroid, perfect for keepsakes and gifting.',
 'The 2R print is our smallest and most affordable format — designed to fit perfectly in wallets, scrapbooks, and photo albums.',
 '2.5 × 3.5 inches','Glossy photo-grade 230gsm','Glossy','Dye-sublimation','3–4 working days',1,4.70,312,FALSE),

('3r','CLASSIC','#0ea5e9',
 '["/images/product-custom.png","/images/customer-3.png","/images/product-printing.png"]',
 '["Album-ready","Standard format","Gift-perfect"]',
 '[{"videoId":"7000000000000000002","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000002","caption":"3R prints for travel photobook ✈️"}]',
 'Standard photo size, ideal for albums and framing.',
 'The 3R is our standard format, matching the classic photo size most people grew up with.',
 '3.5 × 5 inches','Glossy photo-grade 230gsm','Glossy','Dye-sublimation','3–4 working days',1,4.80,541,FALSE),

('4r','BESTSELLER','#f59e0b',
 '["/images/hero-polaroids.png","/images/product-collection.png","/images/customer-4.png"]',
 '["True polaroid feel","Best value","Frame-ready","Custom text support"]',
 '[{"videoId":"7000000000000000003","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000003","caption":"4R unboxing — quality check 📸"},{"videoId":"7000000000000000004","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000004","caption":"Customer reaction to 4R prints 🥹"}]',
 'Classic polaroid look and feel — our most loved size.',
 'The 4R is the definitive polaroid experience. Its iconic 4 × 6 proportion delivers the perfect balance of detail and portability.',
 '4 × 6 inches','Glossy photo-grade 260gsm','Glossy / Lustre available','Dye-sublimation','3–4 working days',1,4.90,1204,TRUE),

('a4','PREMIUM','#10b981',
 '["/images/product-collection.png","/images/product-printing.png","/images/product-camera.png"]',
 '["Wall-art quality","Hi-res output","Display-worthy","Frame-ready"]',
 '[{"videoId":"7000000000000000005","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000005","caption":"A4 wall art setup at home 🏡"}]',
 'Poster-grade quality — built for walls and statement displays.',
 'The A4 is our largest and most premium format, engineered for customers who demand wall-art quality.',
 '8.3 × 11.7 inches (A4)','Glossy photo-grade 260gsm','Glossy','Laser / Inkjet HD','3–4 working days',1,4.80,187,FALSE);
```

### `reviews` (sample)

```sql
INSERT INTO reviews (user_id, order_id, size_id, rating, title, comment, is_verified) VALUES
-- Replace user_id and order_id with real IDs after first orders are placed
('user-id-placeholder', 'order-id-placeholder', '4r', 5, 'Super quality!', 'Warna sangat vivid, kertas tebal. Definitely order lagi!', TRUE),
('user-id-placeholder', 'order-id-placeholder', '4r', 5, 'Fast delivery!', 'Order hari Isnin, sampai Khamis. Packaging pun cantik.', TRUE);
```

---

## 3. Image Storage (Amazon S3)

All customer-uploaded photos are stored in **Amazon S3** before the order is placed.

| Environment | Bucket | Region |
|---|---|---|
| Development | `polaroid-glossy-dev` | `us-east-1` |
| Production | `polaroid-glossy-prod` | `ap-southeast-1` |

**S3 key format:** `orders/{sessionId}/{uuid}.jpg`

> `sessionId` is a UUID generated once per checkout session — all photos from one order share the same folder.

**Image URL format (dev):**
```
https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/a3f8c2d1-9b4e-4f2a-8c6d-1e2f3a4b5c6d/7e9f1a2b.jpg
```

**Image URL format (prod — via CloudFront):**
```
https://YOUR-CLOUDFRONT-ID.cloudfront.net/orders/2026-03-15/abc123.jpg
```

### How images arrive in orders

`order_items.images` is a JSONB array of S3 URLs:
```json
["https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo1.jpg",
 "https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo2.jpg"]
```

The backend (admin) can:
- **View** images by opening the URL directly in a browser
- **Download** images by fetching the URL (publicly readable in dev; via CloudFront in prod)
- **Batch download** by iterating `order_items.images[]` for an order — all photos for one order are already in the same S3 folder
- **Key extraction** — use `s3Url.substring(s3Url.indexOf("/orders/") + 1)` to get the S3 key from any URL regardless of folder structure

### S3 IAM Credentials Strategy

Two options depending on environment:

**Option A — Same IAM user (dev / simple setup)**

Both Next.js and Spring Boot share the same credentials and access the same bucket.

```
Next.js  → PutObject  → S3 bucket
Spring Boot → GetObject, DeleteObject → same S3 bucket
```

Use Option A now — same keys, easiest to set up.

**Option B — Separate IAM users (production best practice)**

| IAM User | Permissions | Used by |
|---|---|---|
| `polaroid-nextjs` | `s3:PutObject` only | Next.js frontend (upload) |
| `polaroid-backend` | `s3:GetObject`, `s3:DeleteObject` | Spring Boot (download + delete) |

Spring Boot IAM policy (production):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::polaroid-glossy-prod/*"
    }
  ]
}
```

Next.js IAM policy (production):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::polaroid-glossy-prod/*"
    }
  ]
}
```

> Switch to Option B before going live. For dev, share the same key from `.env`.

### AWS credentials for backend

```properties
# application.properties
cloud.aws.credentials.access-key=${AWS_ACCESS_KEY_ID}
cloud.aws.credentials.secret-key=${AWS_SECRET_ACCESS_KEY}
cloud.aws.region.static=${AWS_REGION}
cloud.aws.s3.bucket=${AWS_S3_BUCKET}
```

**Dev values (same as Next.js `.env`):**

| Variable | Dev Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | `AKIAT3ZKKEKVEGDA2FEW` |
| `AWS_SECRET_ACCESS_KEY` | *(share securely — do not commit)* |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET` | `polaroid-glossy-dev` |

> **Important:** Rotate these keys before production. Generate new IAM keys per Option B above.

Add to `pom.xml`:
```xml
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-s3</artifactId>
    <version>3.1.1</version>
</dependency>
```

---

## 4. API Contract — Products

### `GET /api/products`
List all active products.

**Response `200`**
```json
{
  "success": true,
  "products": [{
    "id": "4r",
    "name": "4R",
    "displayName": "4R (4 x 6 inches)",
    "width": 4.0,
    "height": 6.0,
    "price": 1.00,
    "shortDescription": "Classic polaroid look and feel.",
    "fullDescription": "The 4R is the definitive...",
    "images": ["/images/hero-polaroids.png"],
    "image": "/images/hero-polaroids.png",
    "popular": true,
    "tag": "BESTSELLER",
    "accentColor": "#f59e0b",
    "features": ["True polaroid feel", "Best value"],
    "specs": {
      "dimensions": "4 × 6 inches",
      "paper": "Glossy photo-grade 260gsm",
      "finish": "Glossy / Lustre available",
      "printMethod": "Dye-sublimation",
      "processingTime": "3–4 working days",
      "minQty": 1
    },
    "rating": 4.9,
    "reviewCount": 1204,
    "tiktokVideos": [{"videoId": "xxx", "url": "https://tiktok.com/...", "caption": "..."}]
  }]
}
```

### `GET /api/products/{id}`
Single product. Returns `404` if not found or inactive.

---

## 5. API Contract — Orders (Admin)

These are the endpoints the **Spring Boot admin backend** must implement so staff can manage orders.

---

### `GET /api/admin/orders`
List all orders with pagination and filters.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (0-based, default 0) |
| `size` | int | Page size (default 20) |
| `status` | string | Filter by status (pending, processing, posted, on_delivery, delivered, cancelled) |
| `paymentStatus` | string | Filter by payment status (pending, paid, failed) |
| `search` | string | Search by orderNumber, customerName, or customerEmail |
| `from` | date | Created from date (ISO 8601) |
| `to` | date | Created to date (ISO 8601) |

**Response `200`**
```json
{
  "success": true,
  "orders": [
    {
      "id": "clxxx",
      "orderNumber": "PP-M0ABCD-XY12",
      "customerName": "Ahmad Syafiq",
      "customerEmail": "syafiq@email.com",
      "customerPhone": "0123456789",
      "customerState": "w",
      "status": "processing",
      "paymentMethod": "toyyibpay",
      "paymentStatus": "paid",
      "toyyibpayRef": "billcode123",
      "subtotal": 5.00,
      "shipping": 7.00,
      "total": 12.00,
      "itemCount": 2,
      "totalPhotos": 5,
      "notes": null,
      "trackingNumber": null,
      "createdAt": "2026-03-15T10:30:00Z",
      "paidAt": "2026-03-15T10:32:00Z"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 143,
    "totalPages": 8
  }
}
```

---

### `GET /api/admin/orders/{id}`
Full order detail including all items, images, and status history.

**Response `200`**
```json
{
  "success": true,
  "order": {
    "id": "clxxx",
    "orderNumber": "PP-M0ABCD-XY12",
    "customerName": "Ahmad Syafiq",
    "customerEmail": "syafiq@email.com",
    "customerPhone": "0123456789",
    "customerState": "w",
    "status": "processing",
    "paymentMethod": "toyyibpay",
    "paymentStatus": "paid",
    "toyyibpayRef": "billcode123",
    "subtotal": 5.00,
    "shipping": 7.00,
    "total": 12.00,
    "notes": null,
    "trackingNumber": null,
    "createdAt": "2026-03-15T10:30:00Z",
    "paidAt": "2026-03-15T10:32:00Z",
    "shippedAt": null,
    "deliveredAt": null,
    "items": [
      {
        "id": "item-id",
        "sizeId": "4r",
        "sizeName": "4R",
        "quantity": 3,
        "unitPrice": 1.00,
        "totalPrice": 3.00,
        "images": [
          "https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo1.jpg",
          "https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo2.jpg",
          "https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo3.jpg"
        ],
        "customTexts": ["Our Anniversary", "", "Vacation 2026"]
      }
    ],
    "statusHistory": [
      { "status": "pending",    "message": "Order placed successfully", "createdAt": "2026-03-15T10:30:00Z" },
      { "status": "processing", "message": "Payment confirmed",          "createdAt": "2026-03-15T10:32:00Z" }
    ]
  }
}
```

---

### `PUT /api/admin/orders/{id}/status`
Update order status. Creates a status history entry automatically.

**Request body:**
```json
{
  "status": "posted",
  "message": "Parcel handed to Pos Laju",
  "trackingNumber": "EQ123456789MY"
}
```

**Valid status transitions:**

```
pending → processing → posted → on_delivery → delivered
pending/processing → cancelled → refunded
```

| Field | Required | Notes |
|---|---|---|
| `status` | Yes | One of the valid statuses above |
| `message` | No | Custom note shown in status history |
| `trackingNumber` | No | Required when status = `posted` |

**Response `200`**
```json
{
  "success": true,
  "order": {
    "id": "clxxx",
    "orderNumber": "PP-M0ABCD-XY12",
    "status": "posted",
    "trackingNumber": "EQ123456789MY",
    "shippedAt": "2026-03-16T09:00:00Z"
  }
}
```

---

### `GET /api/admin/orders/{id}/images/download`
Download all photos for an order as a ZIP file.

**Response:** `application/zip` binary stream

**Filename:** `order-PP-M0ABCD-XY12-photos.zip`

**ZIP structure:**
```
order-PP-M0ABCD-XY12-photos.zip
├── item-1-4R/
│   ├── photo-1_text-Our Anniversary.jpg
│   ├── photo-2.jpg
│   └── photo-3_text-Vacation 2026.jpg
└── item-2-2R/
    ├── photo-1.jpg
    └── photo-2.jpg
```

**Implementation notes (Spring Boot):**
- Fetch each S3 URL, write to `ZipOutputStream`
- Use `S3Client.getObject()` with the key extracted from the URL
- Include `customText` in filename if present (sanitise special chars)
- Set header: `Content-Disposition: attachment; filename="order-{orderNumber}-photos.zip"`

---

### `GET /api/admin/orders/export`
Export all orders (or filtered) as CSV for reporting.

**Query params:** Same as `GET /api/admin/orders`

**Response:** `text/csv`

**CSV columns:**
```
orderNumber, customerName, customerEmail, customerPhone, customerState,
status, paymentMethod, paymentStatus, subtotal, shipping, total,
itemCount, totalPhotos, createdAt, paidAt, shippedAt, deliveredAt, trackingNumber
```

---

### `GET /api/admin/orders/stats`
Dashboard summary stats.

**Response `200`**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 143,
    "pendingOrders": 12,
    "processingOrders": 8,
    "postedOrders": 5,
    "deliveredOrders": 112,
    "cancelledOrders": 6,
    "totalRevenue": 2847.50,
    "todayOrders": 4,
    "todayRevenue": 48.00
  }
}
```

---

## 6. API Contract — Reviews

### `GET /api/reviews`
All reviews, newest first.

**Response `200`**
```json
{
  "success": true,
  "reviews": [{
    "id": "uuid",
    "rating": 5,
    "title": "Super quality!",
    "comment": "Warna sangat vivid...",
    "createdAt": "2026-01-10T10:00:00Z",
    "user": { "name": "Aina R.", "avatar": null }
  }]
}
```

---

## 7. Order Status Flow

```
         ┌─────────────────────────────────────┐
         │            ORDER CREATED             │
         │         status: pending              │
         │     paymentStatus: pending           │
         └──────────────┬──────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          │ ToyyibPay callback received │
          │   paymentStatus → paid      │
          └─────────────┬──────────────┘
                        │
                 status: processing
                 (admin reviews order,
                  downloads photos,
                  sends to print)
                        │
                 status: posted
                 (trackingNumber set,
                  shippedAt recorded)
                        │
                 status: on_delivery
                 (courier scanned)
                        │
                 status: delivered
                 (deliveredAt recorded)


  At any point before delivered:
  → status: cancelled → refunded
```

**Shipping cost by state:**
| `customerState` | Cost |
|---|---|
| `w` (West Malaysia) | RM 7.00 |
| `e` (East Malaysia — Sabah/Sarawak) | RM 11.00 |

---

## 8. CORS Configuration

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        // Allowed origins
        // http://localhost:3000
        // https://remissly-sirenic-jacinda.ngrok-free.dev  (dev ngrok)
        // https://polaroidglossy.my
        // https://www.polaroidglossy.my
    }
}
```

Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
Allowed headers: `Content-Type, Authorization`

---

## 9. Field Type Summary

| Field | Java Type | DB Type | Notes |
|---|---|---|---|
| `id` | `String` | `VARCHAR(36)` | UUID |
| `orderNumber` | `String` | `VARCHAR(50)` | Format: `PP-{timestamp}-{random}` |
| `status` | `String` / Enum | `VARCHAR(20)` | pending, processing, posted, on_delivery, delivered, cancelled, refunded |
| `paymentStatus` | `String` / Enum | `VARCHAR(20)` | pending, paid, failed |
| `customerState` | `String` | `VARCHAR(5)` | `w` = West MY, `e` = East MY |
| `images` | `List<String>` | `JSONB` | Array of S3 URLs |
| `customTexts` | `List<String>` | `JSONB` | Custom caption per photo, parallel to images |
| `subtotal` | `BigDecimal` | `DECIMAL(10,2)` | RM |
| `total` | `BigDecimal` | `DECIMAL(10,2)` | subtotal + shipping |
| `rating` | `Integer` | `INT` | 1–5 |
| `price` (print_sizes) | `BigDecimal` | `DECIMAL(8,2)` | RM per print |

---

## 10. JPA Entity Notes (Spring Boot)

### JSONB fields
```java
// Add dependency: io.hypersistence:hypersistence-utils-hibernate-63
@Type(JsonType.class)
@Column(columnDefinition = "jsonb")
private List<String> images;

@Type(JsonType.class)
@Column(columnDefinition = "jsonb")
private List<String> customTexts;
```

### Naming strategy
Use `@Column(name = "snake_case_column")` explicitly, or configure:
```properties
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

### S3 download service (Spring Boot)
```java
@Service
public class S3Service {
    @Autowired
    private S3Client s3Client;

    public byte[] downloadFile(String s3Url) {
        // Extract key from URL: orders/2026-03-15/photo1.jpg
        String key = s3Url.substring(s3Url.indexOf("/orders/") + 1);
        GetObjectRequest request = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();
        return s3Client.getObjectAsBytes(request).asByteArray();
    }
}
```

### ZIP download controller
```java
@GetMapping("/api/admin/orders/{id}/images/download")
public void downloadOrderImages(@PathVariable String id, HttpServletResponse response) throws IOException {
    Order order = orderService.findById(id);
    response.setContentType("application/zip");
    response.setHeader("Content-Disposition",
        "attachment; filename=\"order-" + order.getOrderNumber() + "-photos.zip\"");

    try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
        for (OrderItem item : order.getItems()) {
            int photoIndex = 1;
            for (String imageUrl : item.getImages()) {
                String filename = "item-" + item.getSizeId() + "/photo-" + photoIndex + ".jpg";
                zos.putNextEntry(new ZipEntry(filename));
                zos.write(s3Service.downloadFile(imageUrl));
                zos.closeEntry();
                photoIndex++;
            }
        }
    }
}
```
