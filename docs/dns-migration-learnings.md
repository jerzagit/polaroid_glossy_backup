# DNS & Hosting Migration — Learnings (Vercel → Netlify)

> Context: moving `polaroidglossy.my` from Vercel to Netlify. The domain is
> registered/managed at Cloudflare. Date: Aug 2026.

## The core lesson

**The breakdown was NOT a code problem.** The Next.js app was fine. The domain's
DNS records at Cloudflare still pointed at the OLD host's IP (Vercel), and that
Vercel deployment was paused — so visitors saw "Development is paused" even
though the new Netlify site was fully ready.

Rule of thumb when a site "breaks" right after a host migration:

1. Check the code is deployed to the NEW host.
2. Check the DNS actually points at the NEW host (not the old one).

## Verified facts for this project

| Item | Value |
|---|---|
| Netlify site name | `polaroid-glossy` (`polaroid-glossy.netlify.app`) |
| Netlify site ID | `5224a319-9031-4821-98d7-1f7da04c36e1` (`.netlify/state.json`) |
| Netlify custom domain | `polaroidglossy.my` — already set, deploy `ready`, SSL on |
| Old Vercel IPs (A records to REMOVE) | `216.150.1.1`, `216.150.1.129`, `216.150.16.129`, `216.150.16.193` |
| New CNAME records (to ADD) | `polaroidglossy.my` → `polaroid-glossy.netlify.app`, `www` → same |
| Verify switch | `curl -sI https://polaroidglossy.my/ | grep -i server` → `server: Netlify` |

## A Record vs CNAME (what they actually are)

- **A Record (Address):** domain → a fixed IP number (e.g. `polaroidglossy.my → 216.150.1.1`).
  Used at the root/apex domain. If the host changes IPs, you must update manually — easy to go stale.
- **CNAME (Canonical Name):** domain → another hostname (e.g. `polaroidglossy.my → polaroid-glossy.netlify.app`).
  The host manages the IPs behind the name, so IP changes never break the site.

### Why "CNAME at the root domain" works on Cloudflare

Raw DNS standards (RFC 1034) forbid CNAME at the apex because the apex must also
carry MX/TXT/NS records. Cloudflare solves this with **CNAME flattening**: it
resolves the CNAME to an IP at the edge and serves it like an A record. So on
Cloudflare you can CNAME both the root and `www` to Netlify/Vercel hostnames.

### It is NOT a "Vercel uses A, Netlify uses CNAME" rule

Both hosts support both record types:
- Vercel: A record → `76.76.21.21` OR CNAME → `cname.vercel-dns.com`.
- Netlify: A record → `75.2.60.5` OR CNAME → `<site>.netlify.app`.

The A records in our DNS were just what the old Vercel config happened to use.
For Netlify we chose CNAME so Netlify manages the IPs (more future-proof).

## Fix steps (what was done / to do)

1. Cloudflare DNS → delete old A records (Vercel IPs listed above).
2. Cloudflare DNS → add CNAME `polaroidglossy.my` → `polaroid-glossy.netlify.app`.
3. Cloudflare DNS → add CNAME `www` → `polaroid-glossy.netlify.app`.
4. Netlify: nothing needed — domain already configured.
5. Wait for DNS propagation (minutes), then verify `server: Netlify`.

## Useful commands

```bash
curl -sI https://polaroidglossy.my/ --max-time 15 | grep -i server   # who serves it
dig +short polaroidglossy.my A                                       # current A records
dig +short www.polaroidglossy.my A                                   # www A records
```

## Diagram

`docs/dns-migration-explainer.png` — stakeholder explainer: what happened,
A Record vs CNAME, and the fix.