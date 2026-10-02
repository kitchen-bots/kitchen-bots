# KitchenBots Platform Master Architecture & Handoff Plan

> **Status:** Implementation Complete & Production Hardened  
> **Architecture Version:** 2.0 (Turborepo Monorepo + Payload CMS 3.0 + Supabase PostgreSQL)

---

## 1. Executive Summary

The KitchenBots software ecosystem has been consolidated from two disconnected repositories (`kitchen-bots-ecommerce` and `kitchen-bots-dashboard` backed by legacy Google Apps Script) into a single, high-performance **Turborepo monorepo**.

- **Customer Storefront (`apps/storefront`):** Vite 7 + React 19 SPA delivering high-end anti-slop industrial aesthetics, hardware-accelerated 360° product turntables, real-time cart, and direct checkout order submission.
- **Operations & CMS Backend (`apps/backend`):** Next.js 15 App Router + Payload CMS 3.0 delivering an operational admin dashboard (`/admin`), PostgreSQL persistence via Supabase, and S3-compatible media management via Cloudflare R2.
- **Edge Routing (`src/router.ts` & `wrangler.jsonc`):** Cloudflare Worker serving the static storefront from edge assets while proxying `/admin`, `/api`, and `/_next` routes to the backend under a single domain.

---

## 2. Completed Phase Deliverables

| Phase | Milestone | Scope & Deliverables | Verification Status |
|---|---|---|---|
| **Phase 01** | **Monorepo Architecture** | Turborepo workspace setup with `apps/storefront`, `apps/backend`, and `packages/types`. Strict folder isolation between frontend and backend teams. | Passed (`pnpm build`) |
| **Phase 02** | **Database & CMS Foundation** | Supabase PostgreSQL cluster integration, Payload CMS 3.0 initialization, 12 authentic equipment models and 6 categories seeded. | Passed (Verified in DB) |
| **Phase 03** | **Operations Dashboard & Brand Polish** | Restored operational dashboard at `/admin`, KPI metric cards, SVG revenue trajectory chart, recent orders fulfillment queue, CRM leads table, official vector brandmarks. | Passed (`GET /admin` 200 OK) |
| **Phase 04** | **Commerce & API Wiring** | Live order checkout (`POST /api/orders`) in `CartPage.tsx`, B2B equipment inquiries (`POST /api/enquiries`), and dynamic catalog retrieval (`/api/products?limit=100`). | Passed (End-to-end verified) |
| **Phase 05** | **Edge Router & Deployment** | Single-domain Cloudflare Edge Router (`src/router.ts`), environment dictionaries, and upstream Git synchronization (`main` branch). | Passed (`git push upstream main`) |

---

## 3. Repository Boundary & Team Workflows

- **Frontend Scope (`apps/storefront`):**
  - Public marketing, discovery, product detail, wishlist, cart, and B2B quotation forms.
  - Consumes `/api/products`, `/api/orders`, and `/api/enquiries` through relative domain paths.
  - Zero backend code or database dependencies.
- **Backend Scope (`apps/backend`):**
  - Payload CMS 3.0 collections: `products`, `categories`, `orders`, `enquiries`, `quotes`, `services`, `users`, `media`.
  - Supabase PostgreSQL schema, migrations, and seeders.
  - Custom Admin components (`AdminDashboard.tsx`, `Logo.tsx`, `Icon.tsx`).
- **Shared Contracts (`packages/types`):**
  - `@kitchen-bots/types` imported by both applications for shared domain types (`Product`, `Order`, `Enquiry`, `Quote`).

---

## 4. Production Handoff Checklist

1. **Edge Deployment:**
   - Deploy root Cloudflare Worker via `pnpm deploy` or Cloudflare Pages.
   - Configure `BACKEND_ORIGIN` pointing to the public URL of the deployed Next.js backend.
2. **Backend Server Hosting:**
   - Host `apps/backend` on a Node.js-compatible container/host (Railway, Render, Fly.io, Vercel, or Linux VPS).
   - Ensure environment variables (`DATABASE_URI`, `PAYLOAD_SECRET`, `SUPABASE_*`, `R2_*`) are set.
3. **Optional Enhancements:**
   - **Transactional Emails:** Configure `@payloadcms/email-resend` for automatic dispatch of order confirmation and quotation review emails.
   - **Payment Gateway:** If immediate online card/UPI payments are required (in place of standard commercial invoice on delivery), attach Razorpay/Cashfree webhook handlers.
