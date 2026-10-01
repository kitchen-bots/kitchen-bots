# Kitchen Bots Monorepo Contributor Guide

Welcome to the unified **`kitchen-bots`** repository!

This codebase is organized as a **Turborepo** with **pnpm workspaces** to cleanly separate frontend, backend, and shared contracts so that team members can work in parallel without merge conflicts.

---

## 1. Directory Structure & Team Ownership

```
kitchen-bots/
├── apps/
│   ├── storefront/     # Vite + React 19 Storefront (Charan & UI Team)
│   └── backend/        # Payload CMS 3.0 + Next.js App Router (Shritha & Backend Team)
├── packages/
│   ├── types/          # Shared TypeScript contracts (Product, Order, Quote, etc.)
│   └── config/         # Shared configurations
├── src/
│   └── router.ts       # Cloudflare Edge Router (routes /admin and /api to backend)
└── wrangler.jsonc      # Unified Cloudflare deployment config
```

### Team Isolation Guidelines
- **UI Engineers (Charan & team):** Work exclusively inside `apps/storefront/`. Changes to components, GSAP animations, 360 viewer, or styles will never conflict with backend models.
- **Backend Engineers (Shritha & team):** Work exclusively inside `apps/backend/`. Define collections, database models, webhooks, and seeders.
- **Shared Data Contracts:** Any modifications to shared data types (e.g. adding a new field to `Product` or `Order`) should be made in `packages/types/` and imported as `@kitchen-bots/types`.

---

## 2. Getting Started

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation
From the root directory:
```bash
pnpm install
```

### Running Locally
To run all applications concurrently:
```bash
pnpm dev
```

To run individual applications:
- **Storefront Only (port 5173):**
  ```bash
  pnpm dev:storefront
  ```
- **Backend & Payload Admin (port 3001):**
  ```bash
  pnpm dev:backend
  ```
  Access Payload Admin at: `http://localhost:3001/admin`

---

## 3. Database & Payload CMS Seeding

1. Ensure your PostgreSQL connection string is set in `apps/backend/.env`:
   ```env
   DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/kitchen_bots
   PAYLOAD_SECRET=your-secret-key
   ```
2. To import the verified 12-product authentic catalog and categories:
   ```bash
   pnpm --filter @kitchen-bots/backend seed
   ```

---

## 4. Building & Testing

Run all checks from the root:
```bash
# Typecheck all packages
pnpm typecheck

# Run test suites
pnpm test

# Build production assets
pnpm build
```

---

## 5. Deployment

Both Storefront and Admin are deployed under a single domain via Cloudflare:
```bash
# Dry run validation
pnpm deploy:dry-run

# Production deploy
pnpm deploy
```
- Storefront is served from edge static assets at `/`.
- Admin panel is accessible directly at `/admin`.
- Public APIs are accessible at `/api/*`.
