# ToyyibPay Payment Flow

## Overview

ToyyibPay is a Malaysian payment gateway supporting:
- Online Banking (FPX — Maybank, CIMB, Public Bank, etc.)
- Credit/Debit Card
- E-Wallet

**Sandbox URL:** `https://dev.toyyibpay.com`
**Production URL:** `https://toyyibpay.com`

Set `TOYYIBPAY_BASE_URL` in `.env` to switch between them.

---

## End-to-End Flow

```
Browser                     Next.js Server              ToyyibPay
   │                              │                          │
   │── Place Order ──────────────▶│                          │
   │                              │── POST /createBill ─────▶│
   │                              │   (amount, customer,     │
   │                              │    return URL,           │
   │                              │    callback URL)         │
   │                              │                          │
   │                              │◀── { BillCode } ─────────│
   │                              │                          │
   │◀── redirect to ToyyibPay ────│                          │
   │                              │                          │
   │────────────────────────────────────────────────────────▶│
   │              [User selects bank / card, pays]           │
   │◀────────────────────────────────────────────────────────│
   │   redirect to /payment-status?status_id=1&billcode=xxx  │
   │                                                         │
   │                              │◀── POST /api/toyyibpay/callback
   │                              │   (background webhook)   │
   │                              │── update Order in DB     │
   │                              │   paymentStatus = paid   │
   │                              │   status = processing    │
```

---

## Step-by-Step

### 1. Create Bill (`POST /api/toyyibpay/create-bill`)
- Called from `handleCheckout` in `page.tsx`
- Sends order number, amount (in cents), customer info to ToyyibPay
- Returns `BillCode` and payment URL
- Order `toyyibpayRef` is updated in DB with the BillCode

### 2. Redirect
- User is redirected to `https://dev.toyyibpay.com/{BillCode}` (sandbox)
- User selects payment method and completes payment

### 3. Return URL
- ToyyibPay redirects back to `TOYYIBPAY_RETURN_URL` (your `/payment-status` page)
- Query params include: `status_id`, `billcode`, `order_id`

| `status_id` | Meaning |
|---|---|
| `1` | Payment successful |
| `2` | Pending |
| `0` | Failed |

### 4. Callback (Webhook)
- ToyyibPay POSTs to `TOYYIBPAY_CALLBACK_URL` in the background
- This is the **authoritative** payment confirmation — always update DB here
- Server validates the MD5 hash before updating the order
- Order status: `pending` → `processing`, paymentStatus: `paid`

> ToyyibPay may send the callback **multiple times** — the handler is idempotent (safe to receive twice).

---

## API Reference

### Create Bill Request

```
POST {TOYYIBPAY_BASE_URL}/index.php/api/createBill

userSecretKey          TOYYIBPAY_SECRET_KEY
categoryCode           TOYYIBPAY_CATEGORY_CODE
billName               Order number (max 30 chars)  e.g. "PP-ABC123-XY"
billDescription        "Polaroid print order"
billPriceSetting       1  (fixed price)
billPayorInfo          1  (use customer info passed below)
billAmount             amount in cents  e.g. 1500 = RM15.00
billReturnUrl          TOYYIBPAY_RETURN_URL
billCallbackUrl        TOYYIBPAY_CALLBACK_URL
billExternalReferenceNo  order.orderNumber
billTo                 customerName
billEmail              customerEmail
billPhone              customerPhone
billPaymentChannel     0  (all channels)
billChargeToCustomer   1  (fee passed to customer)
```

### Callback Payload (received at `/api/toyyibpay/callback`)

```
refno       ToyyibPay internal reference
status      1 = paid | 2 = pending | 0 = failed
reason      reason string
billcode    BillCode (matches toyyibpayRef in DB)
order_id    Your orderNumber (billExternalReferenceNo)
amount      amount in cents
hash        MD5 security hash — always validate
```

---

## Order Status Mapping

| Payment Event | `paymentStatus` | `status` |
|---|---|---|
| Order created | `pending` | `pending` |
| Payment successful (callback) | `paid` | `processing` |
| Payment failed | `failed` | `pending` (customer can retry) |

---

## Local Development

ToyyibPay **cannot reach `localhost`** — a public URL is required for the callback.

**Required:** ngrok running and `.env` configured with ngrok URLs.

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
# Copy https URL → update NEXTAUTH_URL, TOYYIBPAY_RETURN_URL, TOYYIBPAY_CALLBACK_URL in .env
# Restart Terminal 1
```

Watch Terminal 1 logs — you should see an incoming POST to `/api/toyyibpay/callback` after completing payment.

---

## Fees

- Transaction fee: ~2–3% per transaction (varies by account type)
- Settlement: T+1 or T+3 business days
- Passed to customer via `billChargeToCustomer=1`

---

## Security

- **Hash validation** — always verify the MD5 `hash` field in callbacks
- **Never expose** `TOYYIBPAY_SECRET_KEY` in frontend code
- **Validate amounts** server-side — never trust the amount from callback alone
- **Idempotent** — handle duplicate callbacks safely (check if already paid before updating)
