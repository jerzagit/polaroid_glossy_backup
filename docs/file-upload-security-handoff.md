# File Upload Security Audit — Backend Handoff

## Current State

**Frontend (this PR):** Added upload-route MIME type, extension, size, and magic-byte validation before proxying to the backend. Only JPG, PNG, and WEBP are accepted by the upload route. Max 25MB per file.

**HEIC/HEIF note:** HEIC/HEIF may still be accepted in the browser file picker as a user convenience, but `src/lib/imageCompression.ts` must convert it to JPEG before upload. Direct HEIC/HEIF upload is intentionally rejected until the backend has a safe HEIC decoder/re-encoder.

**Order verification proxy (`POST /api/upload`):** The Next.js route now verifies the provided `orderId` against the backend before forwarding the file to storage. It checks that:

- `orderId` has a valid order-number shape
- the order exists via `GET /api/orders?orderNumber={orderId}`
- the request `customerEmail` matches the order's `customerEmail`
- the order is not closed (`cancelled`, `refunded`, `posted`, `on_delivery`, `delivered`)
- the payment is not failed/cancelled/refunded
- the current image count has not already reached the expected image count when order items are returned
- the same IP/order pair has not exceeded a lightweight upload-attempt rate limit

**Backend (`FileService.validateImage()`):** Validates JPG, PNG, and WEBP with magic-byte checks, rejects fake WEBP, enforces a 25MB limit, locks order items before capacity checks, and decodes/re-encodes uploads to safe JPEG/PNG output while stripping metadata.

**Backend guest upload tokens:** Guest `POST /api/orders` returns `order.uploadToken` for new guest orders only. The backend stores only `orders.upload_token_hash` plus `orders.upload_token_expires_at`, requires the token for new token-backed guest uploads, compares it in constant time, and invalidates it once all required order images are uploaded. Legacy guest orders without a stored token still fall back to the existing email check.

## Secure Upload Contract

Uploads should be treated as a two-step, order-bound operation. The browser should never be allowed to upload an arbitrary file just because it knows an endpoint.

### Supported user flows

1. **Upload now, then pay**
   - Create the order with `uploadMode: "now"` and an expected photo count.
   - Upload the selected images while the order is still `pending` / `paymentStatus: pending`.
   - Create the payment bill.
   - Payment callback moves the order to `processing` only if required images are present.

2. **Pay now, upload later**
   - Create the order with `uploadMode: "later"` and an expected photo count.
   - Payment callback moves the order to `paid_awaiting_upload` or keeps `status: pending` with an upload-required flag.
   - Customer uploads images later through the same verified upload endpoint.
   - When required images are present, backend moves the order to `processing`.

### Request body: create order

`POST /api/orders`

```json
{
  "uploadMode": "now",
  "expectedImageCount": 2,
  "userId": "optional-user-id",
  "customerName": "Ali Ahmad",
  "customerEmail": "ali@example.com",
  "customerPhone": "+60123456789",
  "customerHouseUnitNo": "-",
  "customerAddressLine1": "123 Jalan Example",
  "customerAddressLine2": "-",
  "customerPostcode": "43000",
  "customerCity": "Kajang",
  "customerState": "Selangor",
  "customerCountry": "Malaysia",
  "customerNotes": "Please handle carefully",
  "items": [
    {
      "sizeId": "4R",
      "quantity": 2,
      "images": [],
      "expectedImageCount": 2,
      "customTexts": ["Text for photo 1", "Text for photo 2"],
      "unitPrice": 1
    }
  ]
}
```

For upload-later checkout, use:

```json
{
  "uploadMode": "later",
  "expectedImageCount": 2,
  "items": [
    {
      "sizeId": "4R",
      "quantity": 2,
      "images": [],
      "expectedImageCount": 2,
      "customTexts": [],
      "unitPrice": 1
    }
  ]
}
```

### Request body: upload image

`POST /api/upload`

```text
Content-Type: multipart/form-data

file: <image file>
orderId: <orderNumber>
customerEmail: <order customer email>
uploadToken: <optional backend-issued guest upload token>
orderItemId: <optional order item id>
```

Next.js verifies the order first, then proxies to:

```text
POST {BACKEND_API_BASE}/api/files/upload?orderId=<orderNumber>&customerEmail=<email>&uploadToken=<token>&orderItemId=<itemId>

file: <image file>
```

`uploadToken` is forwarded only when the backend returns one from order creation. `orderItemId` is forwarded when the order creation response includes item IDs. The frontend does not generate or fake upload tokens.

### Backend must enforce the same rules

The Next.js checks reduce accidental abuse, but the backend owns the database and storage credentials, so the backend must be authoritative:

- Look up the order by `orderNumber` inside the upload transaction.
- Verify the uploader owns the order. Prefer an authenticated user/session or signed upload token over email alone.
- Reject uploads for closed orders or failed payments.
- Enforce `uploadedImageCount < expectedImageCount`.
- Enforce per-order and per-IP/account rate limits.
- Store files under a server-generated path like `orders/{orderNumber}/{uuid}.jpg`.
- Append the uploaded URL/key to the matching order item atomically.
- Never trust client-supplied storage paths, filenames, image URLs, counts, prices, or order totals.

### Guest upload token behavior

For new guest orders, backend-issued upload tokens are now the stronger ownership proof:

1. `POST /api/orders` returns `order.uploadToken` only for guest orders.
2. `POST /api/upload` forwards `orderId` + `customerEmail` + `uploadToken` to the backend when present.
3. Backend stores only a SHA-256 hash, expiry, max upload count, and order ID.
4. Backend requires the token for new token-backed guest orders, checks expiry, uses constant-time comparison, and invalidates the token once all required images are uploaded.
5. Legacy orders without a stored token continue to fall back to the email check.

This lets guest checkout upload securely without requiring a full account login while preserving old records.

## Security Gaps on Backend

### 1. Uploads Are Not Authoritatively Order-Bound (Critical)

The backend upload endpoint must reject any file that is not tied to a real, open order. If storage upload happens before checking the order, attackers can spam storage by sending arbitrary multipart requests.

**Fix:** Verify the order and allowed upload count before writing to Supabase/S3. The order lookup and image append should be a single backend-controlled workflow.

### 2. Content-Type is Spoofable (Critical)

Older upload validation relied on `MultipartFile.getContentType()`, which is set from the HTTP `Content-Type` header. An attacker can send a `.exe` or `.html` file with `Content-Type: image/jpeg` if the backend trusts only the header.

**Current backend status:** JPG, PNG, and WEBP magic-byte validation is implemented. Keep tests around fake WEBP rejection and do not regress to Content-Type-only validation.

Magic bytes for allowed formats:
- JPEG: `FF D8 FF` (starts with bytes `0xFF 0xD8 0xFF`)
- PNG: `89 50 4E 47` (starts with `‰PNG`)
- WEBP: `52 49 46 46` (starts with `RIFF`) + `57 45 42 50` (at offset 8, `WEBP`)

HEIC/HEIF should remain rejected on the upload endpoint until a safe decoder is wired into the backend. Client-side conversion to JPEG is acceptable; backend direct HEIC acceptance is not.

### 3. No Image Dimension Validation

The backend now decodes and re-encodes accepted images, which helps reject malformed image content and strips metadata. Keep sane dimension/pixel-count limits in that decode path to defend against decompression bombs.

**Fix:** After magic bytes validation, keep using `ImageIO.read()` or similar to verify the image can actually be decoded with sane dimensions (e.g., max 10000x10000 pixels).

### 4. No File Extension Whitelist

Stored file paths at `orders/{orderId}/original/{uuid}.jpg` always use `.jpg`. This is safe since the extension is server-generated, but there is no validation that the original filename doesn't contain path traversal characters (`../`, null bytes, etc.).

**Fix:** Strip/reject any path traversal patterns from the original filename, or (better) don't use user-supplied filenames at all.

### 5. No Virus/Malware Scanning

Supabase Storage does not provide built-in virus scanning. Uploaded files are stored as-is. A malicious file that passes the above checks could still contain:
- Stolen credential data embedded in image pixels (steganography)
- Malware in image metadata (EXIF payloads)
- ZIP bombs disguised as valid images

**Fix:** Integrate a virus scanning service (e.g., ClamAV, AWS GuardDuty) or use Supabase Edge Functions with a scanning hook. At minimum, re-encode images server-side using a trusted library to strip all metadata and ensure valid encoding.

### 6. SVG / Scriptable Upload Vector (Medium)

The backend currently only allows `image/jpeg` and `image/png`, so SVG XSS (CVE-style stored XSS via SVG) is not a direct risk. However, if the Content-Type spoofing gap (#1) is exploited, an attacker could upload an `.html` or `.svg` file with a spoofed Content-Type and then access it via signed URL, potentially executing scripts in the admin dashboard context.

**Fix:** Magic bytes validation (#1) closes this vector. Also ensure storage bucket serves files with `Content-Disposition: attachment` for unknown types.

## Supabase Storage Security Notes

- **Bucket:** `polaroid-glossy` is set to private (no public access).
- **Access:** Signed URLs with 3600s expiry are returned by the backend.
- **RLS:** Verify that RLS policies on `storage.objects` table restrict access to:
  - `INSERT` only for authenticated users (backend service role)
  - `SELECT` only via signed URLs or authenticated requests
  - No public/anonymous policies
- **CORS:** Ensure CORS on the Supabase project only allows your frontend domain(s).
- **Malware scanning:** Supabase does **not** have built-in malware scanning. This must be implemented at the application layer.

## Summary

| Priority | Issue | Impact |
|----------|-------|--------|
| **High** | Keep upload token enforcement | Prevent guest upload spoofing for new orders |
| **High** | Keep order-bound backend checks locked | Prevent storage spam and unauthorized order mutation |
| **High** | Keep magic-byte tests | Prevent regression to Content-Type-only validation |
| **High** | Keep image dimension validation | Decompression bombs |
| **Medium** | Direct HEIC/HEIF unsupported | Must be converted before upload |
| **Medium** | No malware scanning | Persistent malicious payloads |
| **Low** | No filename sanitization | Path traversal (mitigated by server-generated paths) |

## Recommended Backend Changes

1. Keep short-lived upload tokens for guest checkout uploads
2. Keep legacy no-token guest fallback only for old records without stored token hashes
3. Keep order existence, ownership, status, payment status, and remaining upload count checks before storage writes
4. Keep JPG, PNG, and WEBP magic-byte tests, including fake WEBP rejection
5. Keep `ImageIO.read()` try-catch and sane dimension limits in the decode path
6. Consider adding ClamAV or similar scanning via Supabase Edge Function
7. Continue stripping EXIF/metadata by re-encoding the image server-side
