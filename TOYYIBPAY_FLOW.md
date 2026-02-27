# ToyyibPay Payment Flow

## How ToyyibPay Accepts Payments

### Overview

ToyyibPay is a Malaysian payment gateway that allows you to accept payments via:
- Credit/Debit Card
- Online Banking (FPX — Maybank, CIMB, Public Bank, etc.)
- E-Wallet

### Payment Process

```
1. Your App                          2. ToyyibPay Server
    │                                     │
    │── POST /createBill ─────────────────▶│
    │   (order details + amount)          │
    │   - customerName                    │
    │   - customerEmail                   │
    │   - customerPhone                   │
    │   - amount                          │
    │                                     │
    │◀── BillCode + PaymentURL ───────────│
    │                                     │
    │── Redirect user ────────────────────▶│
    │   to https://toyyibpay.com/{BillCode}│
    │                                     │
    │   [User Payment Interface]          │
    │   - Select bank/card               │
    │   - Enter payment details           │
    │   - Confirm payment                 │
    │                                     │
    │◀─ Redirect back ─────────────────────│
    │   to /payment-status?status_id=1    │
    │                                     │
    │   [Background]                      │
    │◀── Webhook callback ────────────────│
    │   /api/toyyibpay/callback           │
    │   (updates database)                │
```

### Step-by-Step

1. **Create Bill**
   - Your server calls ToyyibPay API to create a bill
   - Pass: order number, amount, customer info
   - Get: BillCode (unique payment reference)

2. **Redirect to Payment**
   - User is redirected to ToyyibPay payment page
   - User selects payment method and completes payment

3. **Payment Result**
   - Success: `status_id = 1`
   - Pending: `status_id = 2`
   - Failed: `status_id = 0`

4. **Return URL**
   - User redirected back to your app (`/payment-status`)
   - Show appropriate success/failure message

5. **Callback (Webhook)**
   - ToyyibPay calls your server in the background
   - Updates order payment status in database
   - This is the **authoritative** confirmation — always update DB here

## API Calls

### Create Bill

```
POST https://toyyibpay.com/index.php/api/createBill

Required fields:
- userSecretKey         Your merchant secret key
- categoryCode          Your category code
- billName              Order name (max 30 chars)
- billDescription       Description (max 100 chars)
- billPriceSetting      1 = fixed price
- billPayorInfo         1 = use passed customer info
- billAmount            Amount in cents (e.g., 1000 = RM10.00)
- billReturnUrl         URL after payment (your /payment-status page)
- billCallbackUrl       Webhook URL (your /api/toyyibpay/callback)
- billExternalReferenceNo  Your order number (e.g., PP-ABC123)
- billTo                Customer name
- billEmail             Customer email
- billPhone             Customer phone
- billPaymentChannel    0 = all channels
- billChargeToCustomer  1 = pass fee to customer
```

### Callback Response

```
POST /api/toyyibpay/callback

Received fields:
- refno      ToyyibPay reference number
- status     1 (success), 2 (pending), 0 (failed)
- reason     Reason for status
- billcode   Bill code
- order_id   Your order number (billExternalReferenceNo)
- amount     Payment amount in cents
- hash       Security hash (validate this!)
```

## Order Status Updates

| Payment Status | Order Status | Meaning |
|----------------|--------------|---------|
| pending | pending | Order created, awaiting payment |
| paid | processing | Payment received, order being processed |
| failed | pending | Payment failed, customer can retry |

## Fees

- Transaction fee: ~2–3% per transaction (varies by account type)
- Settlement: Typically T+1 or T+3 business days
- Fees may be passed to customer via `billChargeToCustomer=1`

## Security

- **Hash validation** — Always verify the `hash` field in callbacks to ensure the request is from ToyyibPay
- **Never expose** your `TOYYIBPAY_SECRET_KEY` in frontend code
- **Validate amounts** on the server side — never trust the amount from the callback alone
- **Idempotent callbacks** — ToyyibPay may send the callback multiple times; handle duplicate processing safely

## Environment Notes

- **Production**: `https://toyyibpay.com/`
- **Sandbox**: `https://dev.toyyibpay.com/` (if available on your account)
- Callback URL **must be a public URL** — use ngrok for local development (see [ENVIRONMENT.md](./ENVIRONMENT.md))
