# Honger Platform — Architecture (Phase 1)

## Current state

Multi-tenant ordering app: Next.js storefront, admin panel, PostgreSQL, slot booking, category-level modifiers.

## Target stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 (App Router), TypeScript |
| DB | PostgreSQL 16 |
| ORM | Prisma |
| Auth (admin) | Auth.js / NextAuth credentials |
| Deploy | Docker on one VPS |
| Proxy | Caddy (existing on server) |

## Principles

- **One codebase, one deployment** — all tenants share the same app container.
- **Tenant-ready from day one** — every business row carries `tenantId`.
- **Configuration over forks** — branding, hours, slots, payments live in DB.
- **Server-side enforcement** — slot capacity, tenant scope, validation on the server.

## Tenant resolution

```
Request Host → middleware → set x-tenant-host
                          → resolveTenant() looks up TenantDomain.hostname
                          → all data access filters by tenantId
```

Supported hostname patterns (progressive):

1. **MVP**: `localhost` + seed domain `demo.localhost`
2. **Later**: `client1.platform.example.com`
3. **Later**: custom domain `bestellen.client.be` → `TenantDomain`

## Route structure

### Storefront (public)

| Route | Purpose |
|-------|---------|
| `/` | Menu home (categories + products, hash nav) |
| `/category/[slug]` | Redirect → `/#slug` |
| `/product/[slug]` | Redirect → `/` (detail in overlay) |
| `/cart` | Cart review |
| `/checkout` | Customer details, fulfillment, date + slot picker |
| `/order/[id]` | Confirmation + status |

### Admin (`/admin/*`)

| Route | Purpose |
|-------|---------|
| `/admin/login` | Staff login |
| `/admin` | Live order dashboard + status updates |
| `/admin/products` | Products by category (overlay edit) |
| `/admin/categories` | Categories, modifiers per category |
| `/admin/hours` | Opening hours + closing exceptions |
| `/admin/slots` | Slot rules + capacity overview |
| `/admin/settings` | Business + brand + payments |

Redirect stubs: `/admin/products/[id]`, `/admin/products/new` → query params on `/admin/products`.

### API (`/api/*`)

Cart, checkout, slot availability, payments (Mollie), admin orders stream, health.

## Modifiers

- **CategoryModifierGroup** / **CategoryModifierOption** — shared by all products in a category.
- Admin: single vs multiple selections (`maxSelections` 1 or 99).
- Storefront: `lib/modifiers/selection.ts` normalizes legacy DB values and validates cart/checkout.

## Slot capacity model

### Entities

- **TimeSlotRule** — template: weekday(s), time window, `intervalMinutes`, `maxOrders`, `fulfillment`.
- **TimeSlotInstance** — materialized slot for a calendar day.
- **bookedCount** on instance — atomic increment on checkout.

### Availability query

For date `D` and fulfillment `F`:

1. `isOpenOnDate` (opening hours + closing exceptions).
2. `ensureSlotInstancesForDate` from active rules.
3. `listAvailableSlots` where `remaining > 0`.
4. `filterSlotsByLeadTime` using `businessSettings.orderLeadMinutes` for today.

### Booking (critical path)

Row update with `bookedCount < maxOrders` inside a transaction; on failure return next slot suggestion.

## Security (MVP)

- All Prisma queries scoped by `tenantId` from `requireTenant()` / admin session.
- Admin routes require session with matching `tenantUser.tenantId`.
- Zod validation on checkout and admin forms.

## Docker / Caddy

- `docker compose up` runs `web` + `postgres`.
- Caddy on host terminates TLS and reverse-proxies to `web:3000`.
- See `Caddyfile.example` and `README.md` for env vars.

## Phased delivery

| Phase | Scope |
|-------|--------|
| 1 | Schema + architecture |
| 2 | Storefront menu/cart/checkout |
| 3 | Admin CRUD, slots, availability API |
| 4 | Payments (Mollie + simulate) |
| 5 | Deploy docs, Vitest (capacity, hours, cart, modifiers, dates) |
