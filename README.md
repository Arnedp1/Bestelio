# Honger — White-label online bestelplatform

Tenant-aware online ordering voor horeca. Eén codebase, één VPS-deployment, configuratie per klant.

## Features

- **Storefront**: menu, modifiers, winkelwagen, checkout, tijdslots, orderbevestiging
- **Admin**: categorieën, producten, modifiers, openingstijden, slotregels, branding, bestellingen
- **Multi-tenant**: hostname → tenant (klaar voor subdomeinen en custom domains)
- **Slot-capaciteit**: atomaire boeking, fallback naar volgend slot
- **Betalingen**: handmatig, Mollie, of gesimuleerd (`PAYMENT_SIMULATE=true`)

## Stack

Next.js 16 · TypeScript · PostgreSQL · Prisma · NextAuth · Docker · Caddy

## Quick start

**Alles in één keer (Windows):**

```powershell
npm install
npm run start:local
```

**Of handmatig:**

```bash
docker compose up db -d
cp .env.example .env   # Windows: Copy-Item .env.example .env
npm install
npm run db:setup       # schema sync + seed (The Food Stop-menu uit CSV)
npm run dev
```

`db:setup` wacht tot PostgreSQL bereikbaar is, pusht het schema en seed daarna automatisch de demo-catalogus.

| URL | Doel |
|-----|------|
| http://localhost:3000 | Storefront (gebruik `localhost`, niet `127.0.0.1`) |
| http://localhost:3000/admin/login | Admin |
| http://localhost:3000/admin/categories | CRUD |

**Admin login** (seed): `admin@demo.local` / `SEED_ADMIN_PASSWORD` uit `.env`

## Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run dev` | Development server |
| `npm run build` | Productie-build |
| `npm test` | Unit tests (Vitest) |
| `npm run db:setup` | Schema push + seed (aanbevolen) |
| `npm run setup` | Docker DB starten + `db:setup` |
| `npm run start:local` | DB + setup + seed + dev server |
| `npm run db:push` | Alleen schema naar database |
| `npm run db:seed` | Alleen demo-tenant + catalogus |
| `npm run db:studio` | Prisma Studio |
| `npm run print:agent` | Lokale bonprinter-agent (Windows, ESC/POS) |

## Keukenbon / bonprinter

Nieuwe bestellingen (webshop én **Bestelling ingave**) worden automatisch in een **print-wachtrij** gezet. Een kleine service op de kassa-PC haalt die jobs op en stuurt ze naar een **ESC/POS bonprinter** (58/80 mm).

### Setup

1. Installeer de **Windows-driver** van je bonprinter (Epson, Star, Bixolon, …).
2. Noteer de **exacte printernaam** in Windows (Instellingen → Printers).
3. Voeg toe aan `.env` (zie `.env.example`):
   - `PRINT_AGENT_SECRET` — min. 16 tekens (zelfde in app en agent)
   - `PRINT_AGENT_API_URL` — bv. `http://localhost:3000`
   - `PRINTER_NAME` — exacte Windows-naam
4. Schema bijwerken: `npm run db:push`
5. Start de app: `npm run dev`
6. Start op de kassa-PC: `npm run print:agent`

### Gedrag

- **Automatisch:** bij elke nieuwe order → printjob `PENDING`
- **Handmatig:** admin **Bestellingen** → detail → knop **Keukenbon**
- Agent pollt elke paar seconden, print, markeert `DONE` of `FAILED`

Bonprinters gebruiken meestal **ESC/POS** (niet ZPL). Zebra labelprinters zijn een ander type.

### QZ Tray certificaat (geen popup bij elke print)

Je kan QZ Tray laten onthouden dat jouw webapp mag printen, zonder bestaande certificaten te verwijderen:

1. Genereer een certificaat + private key voor QZ (self-signed kan voor lokaal).
2. Zet beide in `.env`:
   - `QZ_TRAY_CERT_PEM`
   - `QZ_TRAY_PRIVATE_KEY_PEM`
3. Herstart `npm run dev`.
4. Open **Admin → Bestellingen**, verbind QZ en doe een testprint.
5. In QZ popup: vink **Remember this decision** aan en klik **Allow**.

Belangrijk: je hoeft andere certificaten in QZ Tray niet te verwijderen; QZ ondersteunt meerdere trusted certs.

## Productfoto's

**Demo:** seed vult `imageUrl` met geoptimaliseerde Unsplash-thumbnails (`w=256`, WebP/AVIF via Next.js Image).

**Productie (aanbevolen):**
1. **Eigen foto's** — upload in admin (veld *Afbeelding URL*) of naar S3/Cloudflare R2
2. **`next/image`** — automatisch verkleinen, lazy load, moderne formaten
3. Geen live “ophalen” per pageload — URL's opslaan in de database (snel en voorspelbaar)

Automatisch scrapen van Google is traag, onbetrouwbaar en vaak niet toegestaan.

## Betalingen

Controleer je setup (alleen development): `GET http://localhost:3000/api/payments/status`

### Echte Mollie (aanbevolen)

1. [Mollie Dashboard](https://my.mollie.com/dashboard/developers/api-keys) → kopieer **Test API-key** (`test_…`)
2. **Admin → Instellingen** → Online betalen **aan** → Provider **Mollie** → plak API-key → **Opslaan**
3. Herstart `npm run dev` als je de key in `.env` zet i.p.v. admin
4. Checkout → **Nu online betalen** → je gaat naar **mollie.com** om te betalen

Key testen: `node scripts/verify-mollie-key.mjs test_jouw_key`

Status: `GET http://localhost:3000/api/payments/status` → `"mode":"mollie"` als alles goed staat.

**Let op:** `PAYMENT_SIMULATE=true` gebruikt alleen demo *zonder* API-key. Zodra er een key is (admin of `.env`), wordt altijd **echte Mollie** gebruikt.

### Demo zonder Mollie-account

`.env`: `PAYMENT_SIMULATE=true` en geen API-key. Dan geen Mollie-scherm, direct “Betaald” op de orderpagina.

### Admin

**Instellingen** → Mollie API-key + online betalen + provider Mollie.

Optioneel: **Online betalen verplicht** — klanten zien geen keuze meer op checkout; iedereen moet via Mollie betalen.

### Bij afhalen

Provider **Handmatig** — geen online betaling.

Productie-webhook: `POST /api/payments/webhook`

## Productie

```bash
docker compose up -d --build
```

Caddy voor TLS/reverse proxy — zie `Caddyfile.example`.

## Documentatie

- [Architectuur](docs/ARCHITECTURE.md)
- [Build plan](docs/BUILD-PLAN.md)

## Nieuwe klant

1. Maak `Tenant`, `TenantDomain`, `BrandSettings`, `BusinessSettings`
2. Voeg hostname toe in Caddy
3. Vul catalogus en slotregels in via admin
