# Backend Changes Required — Image Upload & Cart Redesign

> **Date:** 2026-07-05
> **Status:** Pending Implementation
> **Backend Repo:** `backend-polaroid-glossy`

---

## Overview

The frontend has been redesigned to solve three critical problems:

1. **localStorage overflow** — base64 images exceed 5-10MB browser limit with 100+ photos
2. **Data loss on login** — OAuth redirect wipes React state, user loses uploaded photos
3. **No temp storage** — images only exist in browser memory until checkout

### New Flow

```
OLD: Browse → Upload (guest) → localStorage (base64) → Checkout → Upload to S3
NEW: Browse → LOGIN REQUIRED → Upload to Supabase → Checkout (URLs pre-stored)
```

### What This Means for Backend

| Area | Impact |
|------|--------|
| **Cart API** | NEW — must implement full CRUD |
| **Order Creation** | MODIFIED — `imageUrls` now pre-populated |
| **Image Upload** | MOSTLY UNCHANGED — still used as fallback |
| **Image Download** | MODIFIED — must handle Supabase URLs |
| **Cleanup** | NEW — orphaned temp images |

---

## 1. New Database Table: `carts`

The `carts` and `cart_items` tables already exist in the Prisma schema. Add equivalent JPA entities.

### SQL (if not using Prisma migrations)

```sql
CREATE TABLE carts (
    id          VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  VARCHAR(100)  UNIQUE NOT NULL,
    user_id     VARCHAR(36)   REFERENCES users(id),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id           VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id      VARCHAR(36)   NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    size_id      VARCHAR(20)   NOT NULL REFERENCES print_sizes(id),
    quantity     INT           NOT NULL DEFAULT 1,
    images       JSONB         NOT NULL DEFAULT '[]',   -- Supabase URLs
    custom_texts JSONB         DEFAULT '[]',
    unit_price   DECIMAL(8,2)  NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
```

### JPA Entity

```java
@Entity
@Table(name = "carts")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "user_id")
    private String userId;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

```java
@Entity
@Table(name = "cart_items")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "size_id", nullable = false)
    private String sizeId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> images = new ArrayList<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> customTexts = new ArrayList<>();

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

---

## 2. New API Endpoints — Cart

### `GET /api/cart`

Get the authenticated user's cart.

**Auth:** `Authorization: Bearer <jwt>`

**Logic:**
1. Extract `userId` from JWT
2. Find cart by `userId` (create if not exists)
3. Return cart with all items

**Response:**
```json
{
  "success": true,
  "cart": {
    "id": "uuid",
    "userId": "uuid",
    "items": [
      {
        "id": "uuid",
        "sizeId": "4r",
        "quantity": 2,
        "images": ["https://supabase-url/photo1.jpg"],
        "customTexts": ["Our Anniversary"],
        "unitPrice": 5.00
      }
    ]
  }
}
```

**Error Responses:**
- `401` — No valid JWT
- `500` — Database error

---

### `POST /api/cart`

Add an item to the user's cart.

**Auth:** `Authorization: Bearer <jwt>`

**Request Body:**
```json
{
  "sizeId": "4r",
  "quantity": 2,
  "images": ["https://supabase-url/photo1.jpg", "https://supabase-url/photo2.jpg"],
  "customTexts": ["Our Anniversary", ""]
}
```

**Logic:**
1. Extract `userId` from JWT
2. Find or create cart for user
3. Look up `PrintSize` by `sizeId` to get `unitPrice`
4. Create `CartItem` with the provided data
5. Return the created item

**Response:**
```json
{
  "success": true,
  "cartItem": {
    "id": "uuid",
    "sizeId": "4r",
    "quantity": 2,
    "images": ["https://supabase-url/photo1.jpg"],
    "customTexts": ["Our Anniversary"],
    "unitPrice": 5.00
  }
}
```

**Validation:**
- `sizeId` must exist in `print_sizes`
- `quantity` must be >= 1
- `images` must be a valid JSON array

---

### `PUT /api/cart/items/{itemId}`

Update a cart item.

**Auth:** `Authorization: Bearer <jwt>`

**Request Body (all fields optional):**
```json
{
  "quantity": 3,
  "images": ["https://supabase-url/photo1.jpg", "https://supabase-url/photo2.jpg"],
  "customTexts": ["Our Anniversary", ""]
}
```

**Logic:**
1. Extract `userId` from JWT
2. Find `CartItem` by `itemId`, verify it belongs to user's cart
3. Update only provided fields
4. Return updated item

**Error Responses:**
- `404` — Item not found or doesn't belong to user
- `400` — Invalid data

---

### `DELETE /api/cart/items/{itemId}`

Remove an item from the cart.

**Auth:** `Authorization: Bearer <jwt>`

**Logic:**
1. Extract `userId` from JWT
2. Find `CartItem` by `itemId`, verify ownership
3. Delete the item (cascade handles cleanup)

**Response:**
```json
{
  "success": true
}
```

---

### `DELETE /api/cart`

Clear the entire cart for the user.

**Auth:** `Authorization: Bearer <jwt>`

**Logic:**
1. Extract `userId` from JWT
2. Find cart by `userId`
3. Delete all `CartItem` records
4. Delete the cart itself

**Response:**
```json
{
  "success": true
}
```

---

## 3. Modified: Order Creation

### `POST /api/orders` — Request Body Change

**BEFORE:**
```json
{
  "items": [
    {
      "sizeId": "4r",
      "quantity": 2,
      "imageUrls": [],
      "customTexts": ["Our Anniversary"]
    }
  ]
}
```

**AFTER:**
```json
{
  "items": [
    {
      "sizeId": "4r",
      "quantity": 2,
      "imageUrls": [
        "https://xxx.supabase.co/storage/v1/object/public/order-photos/orders/temp_user_123/1700000000_abc123.jpg",
        "https://xxx.supabase.co/storage/v1/object/public/order-photos/orders/temp_user_123/1700000000_def456.jpg"
      ],
      "customTexts": ["Our Anniversary", ""]
    }
  ]
}
```

**Key Change:** `imageUrls` is now **pre-populated** with Supabase URLs. The backend should:

1. Validate that `imageUrls` is a non-empty array
2. Store these URLs directly in `order_items.images`
3. Optionally: verify URLs are valid Supabase Storage URLs
4. Optionally: rename/move images from `temp_*` to permanent `orders/{orderNumber}/` path

---

## 4. Modified: Image Download Service

### S3Service Update

The current `S3Service.downloadFile()` extracts the S3 key from the URL. With Supabase URLs, the extraction logic changes.

**Current S3 URL pattern:**
```
https://polaroid-glossy-dev.s3.us-east-1.amazonaws.com/orders/2026-03-15/photo1.jpg
```

**New Supabase URL pattern:**
```
https://xxx.supabase.co/storage/v1/object/public/order-photos/orders/temp_user_123/1700000000_abc123.jpg
```

**Updated download logic:**

```java
@Service
public class ImageDownloadService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseServiceKey;

    public byte[] downloadFile(String imageUrl) {
        // Handle both S3 and Supabase URLs
        if (imageUrl.contains("supabase.co")) {
            return downloadFromSupabase(imageUrl);
        } else {
            return downloadFromS3(imageUrl);
        }
    }

    private byte[] downloadFromSupabase(String imageUrl) {
        // Supabase public URLs can be fetched directly
        // For private buckets, use service-role key in Authorization header
        try {
            URL url = new URL(imageUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            // If bucket is private, add auth header:
            // conn.setRequestProperty("Authorization", "Bearer " + supabaseServiceKey);

            try (InputStream is = conn.getInputStream()) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to download from Supabase: " + e.getMessage());
        }
    }

    private byte[] downloadFromS3(String imageUrl) {
        // Existing S3 logic
        String key = imageUrl.substring(imageUrl.indexOf("/orders/") + 1);
        GetObjectRequest request = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();
        return s3Client.getObjectAsBytes(request).asByteArray();
    }
}
```

---

## 5. New: Cleanup Job for Orphaned Images

Users may upload photos to `orders/temp_*` but abandon the cart. These need periodic cleanup.

### Scheduled Task

```java
@Component
public class OrphanedImagesCleanup {

    @Autowired
    private SupabaseStorageService storageService;

    /**
     * Runs daily at 3 AM.
     * Deletes images in orders/temp_* that are older than 24 hours
     * and not referenced by any order.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOrphanedImages() {
        List<String> tempFiles = storageService.listFiles("orders/temp_");
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        for (String fileKey : tempFiles) {
            // Parse timestamp from filename: {timestamp}_{random}.{ext}
            long timestamp = parseTimestamp(fileKey);
            if (timestamp < cutoff.toEpochSecond(ZoneOffset.UTC)) {
                // Check if this URL is referenced by any order
                if (!isReferencedByOrder(fileKey)) {
                    storageService.deleteFile(fileKey);
                    log.info("Deleted orphaned image: {}", fileKey);
                }
            }
        }
    }

    private boolean isReferencedByOrder(String fileKey) {
        // Query order_items.images JSONB for this URL
        // Return true if found
    }
}
```

### Supabase Storage Cleanup (Alternative)

If using Supabase Storage, create a SQL function:

```sql
-- Run via Supabase Dashboard > SQL Editor
CREATE OR REPLACE FUNCTION cleanup_orphaned_temp_images()
RETURNS void AS $$
BEGIN
    -- Delete files from temp_ folders older than 24 hours
    -- This is a placeholder; actual implementation depends on Supabase Storage API
    DELETE FROM storage.objects
    WHERE bucket_id = 'order-photos'
      AND name LIKE 'orders/temp_%'
      AND created_at < NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
          SELECT 1 FROM order_items oi
          WHERE oi.images::text LIKE '%' || name || '%'
      );
END;
$$ LANGUAGE plpgsql;
```

---

## 6. New: Supabase Storage Bucket Setup

### Create Bucket

Via Supabase Dashboard → Storage → New Bucket:

| Setting | Value |
|---------|-------|
| Name | `order-photos` |
| Public | `true` (for read access) |
| File size limit | 25 MB |
| Allowed MIME types | `image/jpeg, image/png, image/webp` |

### Row Level Security (RLS) Policies

```sql
-- 1. Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'order-photos'
    AND (storage.foldername(name))[1] = 'orders'
);

-- 2. Allow public read access
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-photos');

-- 3. Allow users to delete their own temp uploads
CREATE POLICY "User delete own temp"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'order-photos'
    AND name LIKE 'orders/temp_%'
    AND (storage.foldername(name))[2] LIKE auth.uid() || '%'
);

-- 4. Service role can delete anything (for cleanup job)
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'order-photos');
```

### Environment Variables

Add to Spring Boot `application.properties`:

```properties
# Supabase (for image download and cleanup)
supabase.url=https://your-project.supabase.co
supabase.service-role-key=your_service_role_key
supabase.bucket=order-photos
```

---

## 7. API Response Format Reference

All cart endpoints must follow this response format:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (POST) |
| `400` | Bad request / validation error |
| `401` | Unauthorized (no/invalid JWT) |
| `403` | Forbidden (not own cart) |
| `404` | Not found |
| `500` | Server error |
| `503` | Backend unavailable (Spring Boot down) |

---

## 8. Testing Checklist

### Cart API
- [ ] `GET /api/cart` returns empty cart for new user
- [ ] `POST /api/cart` creates cart if none exists
- [ ] `POST /api/cart` adds item with Supabase URLs
- [ ] `PUT /api/cart/items/{id}` updates quantity
- [ ] `PUT /api/cart/items/{id}` updates images array
- [ ] `DELETE /api/cart/items/{id}` removes item
- [ ] `DELETE /api/cart` clears all items
- [ ] User can only access their own cart (403 for others)
- [ ] Returns 401 without valid JWT

### Order Creation
- [ ] Order accepts pre-populated `imageUrls` array
- [ ] `order_items.images` stores Supabase URLs correctly
- [ ] Order creation fails if `imageUrls` is empty

### Image Download
- [ ] Can download from Supabase public URL
- [ ] ZIP download works with mixed S3/Supabase URLs
- [ ] Handles missing images gracefully (404 → skip)

### Cleanup
- [ ] Cleanup job deletes `temp_*` files older than 24h
- [ ] Cleanup job does NOT delete images referenced by orders
- [ ] Cleanup job logs deleted files

---

## 9. Migration Notes

### Phase 1: Deploy Backend (Cart API + Entities)
1. Add `carts` and `cart_items` tables
2. Add JPA entities
3. Implement cart CRUD endpoints
4. Deploy to UAT
5. Verify with `curl` tests

### Phase 2: Deploy Frontend Changes
1. Frontend changes are already in place
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify
3. Create `order-photos` bucket in Supabase
4. Deploy to Netlify

### Phase 3: Image Service Update
1. Update `ImageDownloadService` to handle Supabase URLs
2. Update ZIP download controller
3. Deploy to UAT

### Phase 4: Cleanup Job
1. Implement orphaned image cleanup
2. Schedule as `@Scheduled` or Supabase pg_cron
3. Deploy to production

---

## 10. Rollback Plan

If the new flow causes issues:

1. **Frontend:** Revert `src/app/page.tsx` to previous version (git revert)
2. **Backend:** Cart endpoints can remain (harmless if unused)
3. **Supabase:** Keep bucket for existing images, don't delete

The `/api/upload` endpoint is still functional — it's used as a fallback if Supabase upload fails.

---

## Questions for Backend Team

1. **Do you already have `Cart` / `CartItem` JPA entities?** If yes, share the code so I can align the API contract.
2. **Are you using Supabase Storage or S3?** The `.env` has Supabase configured, but `BACKEND_HANDOFF.md` mentions S3. Need to confirm.
3. **Who owns the Supabase project?** We need to create the `order-photos` bucket and RLS policies.
4. **Cleanup job preference:** Spring Boot `@Scheduled` or Supabase `pg_cron`?
