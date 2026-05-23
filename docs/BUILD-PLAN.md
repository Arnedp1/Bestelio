# Phased build plan

## Phase 1 — Design ✅

- [x] Architecture (`docs/ARCHITECTURE.md`)
- [x] Prisma schema (`prisma/schema.prisma`)
- [x] Slot booking approach (atomic `bookedCount` update)
- [x] Route map

## Phase 2 — Core + storefront ✅

- [x] Next.js scaffold + Docker
- [x] Tenant middleware
- [x] Storefront: categories, products, cart, checkout, orders
- [x] Seed script (demo frituur)

## Phase 3 — Admin + slots ✅

- [x] NextAuth credentials
- [x] Admin CRUD: categories, products, modifiers, hours, slots, settings
- [x] Slot availability + booking + fallback

## Phase 4 — Polish ✅

- [x] Payment-ready (Mollie + simulate mode)
- [x] Brand settings on storefront (CSS variables)
- [x] Zod validation (checkout + admin)
- [x] Admin order workflow

## Phase 5 — Deploy + tests ✅

- [x] Dockerfile + docker-compose
- [x] Caddyfile.example
- [x] README + .env.example
- [x] Vitest: capacity, hours, cart, modifiers, dates

## Run locally

```bash
docker compose up db -d
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```
