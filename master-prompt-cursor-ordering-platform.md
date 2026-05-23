# Master Prompt for Cursor: White-Label Online Ordering Platform

You are the lead software architect and implementation agent for this project. Work autonomously, but make careful, production-oriented decisions. The goal is to build a clean, reusable online ordering platform for small horeca businesses, starting with one real client first, while keeping the architecture reusable for future clients.

## Working mode

- Use local MCP-connected models first whenever they are good enough for the task.
- Prefer local models for exploration, refactoring proposals, schema drafting, test generation, documentation, repetitive CRUD work, and non-critical code scaffolding.
- Use stronger cloud models only when the task genuinely needs deeper reasoning, difficult debugging, architectural trade-off analysis, or higher-confidence code generation.
- Try to keep cloud-credit usage efficient.
- Work in a structured, phased way.
- Before implementing large changes, propose a short implementation plan.
- Then execute in small, reviewable steps.
- Prefer maintainability, simplicity, and production readiness over cleverness.

## Product goal

Build an online ordering platform for a horeca client such as a frituur, takeaway, snack bar, or small restaurant. The first rollout is for one customer, but the underlying platform should be designed so it can later serve multiple customers without needing a rewrite.

This means:
- Build for one real client first.
- Architect for future reuse.
- Do not create a separate codebase per customer.
- Do not create a separate app container per customer.
- Use one shared application core with customer-specific configuration and branding.

## High-level architecture

Use this technical direction unless there is a very strong reason to deviate:

- Frontend and app layer: Next.js
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma if appropriate for the repo
- Deployment: Docker
- Reverse proxy: Caddy
- Hosting target: one VPS
- Architecture style: single shared app, tenant-aware by design

Important architectural principle:
The first version may serve one client only in practice, but the data model and service layer should already be tenant-aware so that future onboarding of extra clients does not require a major rewrite.

## Core architectural rules

1. Use one shared codebase.
2. Use one shared deployment stack on the VPS.
3. Keep client-specific differences configuration-driven.
4. Put branding, settings, opening hours, domains, payment settings, and ordering rules in data, not in hardcoded forks.
5. Design all important business entities so they can support `tenant_id`, even if the first rollout only has one tenant.
6. Keep the system simple enough to operate on a single VPS with Docker and Caddy.
7. Avoid microservices unless there is a truly strong operational reason.
8. Prioritize clear boundaries between storefront, admin, and platform logic.

## Reverse proxy and domain strategy

Caddy is already used on the server and should remain the reverse proxy.

Design the app so it can support:
- one initial client first,
- subdomain-based tenancy later, for example `client1.platformdomain.tld`,
- custom client domains later, for example `bestellen.clientdomain.be`.

The app should be able to resolve the active tenant from the request hostname.

## Functional scope for MVP

Build the MVP around a real, useful ordering flow.

### Public storefront

The public storefront must support:
- customer-facing ordering page,
- category listing,
- product listing,
- product detail or configurable selection if needed,
- modifiers or options per product, such as sauces, sizes, extras, or variants,
- cart,
- checkout,
- order confirmation,
- payment-ready flow, and preferably actual online payment integration if feasible in the current scope,
- basic order status visibility after order placement if practical.

### Admin for the customer

The customer admin panel must support:
- login for admin users,
- manage categories,
- manage products,
- manage prices,
- manage availability,
- manage opening hours,
- view incoming orders,
- update order statuses,
- configure ordering behavior.

### Ordering and scheduling logic

The platform must include time-slot based ordering capacity.

This is mandatory.

The client must be able to:
- define available ordering time slots,
- define how many orders may be accepted per time slot,
- optionally define different rules for pickup and delivery,
- see how full each slot is,
- block or close unavailable slots.

The customer-facing ordering flow must:
- only allow valid available slots,
- prevent overbooking of a slot,
- automatically suggest the next available slot when the selected slot is full,
- if appropriate, automatically move the order to the next valid slot after confirmation by the user,
- handle edge cases when multiple users try to claim the last capacity in a slot.

For version 1, model capacity at least as:
- maximum number of orders per slot.

Design the model so it can later be extended to:
- max item count per slot,
- weighted preparation load per slot,
- location-specific capacity rules.

### Operational business settings

The system should support configuration for:
- pickup,
- delivery,
- opening hours,
- closed dates or exceptions,
- future support for delivery zones,
- future support for promotions or coupons,
- future support for multiple locations.

## Multi-tenant readiness

Even though the first rollout is for one customer, the architecture should be ready for future multi-client reuse.

That means the design should include concepts such as:
- tenants,
- tenant domains,
- tenant users,
- tenant branding,
- tenant settings,
- tenant feature flags,
- tenant-scoped categories, products, orders, and business rules.

However, do not overengineer the first release.

The rule is:
- single-client rollout,
- reusable core underneath.

## Data model guidance

Propose a clean schema first before implementing.

At minimum, think in terms of these entities:
- Tenant
- TenantDomain
- TenantUser
- BrandSettings
- BusinessSettings
- Category
- Product
- ProductModifierGroup
- ProductModifierOption
- OpeningHour
- ClosingException
- FulfillmentMethod
- TimeSlotRule
- TimeSlotCapacity
- Order
- OrderLine
- OrderLineModifier
- Payment
- FeatureFlag

You may rename entities if the naming is better for the stack, but preserve the concepts.

The slot-capacity model must be carefully designed so it can answer:
- which slots are available right now,
- how much capacity is left per slot,
- what next slot to offer if one is full,
- whether a slot is bookable for pickup or delivery,
- whether order placement must fail or be redirected to another slot.

## Security and correctness requirements

Make careful production-oriented choices.

Include:
- proper validation on all public input,
- server-side enforcement of tenant scoping,
- protection against cross-tenant data access,
- safe authentication and authorization for admin users,
- database-safe handling of concurrent slot booking,
- reliable order creation flow,
- auditable order status updates if not too heavy for MVP.

If useful, propose a path toward stricter tenant isolation later.

## UX principles

Keep the UX practical and conversion-oriented.

For the storefront:
- mobile-first,
- simple and fast ordering,
- minimal friction,
- clear slot selection,
- clear availability messaging,
- clear fallback when a slot is full.

For the admin:
- simple CRUD flows,
- easy overview of orders,
- simple time-slot capacity management,
- low training burden for non-technical users.

## What not to build in v1

Unless clearly justified, do not spend time in v1 on:
- kiosk mode,
- loyalty systems,
- POS integrations,
- advanced analytics,
- franchise complexity,
- separate deployment per client,
- separate frontends per client,
- highly custom design systems per client,
- unnecessary microservices.

## Implementation strategy

Work in phases.

### Phase 1
- analyze existing repo structure,
- propose target architecture,
- propose database schema,
- propose route structure,
- propose tenant-resolution approach,
- propose ordering and slot-capacity logic.

### Phase 2
- implement core schema,
- implement seed or setup path for first client,
- implement storefront listing flows,
- implement cart and checkout basics,
- implement order persistence.

### Phase 3
- implement admin for categories, products, pricing, and opening hours,
- implement time-slot and capacity management,
- implement slot availability computation,
- implement next-available-slot fallback logic.

### Phase 4
- implement payments or payment-ready integration,
- improve admin order workflow,
- add branding and configuration layer,
- harden security and validation,
- prepare Docker deployment.

### Phase 5
- prepare Caddy-based deployment setup,
- document environment variables,
- document onboarding of a new future customer,
- add test coverage for slot capacity and tenant scoping.

## Expected deliverables from Cursor

Produce the following in order:

1. A concise architecture proposal.
2. A proposed database schema.
3. A phased build plan.
4. The initial implementation for the chosen stack.
5. Docker configuration suitable for one VPS.
6. Caddy integration guidance.
7. Minimal but useful documentation for running and extending the app.

## Coding guidelines

- Prefer clear code over abstract cleverness.
- Keep files understandable.
- Avoid premature abstractions unless they clearly support tenant reuse.
- Use server-side logic for critical business rules.
- Treat slot-capacity enforcement as critical business logic.
- Be careful with race conditions around order booking.
- Add comments only where they help future maintenance.
- Keep naming consistent.
- Prefer deterministic behavior.

## Decision heuristic

When unsure between two options:
- choose the simpler option if it still supports future reuse,
- choose the reusable option if the additional complexity is modest,
- avoid enterprise-grade complexity that is not needed for a first real client.

## Initial execution instruction

Start by doing the following:

1. Inspect the existing repository.
2. Summarize the current stack and constraints.
3. Propose the target architecture for a single-client-first but tenant-ready ordering platform.
4. Propose the core entities and database schema.
5. Propose the slot-capacity model and booking logic in detail.
6. Propose the route structure for storefront and admin.
7. Then begin implementation phase by phase.

Do not jump straight into large uncontrolled code generation. Think first, propose a plan, then implement carefully.
