# Backend Handoff — Product & Review API

> **Purpose:** SQL seed data and API contract for the Spring Boot backend.
> Frontend: Next.js 16 — calls these endpoints at runtime.

---

## 1. Database Schema (PostgreSQL)

### Table: `print_size`
Stores pricing and dimension data for each product.

```sql
CREATE TABLE print_size (
    id               VARCHAR(20)    PRIMARY KEY,          -- e.g. '2r', '3r', '4r', 'a4'
    name             VARCHAR(20)    NOT NULL,             -- e.g. '2R'
    display_name     VARCHAR(100)   NOT NULL,             -- e.g. '2R (2.5 x 3.5 inches)'
    width            DECIMAL(5,2)   NOT NULL,             -- inches
    height           DECIMAL(5,2)   NOT NULL,             -- inches
    price            DECIMAL(8,2)   NOT NULL,             -- RM price per print
    description      TEXT,
    is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);
```

### Table: `product_meta`
Stores marketing/display content for each product. `id` mirrors `print_size.id`.

```sql
CREATE TABLE product_meta (
    id                  VARCHAR(20)    PRIMARY KEY REFERENCES print_size(id),
    tag                 VARCHAR(50)    NOT NULL DEFAULT 'STANDARD',
    accent_color        VARCHAR(20)    NOT NULL DEFAULT '#6366f1',  -- hex colour
    images              JSONB          NOT NULL DEFAULT '[]',       -- array of image URL strings
    features            JSONB          NOT NULL DEFAULT '[]',       -- array of feature strings
    tiktok_videos       JSONB          NOT NULL DEFAULT '[]',       -- array of {videoId, url, caption}
    short_description   TEXT,
    full_description    TEXT,
    spec_dimensions     VARCHAR(100),
    spec_paper          VARCHAR(100),
    spec_finish         VARCHAR(100),
    spec_print_method   VARCHAR(100),
    spec_processing_time VARCHAR(100),
    spec_min_qty        INT            NOT NULL DEFAULT 1,
    rating              DECIMAL(3,2)   NOT NULL DEFAULT 4.80,
    review_count        INT            NOT NULL DEFAULT 0,
    popular             BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW()
);
```

### Table: `review`
Stores customer reviews (not product-specific — applies to the brand/service overall).

```sql
CREATE TABLE review (
    id          VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    rating      INT           NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(255)  NOT NULL,
    comment     TEXT          NOT NULL,
    user_name   VARCHAR(100),
    avatar_url  VARCHAR(500),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

---

## 2. Seed Data — `print_size`

```sql
INSERT INTO print_size (id, name, display_name, width, height, price, description, is_active) VALUES
('2r', '2R', '2R (2.5 x 3.5 inches)', 2.50, 3.50, 0.50, 'Wallet size - Perfect for keepsakes', TRUE),
('3r', '3R', '3R (3.5 x 5 inches)',   3.50, 5.00, 0.75, 'Standard photo size - Great for albums', TRUE),
('4r', '4R', '4R (4 x 6 inches)',     4.00, 6.00, 1.00, 'Most popular - Classic polaroid style', TRUE),
('a4', 'A4', 'A4 (8.3 x 11.7 inches)', 8.30, 11.70, 3.50, 'Poster size - Perfect for displays', TRUE);
```

---

## 3. Seed Data — `product_meta`

```sql
INSERT INTO product_meta (
    id, tag, accent_color, images, features, tiktok_videos,
    short_description, full_description,
    spec_dimensions, spec_paper, spec_finish, spec_print_method,
    spec_processing_time, spec_min_qty,
    rating, review_count, popular
) VALUES

-- 2R
(
  '2r',
  'MINI',
  '#6366f1',
  '["/images/customer-1.png","/images/customer-2.png","/images/product-collection.png"]',
  '["Wallet-size","Keepsake ready","Pocket-friendly"]',
  '[{"videoId":"7000000000000000001","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000001","caption":"Mini 2R polaroids for wedding favours 💍"}]',
  'Wallet-size polaroid, perfect for keepsakes and gifting.',
  'The 2R print is our smallest and most affordable format — designed to fit perfectly in wallets, scrapbooks, and photo albums. Each print is produced on premium photo-grade glossy paper that preserves vivid colour detail. Lightweight and portable, these mini polaroids are the go-to choice for event giveaways, wedding favours, and everyday memories. Their compact size makes them ideal for decorating vision boards, pinboards, and mini photo walls.',
  '2.5 × 3.5 inches',
  'Glossy photo-grade 230gsm',
  'Glossy',
  'Dye-sublimation',
  '3–4 working days',
  1,
  4.70, 312, FALSE
),

-- 3R
(
  '3r',
  'CLASSIC',
  '#0ea5e9',
  '["/images/product-custom.png","/images/customer-3.png","/images/product-printing.png"]',
  '["Album-ready","Standard format","Gift-perfect"]',
  '[{"videoId":"7000000000000000002","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000002","caption":"3R prints for travel photobook ✈️"}]',
  'Standard photo size, ideal for albums and framing.',
  'The 3R is our standard format, matching the classic photo size most people grew up with. It fits standard photo frames and album sleeves effortlessly. Printed with vibrant, true-to-life colours on our premium glossy paper, the 3R is the versatile choice for travel photos, family portraits, and professional headshots. The slightly larger surface area makes text captions more legible compared to the 2R.',
  '3.5 × 5 inches',
  'Glossy photo-grade 230gsm',
  'Glossy',
  'Dye-sublimation',
  '3–4 working days',
  1,
  4.80, 541, FALSE
),

-- 4R
(
  '4r',
  'BESTSELLER',
  '#f59e0b',
  '["/images/hero-polaroids.png","/images/product-collection.png","/images/customer-4.png"]',
  '["True polaroid feel","Best value","Frame-ready","Custom text support"]',
  '[{"videoId":"7000000000000000003","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000003","caption":"4R unboxing — quality check 📸"},{"videoId":"7000000000000000004","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000004","caption":"Customer reaction to 4R prints 🥹"}]',
  'Classic polaroid look and feel — our most loved size.',
  'The 4R is the definitive polaroid experience. Its iconic 4 × 6 proportion delivers the perfect balance of detail and portability — large enough to appreciate, small enough to carry anywhere. This is our bestselling format, loved by couples, families, and photographers alike. Add custom text at the bottom for that authentic polaroid caption feel. The 4R fits standard 4×6 frames available at any home store, making display effortless.',
  '4 × 6 inches',
  'Glossy photo-grade 260gsm',
  'Glossy / Lustre available',
  'Dye-sublimation',
  '3–4 working days',
  1,
  4.90, 1204, TRUE
),

-- A4
(
  'a4',
  'PREMIUM',
  '#10b981',
  '["/images/product-collection.png","/images/product-printing.png","/images/product-camera.png"]',
  '["Wall-art quality","Hi-res output","Display-worthy","Frame-ready"]',
  '[{"videoId":"7000000000000000005","url":"https://www.tiktok.com/@polaroidglossymy/video/7000000000000000005","caption":"A4 wall art setup at home 🏡"}]',
  'Poster-grade quality — built for walls and statement displays.',
  'The A4 is our largest and most premium format, engineered for customers who demand wall-art quality. Printed at maximum resolution on heavyweight 260gsm glossy stock, A4 prints are stunning when framed or hung directly. Whether it''s a wedding portrait, a travel landscape, or a custom gift for someone special, the A4 makes every photo a statement piece. The physical size allows for incredible fine-detail reproduction that smaller formats simply cannot match.',
  '8.3 × 11.7 inches (A4)',
  'Glossy photo-grade 260gsm',
  'Glossy',
  'Laser / Inkjet HD',
  '3–4 working days',
  1,
  4.80, 187, FALSE
);
```

---

## 4. Seed Data — `review` (sample)

```sql
INSERT INTO review (rating, title, comment, user_name, created_at) VALUES
(5, 'Super quality!',       'Warna sangat vivid, kertas tebal. Definitely order lagi!',   'Aina R.',    '2025-12-10 10:00:00'),
(5, 'Fast delivery!',       'Order hari Isnin, sampai Khamis. Packaging pun cantik.',      'Haziq M.',   '2025-12-18 14:30:00'),
(5, 'Perfect gift idea',    'Bagi kat mak as birthday gift. Dia suka sangat. Thank you!',  'Syafiqah Z.','2026-01-05 09:15:00'),
(4, 'Good quality overall', 'Gambar clear, tapi satu corner ada sikit scratch. Still ok.', 'Daniel T.',  '2026-01-14 16:00:00'),
(5, 'Love the 4R size',     'Saiz perfect, frame-ready terus. Best purchase of the year.', 'Nurul H.',   '2026-02-02 11:45:00');
```

---

## 5. API Contract

All endpoints return JSON. Base URL: `https://api.polaroidglossy.my` (or `/api` when proxied).

---

### 5.1 `GET /api/products`
List all **active** products with full metadata merged.

**Response `200`**
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
      "description": "Most popular - Classic polaroid style",
      "shortDescription": "Classic polaroid look and feel — our most loved size.",
      "fullDescription": "The 4R is the definitive...",
      "images": ["/images/hero-polaroids.png", "/images/product-collection.png", "/images/customer-4.png"],
      "image": "/images/hero-polaroids.png",
      "popular": true,
      "tag": "BESTSELLER",
      "accentColor": "#f59e0b",
      "features": ["True polaroid feel", "Best value", "Frame-ready", "Custom text support"],
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
      "tiktokVideos": [
        {
          "videoId": "7000000000000000003",
          "url": "https://www.tiktok.com/@polaroidglossymy/video/7000000000000000003",
          "caption": "4R unboxing — quality check 📸"
        }
      ]
    }
  ]
}
```

**Notes**
- Only return rows where `print_size.is_active = TRUE`
- Order by `print_size.price ASC`
- `image` = first element of `images` array (convenience field for list views)
- If `product_meta` row is missing for a product, return defaults (empty arrays, `tag = 'STANDARD'`, `accentColor = '#6366f1'`, `rating = 4.8`, `reviewCount = 0`, `popular = false`)

---

### 5.2 `GET /api/products/{id}`
Single product detail by ID (e.g. `2r`, `4r`, `a4`).

**Path param:** `id` — the product slug

**Response `200`**
```json
{
  "success": true,
  "product": {
    "id": "4r",
    "name": "4R",
    "displayName": "4R (4 x 6 inches)",
    "width": 4.0,
    "height": 6.0,
    "price": 1.00,
    "description": "Most popular - Classic polaroid style",
    "shortDescription": "Classic polaroid look and feel — our most loved size.",
    "fullDescription": "The 4R is the definitive...",
    "images": ["/images/hero-polaroids.png", "/images/product-collection.png"],
    "image": "/images/hero-polaroids.png",
    "popular": true,
    "tag": "BESTSELLER",
    "accentColor": "#f59e0b",
    "features": ["True polaroid feel", "Best value", "Frame-ready", "Custom text support"],
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
    "tiktokVideos": [
      {
        "videoId": "7000000000000000003",
        "url": "https://www.tiktok.com/@polaroidglossymy/video/7000000000000000003",
        "caption": "4R unboxing — quality check 📸"
      }
    ]
  }
}
```

**Response `404`** — product not found or `is_active = false`
```json
{ "success": false, "error": "Product not found" }
```

---

### 5.3 `GET /api/reviews`
All customer reviews (not filtered by product).

**Response `200`**
```json
{
  "success": true,
  "reviews": [
    {
      "id": "uuid-here",
      "rating": 5,
      "title": "Super quality!",
      "comment": "Warna sangat vivid, kertas tebal...",
      "createdAt": "2025-12-10T10:00:00Z",
      "user": {
        "name": "Aina R.",
        "avatar": null
      }
    }
  ]
}
```

**Notes**
- Order by `created_at DESC`
- `user.avatar` may be `null` — frontend shows initials as fallback
- No pagination needed at this stage

---

## 6. CORS Configuration

Allow the following origins:

```
http://localhost:3000          (local dev)
https://polaroidglossy.my      (production)
https://www.polaroidglossy.my
```

Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
Allowed headers: `Content-Type, Authorization`

---

## 7. Field Type Summary

| Field | Java Type | DB Type | Notes |
|---|---|---|---|
| `id` | `String` | `VARCHAR(20)` | Human-readable slug: `2r`, `3r`, `4r`, `a4` |
| `images` | `List<String>` | `JSONB` | Array of relative or absolute image URLs |
| `features` | `List<String>` | `JSONB` | Short feature bullet strings |
| `tiktokVideos` | `List<TikTokVideo>` | `JSONB` | `{videoId, url, caption}` objects |
| `specs` | `ProductSpecs` | Flat columns in `product_meta` | Expanded to nested object in response |
| `accentColor` | `String` | `VARCHAR(20)` | Hex colour e.g. `#f59e0b` |
| `rating` | `BigDecimal` | `DECIMAL(3,2)` | e.g. `4.90` |
| `price` | `BigDecimal` | `DECIMAL(8,2)` | RM — e.g. `1.00` |

---

## 8. JPA Entity Notes (Spring Boot)

- Use `@Column(columnDefinition = "jsonb")` + Jackson `ObjectMapper` or Hibernate types for JSONB fields
- Recommended library: `io.hypersistence:hypersistence-utils-hibernate-63` for `@Type(JsonType.class)` on JSONB columns
- Map `snake_case` DB columns to `camelCase` Java fields via `spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl` or use `@Column(name = "accent_color")` explicitly
