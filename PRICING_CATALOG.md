# Polaroid Glossy MY Pricing Catalog

Source: prices supplied from the live TikTok Shop setup.

All prices are in Malaysian Ringgit (RM). The 10-piece tier is marked as the most popular tier where specified.

## 5.5 × 8 cm — Malaysia IC size

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM5.00 | **RM4.50** | RM0.45 | 10% |
| 20 pcs | RM10.00 | **RM9.00** | RM0.45 | 10% |
| 50 pcs | RM25.00 | **RM22.50** | RM0.45 | 10% |
| 100 pcs | RM40.00 | **RM36.00** | RM0.36 | 10% |

## Polaroid Mini — 5.0 × 8.9 cm

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM4.00 | **RM3.60** | RM0.36 | 10% |
| 20 pcs | RM8.00 | **RM7.20** | RM0.36 | 10% |
| 50 pcs | RM15.00 | **RM13.50** | RM0.27 | 10% |
| 100 pcs | RM30.00 | **RM27.00** | RM0.27 | 10% |

## 2R — 6.3 × 8.9 cm

### No border — full-colour card

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM7.00 | **RM6.30** | RM0.63 | 10% |
| 20 pcs | RM14.00 | **RM12.60** | RM0.63 | 10% |
| 50 pcs | RM35.00 | **RM31.50** | RM0.63 | 10% |
| 100 pcs | RM60.00 | **RM54.00** | RM0.54 | 10% |

### Border — white-border Polaroid style

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM6.50 | **RM5.85** | RM0.585 | 10% |
| 20 pcs | RM13.00 | **RM11.00** | RM0.55 | 15.38% |
| 50 pcs | RM32.00 | **RM28.00** | RM0.56 | 12.50% |
| 100 pcs | RM60.00 | **RM54.00** | RM0.54 | 10% |

## 3R — 8.9 × 12.7 cm

### No border — full-colour card

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM8.00 | **RM7.20** | RM0.72 | 10% |
| 20 pcs | RM16.00 | **RM14.40** | RM0.72 | 10% |
| 50 pcs | RM40.00 | **RM36.00** | RM0.72 | 10% |
| 100 pcs | RM80.00 | **RM72.00** | RM0.72 | 10% |

### Border — white-border Polaroid style

| Quantity | Regular price | Discounted price | Effective price per piece | Discount |
|---:|---:|---:|---:|---:|
| 10 pcs — Most popular | RM7.00 | **RM6.30** | RM0.63 | 10% |
| 20 pcs | RM14.00 | **RM12.60** | RM0.63 | 10% |
| 50 pcs | RM35.00 | **RM31.50** | RM0.63 | 10% |
| 100 pcs | RM70.00 | **RM63.00** | RM0.63 | 10% |

## Analysis and implementation notes

- The pricing follows a 10% discount pattern for every tier except 2R Border at 20 pcs and 50 pcs. Those values are recorded exactly as supplied from TikTok Shop: RM13 → RM11 and RM32 → RM28.
- The earlier 2R No-border entry `RM14 → RM14.60` was treated as a typo because the discounted price was higher than the regular price. It is recorded as RM14 → RM12.60, following the 10% discount pattern.
- The final “RM60 → RM54” entries for 2R were interpreted as the 100-piece tier.
- Each border/no-border choice is represented as a separate selectable product in the current frontend catalog.
- Checkout quantity is currently per uploaded photo. For example, 10 pcs with 3 uploaded photos means 30 total prints and applies the 10-piece pack price to each photo.
- The frontend currently calculates these promotional prices locally. The Spring Boot/Fly backend still needs the product records and tier-pricing rules before production orders can be authoritative.
