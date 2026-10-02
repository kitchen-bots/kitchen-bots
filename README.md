# KitchenBots Platform Monorepo

> **Precision Meets Fire.**  
> India's premier direct-to-consumer and commercial B2B platform for engineered outdoor cooking systems, collapsible grills, secondary-combustion rocket stoves, and heavy-duty live-fire culinary hardware.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.4-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload_CMS-3.0-white?logo=payloadcms&logoColor=black)](https://payloadcms.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_%26_R2-F38020?logo=cloudflare&logoColor=white)](https://cloudflare.com/)

---

## 1. Overview & Architecture

KitchenBots is structured as a **Turborepo monorepo** managed with **pnpm workspaces**. It unifies the high-performance customer-facing storefront and the operations management system under a **single domain**, eliminating cross-origin CORS complexity, multi-repository drift, and fragmented databases.

```
                                  ┌──────────────────────────────────────────┐
                                  │      Cloudflare Edge Router Worker       │
                                  │       (src/router.ts / wrangler.jsonc)   │
                                  └─────────────────────┬────────────────────┘
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      │                                                                   │
          Path: /* (Storefront Static SPA)                                Path: /admin/*, /api/*, /_next/*
                      │                                                                   │
                      ▼                                                                   ▼
       ┌──────────────────────────────┐                                    ┌──────────────────────────────┐
       │      apps/storefront         │                                    │        apps/backend          │
       │   Vite 7 + React 19 + TS     │                                    │  Next.js 15 App Router       │
       │   - GSAP 3 + 360° Turntable  │                                    │  Payload CMS 3.0 Core        │
       │   - Direct Cart & Orders     │                                    │  - Custom Operations Board   │
       │   - B2B Bulk Machinery Quote │                                    │  - REST & GraphQL API        │
       └──────────────┬───────────────┘                                    └──────────────┬───────────────┘
                      │                                                                   │
                      │ CDN Media GET                                                     │ SQL Connection Pooler
                      ▼                                                                   ▼
       ┌──────────────────────────────┐                                    ┌──────────────────────────────┐
       │    Cloudflare R2 Storage     │                                    │    Supabase PostgreSQL       │
       │    (kitchen-bots-media)      │                                    │   (Singapore Session Pool)   │
       │  - 3D WebP Sequences (~700MB)│                                    │   - Products, Categories     │
       │  - Product CAD Renders       │                                    │   - Orders, Enquiries        │
       │  - Demonstration 4K Videos   │                                    │   - Users, Roles, Documents  │
       └──────────────────────────────┘                                    └──────────────────────────────┘
```

---

## 2. Repository Structure

```text
kitchen-bots/
├── apps/
│   ├── storefront/             # Customer e-commerce storefront (Vite + React 19 + Tailwind CSS)
│   │   ├── src/                # Pages, sections, 360 viewer, cart & wishlist context
│   │   ├── public/             # Static icons, manifest, favicon
│   │   └── vite.config.ts      # Reverse-proxy configuration for /api and /admin in development
│   │
│   └── backend/                # Next.js 15 + Payload CMS 3.0 Headless API & Operations Panel
│       ├── src/
│       │   ├── app/(payload)/  # Payload CMS routes (/admin, /api) and custom dark industrial CSS
│       │   ├── collections/    # Schema definitions (Products, Categories, Orders, Enquiries, etc.)
│       │   ├── components/     # Custom Operations Dashboard, brand logo, and telemetry badges
│       │   └── scripts/        # Seeding and data migration scripts
│       └── payload.config.ts   # Database adapter, S3 media plugin, and admin branding config
│
├── packages/
│   └── types/                  # Shared TypeScript contracts (@kitchen-bots/types)
│       └── src/                # Product, Category, Order, Quote, and Enquiry interfaces
│
├── src/
│   └── router.ts               # Production Cloudflare Worker reverse-proxy router
├── wrangler.jsonc              # Cloudflare edge deployment manifest
├── turbo.json                  # Turborepo task pipeline orchestration
└── pnpm-workspace.yaml         # Monorepo workspace configuration
```

---

## 3. Tutorial: Getting Started (Local Development)

Follow these steps to run the complete KitchenBots ecosystem locally.

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
- Access to the Supabase PostgreSQL cluster and Cloudflare R2 bucket credentials

### Step 1: Install Dependencies
From the repository root:
```bash
pnpm install
```

### Step 2: Configure Environment Variables
Copy and verify environment configuration for the backend:
```bash
cp apps/backend/.env.example apps/backend/.env # Or populate with active credentials
```

Key environment values in `apps/backend/.env`:
```ini
DATABASE_URI=postgresql://postgres.thavrhaxomanrpsmfklx:kitchen-bots-password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
PAYLOAD_SECRET=kitchen-bots-super-secret-payload-key-2026
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
PORT=3001
```

### Step 3: Seed the Database
Populate the 12 authentic KitchenBots equipment models and 6 categories into Supabase:
```bash
pnpm seed
```

### Step 4: Start the Development Server
Launch both storefront and backend concurrently:
```bash
pnpm dev
```

- **Storefront**: Accessible at [http://localhost:5173/](http://localhost:5173/)
- **Operations Dashboard**: Accessible at [http://localhost:5173/admin](http://localhost:5173/admin) (or directly on backend port [http://localhost:3001/admin](http://localhost:3001/admin))
- **Public REST API**: Accessible at [http://localhost:5173/api/products](http://localhost:5173/api/products)

---

## 4. How-To Guides

### How to Add New Equipment to the Catalog
1. Navigate to `http://localhost:5173/admin` and log in.
2. Select **Products** from the sidebar and click **Create New**.
3. Provide:
   - **Name**: (e.g. `Santa Maria Commercial 48"`)
   - **Slug**: (e.g. `santa-maria-commercial-48`)
   - **Category**: Select appropriate category (e.g. `Santa Maria Series`)
   - **Price (Paise)**: Enter amount in paise (e.g. `₹45,000` = `4500000`)
   - **Sales Mode**: `direct`, `quote`, or `both`
   - **Specifications**: Key-value pairs for steel gauge, dimensions, thermal resistance.
4. Click **Publish**. The product will immediately appear in the customer storefront catalog.

### How to Place a Test Order
1. Browse products at `http://localhost:5173/products`.
2. Click **Add to Cart** on any available machine.
3. Open the Cart ([http://localhost:5173/cart](http://localhost:5173/cart)) and click **Place Order**.
4. Fill in delivery contact details and confirm.
5. The order is stored in Supabase PostgreSQL and appears immediately in the **Orders** collection in the Operations Dashboard at `http://localhost:5173/admin/collections/orders`.

### How to Run Automated Quality Gates
Run checks before submitting commits:
```bash
# Typecheck across all workspace packages
pnpm typecheck

# Run test suites
pnpm test

# Build production bundles for storefront and backend
pnpm build
```

---

## 5. Reference

### Environment Variables Dictionary

| Variable | Scope | Purpose | Example |
|---|---|---|---|
| `DATABASE_URI` | Backend | PostgreSQL connection string (Supabase pooler) | `postgresql://user:pass@aws-0-pooler...` |
| `PAYLOAD_SECRET` | Backend | Encryption key for admin cookie/session signing | `32+ char random string` |
| `SUPABASE_URL` | Backend | Supabase API project endpoint | `https://thavrhaxomanrpsmfklx.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Backend / Storefront | Public anon client key | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Backend | Elevated service role key | `sb_secret_...` |
| `R2_ACCOUNT_ID` | Backend / Scripts | Cloudflare Account ID for R2 storage | `40d731f6e90b22eddf5c79c064b5bbb7` |
| `R2_ACCESS_KEY_ID` | Backend / Scripts | Cloudflare R2 S3-compatible Access Key | `2bfeb396572d53...` |
| `R2_SECRET_ACCESS_KEY` | Backend / Scripts | Cloudflare R2 S3-compatible Secret Key | `c3ee82f1510e...` |
| `R2_BUCKET_NAME` | Backend / Scripts | Target R2 media bucket name | `kitchen-bots-media` |
| `VITE_CDN_URL` | Storefront | Public URL of Cloudflare R2 CDN | `https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev` |
| `BACKEND_ORIGIN` | Cloudflare Worker | Upstream Next.js backend origin URL | `https://admin.kitchenbots.in` |

### Core REST API Endpoints

All endpoints are available relative to the root domain:

- `GET /api/products`: Lists published equipment models (supports `?limit=100`, `?where[category][equals]=...`).
- `GET /api/products/:id`: Retrieves full equipment specifications and media references.
- `POST /api/orders`: Submits customer checkout order directly into Supabase.
- `POST /api/enquiries`: Submits B2B bulk machinery quotes or general contact queries.
- `GET /api/categories`: Lists active equipment categories.

### Command Reference

| Command | Action |
|---|---|
| `pnpm dev` | Run both storefront (5173) and backend (3001) concurrently |
| `pnpm dev:storefront` | Run Vite storefront application only |
| `pnpm dev:backend` | Run Next.js Payload CMS backend only |
| `pnpm build` | Build production bundles for all packages |
| `pnpm seed` | Seed 12 authentic models and categories to Supabase |
| `pnpm typecheck` | Validate TypeScript types across the workspace |
| `pnpm test` | Run Vitest unit and integration suites |

---

## 6. Explanation: Architecture Decisions

### Why a Turborepo Monorepo?
Previously, the storefront (`kitchen-bots-ecommerce`) and the dashboard (`kitchen-bots-dashboard`) were maintained in separate repositories with mismatched Google Apps Script backends. This caused:
1. Merge conflicts when multiple engineers altered shared types or models.
2. Inconsistent catalog schemas requiring manual sync scripts.
3. Cross-origin browser complications when embedding or linking admin pages.

By consolidating into a Turborepo monorepo:
- **Team Isolation**: UI engineers work strictly in `apps/storefront`, backend engineers work strictly in `apps/backend`.
- **Shared Contracts**: Single source of truth in `packages/types`.
- **Single-Domain Operations**: Storefront and Admin live under the exact same hostname via the Cloudflare Edge Router, providing seamless `/admin` access.

### Why Payload CMS 3.0 + Supabase PostgreSQL?
- **Zero Lock-in & Full Code Control**: Payload CMS runs as native Next.js 15 App Router code, using standard PostgreSQL tables in Supabase rather than a black-box CMS.
- **Relational Integrity**: Equipment, categories, line-item orders, and B2B inquiries maintain strict foreign-key relations and constraints.
- **Enterprise-Grade Admin UI**: Delivers a customizable dark operations dashboard without needing to build custom CRUD views for every database table.
