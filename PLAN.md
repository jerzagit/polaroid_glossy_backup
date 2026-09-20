# Audit and fix Orders UI (customer + detail + admin)

> **Executor:** Command Code Desktop  ·  **Model:** `deepseek/deepseek-v4.1-flash` (DeepSeek V4.1 Flash, Go plan)

## Goal
Audit the three orders UIs for UX bugs, filtering gaps, and missing actions, then apply low-risk UI-only fixes so customers and admins can find, understand, and act on orders correctly.

## Context & Decisions
Background: there is no single `/orders` page. Orders UI lives in three places: customer list (`/profile/orders`), customer detail (`/profile/orders/[id]` where `[id]` is actually the orderNumber), and admin verification (`/admin/orders`, currently payment-verification only). Request is exploratory ("check U.I for orders page and see where suit to fix"), so this plan is an audit + conservative UI fixes only — no backend contract changes, no DB migrations, no payment-logic changes.

Trade-offs agreed: prefer UI-only, additive fixes; do not change Spring Boot proxy contracts; keep existing styling (shadcn/ui + Tailwind) and auth (backend_jwt in localStorage + AuthContext).

## Current State
What exists and works:
- Customer order list with status badges, draft highlight, bank-transfer proof badges, tab filter — `src/app/profile/orders/page.tsx`.
- Customer order detail with timeline, image-upload progress + re-upload, payment-proof upload, draft Pay Now — `src/app/profile/orders/[id]/page.tsx`.
- Admin payment-verification list with expandable cards, approve/reject, tab counts — `src/app/admin/orders/page.tsx`.
- Proxy routes: `/api/orders/my`, `/api/orders/[orderNumber]`, `/api/orders/[orderNumber]/payment-proof`, `/api/admin/orders`, `/api/admin/orders/[orderNumber]/verify-payment`.

Explicitly NOT changed by this plan: Prisma schema, backend Spring Boot endpoints, ToyyibPay flow, checkout form, upload/compression lib, i18n dictionary structure, auth model.

## Files & Entry Points
- `src/app/profile/orders/page.tsx:34-88` — `statusConfig` covers 9 statuses but `tabs` only exposes 4 (all/draft/pending/processing/delivered); `posted`, `on_delivery`, `cancelled`, `refunded`, `expired` are orphaned (only visible under All). Unused `Receipt` import. Hardcoded English strings, `translations.ts` keys unused.
- `src/app/profile/orders/page.tsx:158-201` — whole-card `<Link>` wrapping, payment-proof badge logic.
- `src/app/profile/orders/[id]/page.tsx:64-65` — route folder is `[id]` but param is used as `orderNumber` (`params.id as string` at line 180); `UPLOAD_OPEN_STATUSES` only `pending,processing` so `draft` cannot top-up images.
- `src/app/profile/orders/[id]/page.tsx:199-211` — 10s polling keyed on `[user, order]`; silent-fetch error path is silent.
- `src/app/profile/orders/[id]/page.tsx:539-594` — hardcoded bank details (Maybank `5186 2614 2087`, `Acachiaa Empire`); proof upload `accept` is `jpeg,png,webp` while item-image upload at line 493 allows `heic,heif` — inconsistent.
- `src/app/profile/orders/[id]/page.tsx:466-479` — raw `<a><img>` thumbnails, no Next `<Image>`, no empty/cancel action on detail.
- `src/app/admin/orders/page.tsx:61-74` — `OrderCard` collects `rejectNote` (lines 219-224) but `onReject(orderNumber)` at line 231 never sends it; `proofStatus` var unused.
- `src/app/admin/orders/page.tsx:301-351` — `handleVerify`/`handleReject` bodies are `{action:'approve'|'reject'}` only; reject reason dropped.
- `src/app/admin/orders/page.tsx:353-374` — filters/tabs are payment-only (`pending_proof` requires `paymentMethod==='bank_transfer'`, so ToyyibPay pending orders vanish from that tab); no order-`status` filter, no search, no status-update / tracking-number UI despite `backend_architecture.md` admin contract.
- `src/app/admin/orders/page.tsx:275,455-457` — toast never auto-dismisses, no error toast on list-fetch failure.
- `src/app/admin/orders/page.tsx:270-299` — no auth guard (no `useAuth` redirect); just fires with possibly-null `backend_jwt`.
- `src/lib/translations.ts:88,243,454` — `orders_title/orders_desc/orders_empty` keys exist (EN/MY) but orders pages hardcode English.
- `src/app/api/admin/orders/route.ts:18`, `src/app/api/admin/orders/[orderNumber]/verify-payment/route.ts:25`, `src/app/api/orders/my/route.ts:9`, `src/app/api/orders/[orderNumber]/route.ts:13` — proxy targets; do not change contract.

## Constraints & Conventions
Rules from AGENTS.md that MUST be respected:
- Runtime/package manager is **Bun** (`bun run dev` on :3000, `bun run lint`, `bun run build`). Do not switch to npm for new scripts.
- All DB-touching API routes **proxy to Spring Boot** (`${BACKEND_API_BASE}/api/...` or `API_BASE`) with **hardcoded JSON fallback** for dev. Do not add direct Prisma calls from these UI pages.
- **Next.js 16 async `params`**: new server code must `await params`. These three pages are `'use client'` with `useParams()` so no change needed, but do not introduce server components that read `params` synchronously; do not rename `[id]` folder in this plan (would break existing `/profile/orders/${orderNumber}` links) — only clarify variable naming internally.
- Order status vocabulary: `pending → processing → posted → on_delivery → delivered`, plus `cancelled → refunded` (plus existing `draft/expired/paid` variants in code). New labels must reuse `statusConfig`.
- Checkout/bank details are hardcoded in UI today — if touched, centralise to a single const, do not invent a new env contract without fallback.
- Branch workflow: `git checkout -b feat/<description>` from `local-dev`, PR to `main` (Netlify auto-deploys), then merge back to `local-dev`. If backend needs `reason` field on reject, notify backend team instead of changing proxy shape unilaterally.
- Keep shadcn/ui + Tailwind classes, existing `bg-background` dark-mode-safe tokens, and `backend_jwt` header pattern (`Authorization: Bearer ...`).

## Implementation Steps
Customer list — `src/app/profile/orders/page.tsx`:
- Remove unused `Receipt` import; keep all icons actually rendered.
- Extend `tabs` to include `posted`, `on_delivery`, `cancelled` (keep `all` first) so every `statusConfig` state is reachable by filter; keep value comparison case-insensitive as today.
- Add per-tab empty state copy (e.g. "No posted orders" vs generic "No orders yet") and a result count line (`Showing X of Y`).
- Add client-side search input filtering by `orderNumber` substring (no API change) + `Retry` button on fetch failure (track `fetchError` state; current `catch` only logs).
- Use `translations.ts` `orders_title/orders_desc/orders_empty` via existing language context instead of hardcoded "Order History / No orders yet" (fallback to English if context absent).

Customer detail — `src/app/profile/orders/[id]/page.tsx`:
- Rename local `orderNumber = params.id` variable usage clearly (comment that `[id]` holds orderNumber); do NOT rename the folder.
- Allow image top-up in `draft` by adding `'draft'` to `UPLOAD_OPEN_STATUSES`, keeping block for `posted/on_delivery/delivered/cancelled/refunded/expired`.
- Centralise hardcoded bank block (lines 547-553) into a top-of-file `BANK_DETAILS` const with a comment; keep same values.
- Align proof-upload `accept` with item upload (add `image/heic,image/heif`) OR explicitly keep screenshot-only with a helper caption — pick one and make both inputs consistent with a comment.
- Add fetch-error state with Retry (today failures are silent except console), and add `alt`/loading-lazy to thumbnails (keep raw `<img>`, do not migrate to `next/image` in this pass).

Admin — `src/app/admin/orders/page.tsx`:
- Fix reject-reason drop: change `onReject` signature to `(orderNumber: string, reason: string) => void`, pass `rejectNote.trim()`, include it in POST body as `{ action:'reject', reason }` AND `note` fallback key, disable Confirm when empty (already does) — if backend ignores unknown key it is harmless; note this for backend team.
- Auto-dismiss toast after ~4s (`useEffect` timeout clearing `toast`) and add error toast when `fetchOrders` fails (today silent).
- Add `status` Badge to `OrderCard` header (reuse customer `statusConfig` labels/colors) alongside existing proof badge so fulfilment state is visible.
- Add client-side search by orderNumber/customerName/customerEmail + status `<select>` filter (All/Pending/Processing/Posted/On Delivery/Delivered/Cancelled) composed with existing payment tabs; show `Showing X of Y`.
- Add auth guard: if no `backend_jwt`, render "Not authorized — sign in" card instead of silently empty list (do not rewire to NextAuth in this pass); remove unused imports (`Upload, Mail, MapPin`, unused `proofStatus` var).

## Verification
- `bun run lint` — expect zero new warnings (notably no unused imports).
- `bun run build` — expect success (standalone output).
- `bun run dev`, then manually: `/profile/orders` tab through each status + search; `/profile/orders/<knownOrderNumber>` image progress + proof upload; `/admin/orders` approve/reject with reason + search + toast dismissal.
- `curl -s http://localhost:3000/api/orders/my -H "Authorization: Bearer <jwt>" | jq .` and `curl -s http://localhost:3000/api/admin/orders -H "Authorization: Bearer <jwt>" | jq .` — expect same shapes as before (proxy contract unchanged; UI-only change).

## Open Questions
- Should admin page grow into full fulfilment (status advance + tracking-number edit per `backend_architecture.md` PATCH `/admin/orders/{id}/status|tracking`)? Assumption: NO in this pass — only surface read-only status badge; fulfilment actions are follow-up.
- Should `[id]` folder be renamed to `[orderNumber]` for clarity? Assumption: NO — keep route stable; only clarify internals to avoid breaking existing links (`/profile/orders/${orderNumber}`, login redirects).
- Should bank details move to env/config? Assumption: NO — keep hardcoded values centralised in one const with fallback.
- Should reject `reason` key be `reason` or `note`? Assumption: send BOTH (`{ action, reason, note: reason }`) for backend compatibility; backend team confirms canonical key.

---
Plan written by opencode. Execute in Command Code Desktop: open this repo, then start a thread referencing `@PLAN.md`.
