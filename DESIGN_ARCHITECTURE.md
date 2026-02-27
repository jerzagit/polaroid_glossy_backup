# Design Architecture

## Payment Flow Diagram

```mermaid
flowchart TD
    A[User uploads photos] --> B[Selects size & quantity]
    B --> C[Adds to cart]
    C --> D[Fills checkout form<br/>Name, Email, Phone, State]
    D --> E{Selects Payment Method}
    
    E -->|Bank Transfer| F[POST /api/orders]
    E -->|ToyyibPay| G[POST /api/orders]
    
    F --> H[Create Order<br/>Status: pending<br/>PaymentStatus: pending]
    H --> I[Show bank transfer details<br/>24hr deadline]
    
    G --> H
    H --> J[POST /api/toyyibpay/create-bill]
    J --> K[ToyyibPay API<br/>Create Bill]
    K --> L[Redirect to ToyyibPay<br/>payment page]
    
    L --> M{Payment Result}
    
    M -->|Success| N[ToyyibPay redirects to<br/>/payment-status?status_id=1]
    M -->|Pending| O[ToyyibPay redirects to<br/>/payment-status?status_id=2]
    M -->|Failed| P[ToyyibPay redirects to<br/>/payment-status?status_id=0]
    
    K --> Q[ToyyibPay calls<br/>/api/toyyibpay/callback<br/>webhook]
    Q --> R{Update Order}
    R -->|status=1| S[paymentStatus: paid<br/>status: processing]
    R -->|status=2| T[paymentStatus: pending]
    R -->|status=0| U[paymentStatus: failed]
    
    N --> V[/payment-status page<br/>Show success UI]
    O --> W[/payment-status page<br/>Show pending UI]
    P --> X[/payment-status page<br/>Show failed UI]
    
    style A fill:#e1f5fe
    style I fill:#fff3e0
    style S fill:#e8f5e9
    style V fill:#e8f5e9
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | Get order by order number |
| POST | `/api/toyyibpay/create-bill` | Create ToyyibPay bill |
| POST | `/api/toyyibpay/callback` | ToyyibPay webhook callback |
| POST | `/api/auth/[...nextauth]` | NextAuth authentication |
| GET/POST | `/api/user/profile` | User profile management |
| GET/POST | `/api/reviews` | Order reviews |
| GET | `/api/print-sizes` | Available print sizes |

## Order Status Flow

```
pending → processing → posted → on_delivery → delivered
```

## Payment Status Flow

```
pending → paid (via ToyyibPay callback)
pending → failed (payment declined)
```

## Database Schema

### Order
- `id`, `orderNumber`, `customerName`, `customerEmail`, `customerPhone`
- `customerState`, `status`, `paymentStatus`
- `subtotal`, `shipping`, `total`
- `paymentMethod`, `toyyibpayRef`, `paidAt`
- `createdAt`, `updatedAt`

### OrderItem
- `id`, `orderId`, `sizeId`, `quantity`, `unitPrice`
- `images` (JSON), `customTexts` (JSON)

### OrderStatusHistory
- `id`, `orderId`, `status`, `message`, `createdAt`
