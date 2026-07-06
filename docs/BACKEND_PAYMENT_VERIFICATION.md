# Backend API Requirements: Payment Verification

## Overview

The frontend now supports:
1. **Customer**: Upload payment proof (image + reference number) for bank transfer orders
2. **Admin**: Review and approve/reject payment proofs

The backend (Spring Boot) needs the following endpoints.

---

## 1. GET /api/admin/orders

**Purpose**: List all orders with payment proof info for admin dashboard.

**Headers**:
- `Authorization: Bearer <admin_jwt>`

**Response**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_123",
      "orderNumber": "PG-XXX-YYY",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+60123456789",
      "status": "pending",
      "total": 10.00,
      "paymentMethod": "bank_transfer",
      "paymentStatus": "pending",
      "paymentProofUrl": "https://storage.example.com/proof.jpg",
      "paymentReference": "1234567890",
      "items": [
        {
          "id": "item_1",
          "sizeId": "4r",
          "sizeName": "4R (4×6 inches)",
          "quantity": 2,
          "unitPrice": 1.00,
          "totalPrice": 2.00,
          "images": "[\"url1\", \"url2\"]"
        }
      ],
      "createdAt": "2026-07-06T10:00:00Z"
    }
  ]
}
```

**Filtering (optional)**:
- `?status=pending` - Only pending orders
- `?paymentMethod=bank_transfer` - Only bank transfer orders
- `?paymentStatus=pending` - Orders awaiting payment verification

---

## 2. POST /api/admin/orders/:orderNumber/verify-payment

**Purpose**: Approve or reject a customer's payment proof.

**Headers**:
- `Authorization: Bearer <admin_jwt>`

**Request Body**:
```json
{
  "action": "approve" | "reject",
  "note": "Optional reason for rejection"
}
```

**Response (Approve)**:
```json
{
  "success": true,
  "message": "Payment approved",
  "order": {
    "orderNumber": "PG-XXX-YYY",
    "status": "processing",
    "paymentStatus": "paid",
    "paidAt": "2026-07-06T12:00:00Z"
  }
}
```

**Response (Reject)**:
```json
{
  "success": true,
  "message": "Payment rejected",
  "order": {
    "orderNumber": "PG-XXX-YYY",
    "status": "pending",
    "paymentStatus": "pending",
    "paymentProofUrl": null,
    "paymentReference": null
  }
}
```

**Backend Logic**:
- On `approve`: 
  - Update `paymentStatus` to `paid`
  - Update `status` to `processing`
  - Set `paidAt` to current timestamp
  - Create `OrderStatusHistory` entry: "Payment approved by admin"
  
- On `reject`:
  - Clear `paymentProofUrl` and `paymentReference` (set to null)
  - Keep `paymentStatus` as `pending`
  - Create `OrderStatusHistory` entry: "Payment rejected: {note}"

---

## 3. Database Changes Required

Add these columns to the `orders` table:

```sql
ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500);
ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(100);
```

Or in JPA/Hibernate:
```java
@Column(name = "payment_proof_url")
private String paymentProofUrl;

@Column(name = "payment_reference")
private String paymentReference;
```

---

## 4. Existing Endpoint: POST /api/orders/:orderNumber/payment-proof

This endpoint already exists and is used by the frontend to submit payment proof.

**Request Body**:
```json
{
  "paymentProofUrl": "https://storage.example.com/proof.jpg",
  "paymentReference": "1234567890"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Payment proof submitted",
  "order": {
    "orderNumber": "PG-XXX-YYY",
    "paymentProofUrl": "https://storage.example.com/proof.jpg",
    "paymentReference": "1234567890",
    "status": "pending"
  }
}
```

---

## 5. Admin Authorization

The frontend uses `requireAdmin()` from `/src/lib/auth.ts` which checks:
- User is authenticated (valid session/JWT)
- User's email is in `ADMIN_EMAILS` environment variable (comma-separated)

The backend should implement similar authorization:
- Validate the JWT token
- Check if the user's email is in an admin list
- Return 403 if not admin

---

## Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/orders` | GET | List all orders for admin |
| `/api/admin/orders/:orderNumber/verify-payment` | POST | Approve/reject payment |
| `/api/orders/:orderNumber/payment-proof` | POST | Customer submits proof (already exists) |

**Database Fields to Add**:
- `payment_proof_url` (VARCHAR) - URL of uploaded payment screenshot
- `payment_reference` (VARCHAR) - Customer's reference/receipt number
