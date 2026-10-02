# KitchenBots Backend Architecture & Implementation Report

**Status:** Completed & Operational  
**Technology:** Next.js 15 (App Router) + Payload CMS 3.0 + Supabase PostgreSQL  
**Deployment Model:** Single-Domain Edge Proxy via Cloudflare Worker  

---

## 1. System Overview

The KitchenBots backend has been transitioned to **Payload CMS 3.0**, running natively inside the Next.js 15 App Router at `apps/backend/`. It is connected to a dedicated **Supabase PostgreSQL** cluster and uses **Cloudflare R2** for object storage.

### Core Capabilities:
- **Operations Dashboard (`/admin`):** Fully integrated admin portal with real-time KPI metrics, responsive SVG revenue trajectories, orders fulfillment queue, and B2B leads management.
- **REST & GraphQL API (`/api/*`):** Auto-generated endpoints for all collections, supporting filtering, sorting, pagination, and relational queries.
- **Database Engine:** Supabase PostgreSQL with relational integrity, foreign key constraints, and session-mode connection pooling.
- **Media Storage:** Cloudflare R2 bucket (`kitchen-bots-media`) integrated with S3 client adapter and public CDN edge delivery.

---

## 2. Collections & Schema

1. **`products`**: Equipment attributes, SKU, pricing in paise, dimensions, thermal ratings, features, and R2 media URLs.
2. **`categories`**: Commercial categories (Santa Maria Series, Rocket Stoves, Collapsible BBQ, Automatic BBQ, Suitcase BBQ, Accessories).
3. **`orders`**: Customer details, shipping address, line items, total paise, payment status, and fulfillment stage.
4. **`enquiries`**: B2B machinery quotes and contact inquiries.
5. **`quotes`**: Formal B2B proposals with custom fabrication terms.
6. **`services`**: Equipment maintenance tickets and warranty claims.
7. **`users`**: Administrative and operations staff accounts with role-based access control.
8. **`media`**: Uploaded assets backed by Cloudflare R2 storage.

---

## 3. Environment Configuration

The backend is configured via `apps/backend/.env`:
- `DATABASE_URI`: Supabase PostgreSQL pooler connection string.
- `PAYLOAD_SECRET`: Secret key for session cookie encryption.
- `R2_*`: Cloudflare R2 S3-compatible credentials and bucket name.
- `NEXT_PUBLIC_SERVER_URL`: Public-facing server URL for asset links and webhooks.
