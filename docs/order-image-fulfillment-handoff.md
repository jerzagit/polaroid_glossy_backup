# Order Image Fulfillment — Backend Handoff

## Goal

Customers must be able to open their order detail page, see the exact items they ordered, see images already uploaded to Cloudflare R2, and upload any missing images while the order is still open for image fulfillment.

Frontend page:

```text
GET https://polaroidglossy.my/profile/orders/{orderNumber}
```

Example:

```text
https://polaroidglossy.my/profile/orders/PG71946458A6DA
```

## Supported Statuses

Customer image upload is allowed only when the order status is:

```sql
status IN ('pending', 'processing')
```

Treat status case-insensitively if older records contain uppercase values.

Reject uploads for:

```text
draft
posted
on_delivery
delivered
cancelled
refunded
expired
```

Also reject uploads when `payment_status` is:

```text
failed
cancelled
refunded
```

## Customer Flow

1. Customer creates an order with bank transfer or ToyyibPay.
2. Backend stores each `order_item` with its expected image count.
3. Customer opens `/profile/orders/{orderNumber}` while logged in.
4. Backend returns full order detail, including item rows and uploaded image URLs.
5. Frontend calculates uploaded vs expected image count per item.
6. If images are missing and status is `pending` or `processing`, frontend shows an upload button for that item.
7. Customer uploads missing images.
8. Backend validates ownership, status, remaining capacity, image type, and file size.
9. Backend stores image in Cloudflare R2 and appends the public/signed URL or object key to that exact `order_item`.
10. Frontend refreshes and shows updated uploaded/missing counts.

## Order Detail API

### Endpoint

```http
GET /api/orders/{orderNumber}
Authorization: Bearer <backend_jwt>
```

### Ownership Rules

The authenticated user must be allowed to access the order if either condition matches:

- `orders.user_id` matches the authenticated user ID
- `orders.customer_email` matches the authenticated user email

Do not return another customer's order.

### Required Response Shape

Return either this wrapped shape:

```json
{
  "success": true,
  "order": {
    "id": "order-db-id",
    "orderNumber": "PG71946458A6DA",
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "bank_transfer",
    "customerEmail": "customer@example.com",
    "total": 18.00,
    "createdAt": "2026-07-06T10:30:00Z",
    "trackingNumber": null,
    "items": [
      {
        "id": "order-item-id",
        "sizeId": "4r",
        "sizeName": "4R",
        "quantity": 2,
        "unitPrice": 1.00,
        "totalPrice": 2.00,
        "expectedImageCount": 4,
        "images": [
          "https://r2-public-or-signed-url/photo-1.jpg",
          "https://r2-public-or-signed-url/photo-2.jpg"
        ],
        "customTexts": ["Text 1", "Text 2"]
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "message": "Order placed successfully",
        "createdAt": "2026-07-06T10:30:00Z"
      }
    ]
  }
}
```

or a raw order object. The current Next.js proxy supports both, but the wrapped shape is preferred.

### Important Field Notes

`items[].id` is required. The frontend sends this value back as `orderItemId` during upload.

`items[].images` may be a JSON array or JSON string array. Prefer a real JSON array in Spring Boot responses.

`items[].customTexts` may be a JSON array or JSON string array. Prefer a real JSON array in Spring Boot responses.

`items[].expectedImageCount` should be included. If missing, the frontend falls back to:

```text
max(quantity, images.length)
```

If `customTexts` are present, fallback becomes:

```text
max(customTexts.length * quantity, images.length)
```

Backend should not rely on frontend fallback. Store and return the authoritative expected count.

## Expected Image Count

Add or support an `expected_image_count` concept per `order_item`.

Recommended schema:

```sql
ALTER TABLE order_items
ADD COLUMN expected_image_count INT;
```

Recommended value at order creation:

```text
expected_image_count = number_of_selected_photos_for_item * item.quantity
```

Examples:

| Selected Photos | Quantity | expected_image_count |
|---:|---:|---:|
| 1 | 1 | 1 |
| 2 | 1 | 2 |
| 2 | 3 | 6 |
| 5 | 2 | 10 |

The backend must enforce:

```text
uploaded_images_for_item < expected_image_count
```

Do not allow more images to be appended once an item is full.

## Upload API

### Frontend Proxy Endpoint

Browser calls:

```http
POST /api/upload
Authorization: Bearer <backend_jwt>
Content-Type: multipart/form-data
```

Form fields:

```text
file: <jpeg/png/webp file>
orderId: <orderNumber>
customerEmail: <order.customerEmail>
orderItemId: <order_items.id>
uploadToken: <optional guest token, only for guest orders>
```

Next.js validates basic file shape and proxies to Spring Boot:

```http
POST {BACKEND_API_BASE}/api/files/upload?orderId={orderNumber}&customerEmail={email}&orderItemId={orderItemId}&uploadToken={token}
Authorization: Bearer <backend_jwt>
Content-Type: multipart/form-data
```

### Required Backend Behavior

Inside a single transactional flow:

1. Authenticate request from bearer token or valid upload token.
2. Find order by `order_number`.
3. Verify the authenticated user owns the order.
4. Verify `order.customer_email` matches `customerEmail` for legacy compatibility.
5. Verify `order.status IN ('pending', 'processing')`.
6. Verify `order.payment_status NOT IN ('failed', 'cancelled', 'refunded')`.
7. Find `order_items.id = orderItemId` and verify it belongs to this order.
8. Lock the `order_items` row or otherwise prevent concurrent over-upload.
9. Parse current `images` array.
10. Reject if `images.length >= expected_image_count`.
11. Validate the uploaded file by magic bytes and decoded image content.
12. Store the file in Cloudflare R2 under a server-generated path.
13. Append the R2 URL/key to that exact `order_items.images` array atomically.
14. Return the uploaded URL and latest counts.

### Upload Success Response

Preferred response:

```json
{
  "success": true,
  "url": "https://r2-public-or-signed-url/orders/PG71946458A6DA/order-item-id/uuid.jpg",
  "orderItemId": "order-item-id",
  "uploadedImageCount": 3,
  "expectedImageCount": 4,
  "remainingImageCount": 1
}
```

### Upload Full Response

When no more images are needed:

```http
409 Conflict
```

```json
{
  "success": false,
  "error": "This order item already has the expected number of uploads",
  "uploadedImageCount": 4,
  "expectedImageCount": 4,
  "remainingImageCount": 0
}
```

### Closed Order Response

```http
409 Conflict
```

```json
{
  "success": false,
  "error": "Order is not open for uploads"
}
```

## R2 Storage Path

Use server-generated paths only. Do not trust client filenames or client-provided URLs.

Recommended path:

```text
orders/{orderNumber}/{orderItemId}/{uuid}.jpg
```

or, if preserving extension after safe validation:

```text
orders/{orderNumber}/{orderItemId}/{uuid}.{jpg|png|webp}
```

The frontend only needs a URL that can render in an `<img>` tag. This may be:

- public R2 URL
- Cloudflare Images URL
- signed URL with enough lifetime for customer/admin viewing

If signed URLs expire quickly, backend must regenerate them on every `GET /api/orders/{orderNumber}` response.

## Frontend Real-Time Behavior

The frontend currently:

- calculates `uploaded / expected` per item
- shows `X images still missing`
- hides upload button when item is complete
- blocks selecting more files than the remaining count
- refreshes the order detail every 10 seconds while status is `pending` or `processing` and images are still missing

Backend should still be authoritative. The frontend checks are convenience only.

## Bank Transfer Status Flow

For bank transfer:

```text
Order created:
status = pending
payment_status = pending

Customer pays manually and sends proof via WhatsApp.

Owner/admin confirms payment:
status = processing
payment_status = paid
paid_at = now()
```

Customer must not be allowed to set their own order to `processing`.

Image uploads are still allowed in both `pending` and `processing` because some customers may upload after creating the order or after payment confirmation.

## Validation Notes

Postcode validation expected by frontend/backend:

```text
customerPostcode: exactly 5 numeric digits
```

Example valid postcode:

```text
77000
```

Reject `7700` and `770000`.

Print size IDs should be lowercase:

```text
2r
3r
4r
a4
```

Frontend now sends lowercase `sizeId`.

## Backend Test Cases

Add tests for:

1. Logged-in customer can fetch own `pending` order detail with item images.
2. Logged-in customer cannot fetch another customer's order.
3. Upload to `pending` order succeeds when item is missing images.
4. Upload to `processing` order succeeds when item is missing images.
5. Upload to `posted`, `on_delivery`, `delivered`, `cancelled`, `refunded`, or `expired` fails.
6. Upload fails when `payment_status = failed`.
7. Upload fails when item already has `expected_image_count` images.
8. Concurrent uploads cannot exceed `expected_image_count`.
9. Upload fails when `orderItemId` does not belong to `orderId`.
10. `GET /api/orders/{orderNumber}` returns fresh R2 URLs for all uploaded images.
11. `customerPostcode` must be exactly 5 numeric digits.
12. `sizeId` is normalized/lowercase and must exist in `print_sizes`.
