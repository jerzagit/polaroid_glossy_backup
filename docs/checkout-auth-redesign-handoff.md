# Checkout & Auth Redesign — Frontend → Backend Handoff

## Overview

Comprehensive redesign of the checkout flow, authentication, and user account system. The goal: reduce friction, preserve user progress, and eliminate the "re-upload after login" problem.

---

## 1. Order Drafts + 24-Hour Image Retention

### Problem
Guests currently cannot upload images before payment (backend returns 403). If a guest wants to order, they must: sign up → pay → then upload. This breaks the "select photos first" UX.

### Solution
Introduce a `draft` order status. Guests can create draft orders, upload images immediately, and pay within 24 hours.

### Frontend Behaviour
- Checkout gate shows two options: **Sign in** or **Continue as Guest**
- Guest flow: Place Order → `status: draft` → upload images → "Pay within 24h" confirmation
- Confirmation shows countdown timer (cosmetic — real TTL enforced by backend)
- Draft orders appear in order history with "Pay Now" CTA
- ToyyibPay orders: no 24h timer note (considered "secured" once initiated)

### Backend Requirements

| # | Change | Details |
|---|--------|---------|
| 1 | New order status `draft` | Add to allowed statuses: `draft → pending → processing → ...` |
| 2 | Relax upload gate for drafts | `POST /api/files/upload`: allow guest uploads if `order.status === draft`, regardless of `paymentStatus` |
| 3 | Image TTL | Accept `expiresAt` field on upload. Return `expiresAt` in upload response (24h from now) |
| 4 | Stale image cleanup | Cron/scheduled job: delete images where `expiresAt < now` AND `order.status === draft`. After deletion, mark order as `expired`. |
| 5 | `expiresAt` in order response | `GET /api/orders?orderNumber=XXX` should include `expiresAt` field |
| 6 | Draft → Pending transition | When guest pays, update status from `draft` to `pending` |

### Expected `POST /api/upload` Response (Guest Draft)
```json
{
  "success": true,
  "url": "https://supabase.co/.../photo.jpg",
  "expiresAt": "2026-07-06T01:00:00Z"
}
```

---

## 2. Email/Password Registration

### Problem
Currently only Google OAuth is available. Users without Google accounts are forced to create one, causing drop-off.

### Solution
Add email/password authentication via Supabase Auth (already integrated for image storage).

### Frontend Pages
- `/auth/login` — Email + password form, "Forgot password?", Google OAuth divider
- `/auth/register` — Name + email + password + confirm password
- `/auth/forgot-password` — Email input, sends reset link via Supabase

### Backend Requirements

| # | Change | Details |
|---|--------|---------|
| 1 | `POST /api/auth/register` | Create user in Supabase Auth + sync to local `User` table. Return JWT |
| 2 | `POST /api/auth/login` | Authenticate via Supabase, return JWT + user profile |
| 3 | `POST /api/auth/forgot-password` | Trigger Supabase password reset email |
| 4 | `POST /api/auth/reset-password` | Handle password reset token + new password |

Supabase handles the heavy lifting; backend mainly needs user sync endpoints.

---

## 3. Dedicated Profile & Order History Page

### Problem
Order history is displayed in a modal popup — poor UX for browsing, searching, or managing multiple orders.

### Solution
Migrate from modal to dedicated pages with full navigation.

### Frontend Pages

| Route | Content |
|-------|---------|
| `/profile` | Account overview: name, email, avatar, member since, quick stats |
| `/profile/orders` | Full order list with tabs: All \| Draft \| Paid \| Processing \| Completed |
| `/profile/orders/[id]` | Single order detail: item list, image gallery, timeline, tracking, cancel action |
| `/profile/addresses` | Saved addresses CRUD (see section 5) |

### UX Improvements Over Current Modal
- Pagination (not one giant load)
- Search by order number
- Filter by status with coloured badges
- Draft orders shown at top with prominent "Pay Now" button
- Vertical stepper timeline for order status progression
- Responsive: card layout on mobile, table on desktop

### Backend Requirements

| # | Change | Details |
|---|--------|---------|
| 1 | Paginated orders | `GET /api/orders?userId={id}&page=1&limit=20&status=draft` |
| 2 | Order detail endpoint | `GET /api/orders/:orderNumber` — full detail with items, images, status history |
| 3 | Include user profile | `GET /api/user/profile` — return user with address count, order count |

---

## 4. Smart Login Prompts

### Problem
Users land on broken flows (e.g., deep-linked to a protected page while logged out) with no guidance. Also, after OAuth redirect, all state is lost.

### Solution
Contextual prompts guide users to authenticate without losing progress.

### Prompt Scenarios

| Trigger | Frontend Behaviour |
|---------|-------------------|
| Guest clicks "Checkout" | Show two-button gate: "Sign In" / "Continue as Guest" |
| Session expires mid-checkout | Banner: "Session expired. Sign in again to continue." Progress saved in localStorage |
| Guest lands on `/profile/*` | Redirect to `/auth/login?redirect=/profile/orders` |
| Draft order → Pay | Prompt sign-in: "Sign in to complete payment for order #PO-XXX" |
| Post-checkout (guest) | Toast + banner: "Order placed! Create an account to track it." |

### Implementation
- `AuthGate` component wrapping protected sections
- `useRequireAuth(redirectTo?)` hook
- `intendedPath` stored in `sessionStorage` before any auth redirect

No backend changes needed — purely frontend logic.

---

## 5. Saved Addresses (Up to 10 per User)

### Problem
Users fill in the same address fields every single order. High friction, high drop-off.

### Solution
Full address book with dropdown selector during checkout.

### Data Model
```json
{
  "id": "uuid",
  "userId": "uuid (FK to User)",
  "label": "Home | Office | Parents | Other",
  "name": "Ahmad bin Ali",
  "phone": "+60123456789",
  "houseUnitNo": "12A",
  "addressLine1": "Jalan SS2/72",
  "addressLine2": "Taman Bahagia",
  "city": "Petaling Jaya",
  "state": "selangor",
  "postalCode": "47300",
  "country": "Malaysia",
  "isDefault": false,
  "createdAt": "2026-07-05T..."
}
```

### Frontend — Checkout Integration
- Address selector card at top of checkout form: dropdown of saved addresses
- Selecting an address auto-fills all form fields (fields remain editable)
- "Save as new address" checkbox at bottom of form
- If user has a default address, it's pre-selected on page load

### Frontend — Profile Page (`/profile/addresses`)
- Address cards with coloured label badges (Home / Office / Other)
- Set default toggle
- Edit in-place or via slide-out panel
- Delete with confirmation
- Max 10 addresses — show counter "9/10 used"
- Drag to reorder (nice-to-have)

### Backend Requirements

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/addresses` | List user's addresses (max 10, default first) |
| `POST` | `/api/addresses` | Create address. Validate max 10 |
| `PUT` | `/api/addresses/:id` | Update address |
| `DELETE` | `/api/addresses/:id` | Delete address |
| `PATCH` | `/api/addresses/:id/default` | Set as default (unset others) |

### `GET /api/addresses` Response
```json
{
  "success": true,
  "addresses": [
    {
      "id": "uuid-1",
      "label": "Home",
      "name": "Ahmad bin Ali",
      "phone": "+60123456789",
      "houseUnitNo": "12A",
      "addressLine1": "Jalan SS2/72",
      "addressLine2": "Taman Bahagia",
      "city": "Petaling Jaya",
      "state": "selangor",
      "postalCode": "47300",
      "country": "Malaysia",
      "isDefault": true
    }
  ]
}
```

---

## Data Model Changes (Summary)

### Order (new fields)
```
expiresAt: DateTime?         // 24h from creation for draft orders
draftExpiredAt: DateTime?    // when the 24h window lapsed
```

### Order Status (new values)
```
draft   → pending → processing → posted → on_delivery → delivered
draft   → expired              // 24h passed without payment
pending → cancelled → refunded
```

### New Table: `Address`
```
id          UUID (PK)
userId      UUID (FK → User)
label       String (max 20)    // "Home", "Office", etc.
name        String (max 100)
phone       String (max 15)
houseUnitNo String (max 50)
addressLine1 String (max 200)
addressLine2 String (max 200)
city        String (max 100)
state       String (max 50)
postalCode  String (max 10)
country     String (max 100)   // default "Malaysia"
isDefault   Boolean
createdAt   DateTime
updatedAt   DateTime
```

---

## End-to-End UX Flow (Revised)

```
Landing → Upload Photos → Select Size → Add to Cart → Cart Review
                                                          │
                                              ┌───────────┴───────────┐
                                              │                       │
                                        [Guest clicks              [Signed-in user]
                                         Checkout]                   │
                                              │                       ▼
                                  ┌───────────┴────┐          Checkout Form
                                  │                │          ┌──────────────────┐
                          Sign in with     Continue as        │ Address dropdown │
                          Google/Email       Guest            │ (pre-filled if   │
                                  │                │          │  default set)    │
                                  │                │          └──────────────────┘
                                  │                │                 │
                                  └───┬────────────┘                 │
                                      │                              │
                                      ▼                              ▼
                              Checkout Form                    Place Order
                              ┌──────────────┐               Upload Images
                              │ Address empty│                  Redirect to
                              │ (no saved)   │              ToyyibPay / Show
                              └──────────────┘              Bank Transfer info
                                      │
                                      ▼
                              Place Draft Order
                              Upload Images
                              ↳ "Pay within 24h"
                              ↳ Expiry timer shown
                              ↳ Guest can sign up later
                                      │
                                      ▼
                              /profile/orders
                              Draft tab with
                              "Pay Now" CTA
```

---

## Implementation Priority (Frontend)

| Priority | Feature | Backend Dependency |
|----------|---------|-------------------|
| P0 | Saved addresses + checkout dropdown | **Yes** — new `Address` endpoints |
| P0 | Dedicated profile/orders pages | Partial (can use existing order endpoints + pagination) |
| P1 | Guest draft flow with 24h timer | **Yes** — new `draft` status, relaxed upload gate, TTL |
| P1 | Smart login prompts | None (purely frontend) |
| P2 | Email/password auth | **Yes** — auth register/login sync endpoints |

---

## Questions for Backend Team

1. **Order endpoint location**: Should orders proxy to Spring Boot (`/api/orders` → Spring Boot) or should we create a new Next.js API route that handles drafts directly?
2. **Image TTL enforcement**: Will the cron job live in the Spring Boot backend? Expected schedule?
3. **Address endpoints**: Should these be in Spring Boot or can we use Supabase directly for CRUD?
4. **Auth sync**: When a user registers via Supabase Auth, does the backend expect a webhook to sync the user, or should the frontend call `POST /api/auth/sync` after registration?
5. **Pagination format**: What pagination format does the backend prefer? (page/limit, offset/limit, cursor-based?)
