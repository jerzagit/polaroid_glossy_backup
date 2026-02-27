# ToyyibPay Payment Flow

## How ToyyibPay Accepts Payments

### Overview

ToyyibPay is a Malaysian payment gateway that allows you to accept payments via:
- Credit/Debit Card
- Online Banking (Maybank, CIMB, Public Bank, etc.)
- E-Wallet

### Payment Process

```
1. Your App                          2. ToyyibPay Server
    │                                     │
    │── POST /createBill ─────────────────▶│
    │   (order details + amount)          │
    │   - customerName                    │
    │   - customerEmail                    │
    │   - customerPhone                    │
    │   - amount                           │
    │                                     │
    │◀── BillCode + PaymentURL ───────────│
    │                                     │
    │── Redirect user ────────────────────▶│
    │   to https://toyyibpay.com/{BillCode}│
    │                                     │
    │   [User Payment Interface]           │
    │   - Select bank/card                │
    │   - Enter payment details            │
    │   - Confirm payment                  │
    │                                     │
    │◀─ Redirect back ─────────────────────│
    │   to /payment-status?status_id=1     │
    │                                     │
    │   [Background]                        │
    │◀── Webhook callback ────────────────│
    │   /api/toyyibpay/callback            │
    │   (updates database)                  │
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
   - Success: status_id = 1
   - Pending: status_id = 2
   - Failed: status_id = 0

4. **Return URL**
   - User redirected back to your app
   - Show appropriate success/failure message

5. **Callback (Webhook)**
   - ToyyibPay calls your server in background
   - Updates order payment status in database

## API Calls

### Create Bill
```
POST https://toyyibpay.com/index.php/api/createBill

Required fields:
- userSecretKey: Your merchant secret key
- categoryCode: Your category code
- billName: Order name (max 30 chars)
- billDescription: Description (max 100 chars)
- billPriceSetting: 1 (fixed price)
- billPayorInfo: 1 (use passed customer info)
- billAmount: Amount in cents (e.g., 1000 = RM10)
- billReturnUrl: URL after payment
- billCallbackUrl: Webhook URL
- billExternalReferenceNo: Your order number
- billTo: Customer name
- billEmail: Customer email
- billPhone: Customer phone
```

### Callback Response
```
POST /api/toyyibpay/callback

Received fields:
- refno: ToyyibPay reference
- status: 1 (success), 2 (pending), 0 (failed)
- reason: Reason for status
- billcode: Bill code
- order_id: Your order number
- amount: Payment amount
- hash: Security hash
```

## Order Status Updates

| Payment Status | Order Status | Meaning |
|----------------|--------------|---------|
| pending | pending | Order created, awaiting payment |
| paid | processing | Payment received, processing order |
| failed | pending | Payment failed |

## Fees

- Transaction fee: ~2-3% per transaction
- Settlement: Depends on merchant account type
- Some fees may be passed to customer (billChargeToCustomer)

## Security

- Hash validation ensures callback is from ToyyibPay
- Never expose your secret key on frontend
- Validate all amounts on server side
