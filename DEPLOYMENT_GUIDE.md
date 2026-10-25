# Kitchen Bots - Executive & Technical Deployment Guide

**Target Audience:** Engineering Leadership, Operations, & DevOps Teams  
**Architecture:** Monorepo (Turborepo + pnpm)  
**Live Production URL:** [https://kitchen-bots.vercel.app](https://kitchen-bots.vercel.app)  
**Production Domain:** [https://kitchenbots.in](https://kitchenbots.in)  

---

## 1. System Architecture Overview

Kitchen Bots is architected as a high-performance, serverless-ready e-commerce & B2B portal:

```mermaid
flowchart TD
    subgraph Frontend["Storefront Layer (apps/storefront)"]
        UI["React 19 + Vite SPA"]
        Assets["Turntable 360 & WebGL Assets"]
    end

    subgraph Backend["API & CMS Layer (apps/backend)"]
        Payload["Next.js 15 + Payload CMS 3.x"]
        AdminUI["/admin Management Portal"]
        API["REST & GraphQL Endpoints"]
    end

    subgraph DataLayer["Infrastructure & Storage"]
        DB[("Supabase / AWS PostgreSQL\n(Transaction Pooler: 6543)")]
        Media[("Cloudflare R2 / AWS S3\n(Product Media & Catalog PDFs)")]
        PaymentGateway["Razorpay / Cashfree Gateway"]
    end

    UI -->|REST API Requests| API
    AdminUI -->|Manage Content & Orders| Payload
    Payload -->|Connection Pool (max: 2 per lambda)| DB
    Payload -->|Upload & Presign| Media
    UI -->|Checkout & Webhooks| PaymentGateway
    PaymentGateway -->|Webhook Verification| Payload
```

---

## 2. Infrastructure Requirements & Services

| Service | Recommended Provider | Purpose | Free Tier / Cost Tier |
| :--- | :--- | :--- | :--- |
| **Hosting & Serverless** | **Vercel** / **AWS Amplify** | Hosts Next.js backend and Storefront SPA | Pro Plan ($20/mo) or Hobby |
| **Database** | **Supabase** (PostgreSQL 16) | Transactional data (Orders, Products, Quotes) | Free / Pro ($25/mo) |
| **Object Storage** | **Cloudflare R2** / **AWS S3** | High-speed zero-egress asset & media storage | Free (10GB) / Pay-per-GB |
| **DNS & CDN** | **Cloudflare** | SSL, DDoS mitigation, caching, global routing | Free / Pro |
| **Payment Gateway** | **Razorpay** | Domestic UPI, Cards, Netbanking & Corporate RTGS | Standard MDR (2%) |

---

## 3. Environment Variables Specification

Ensure the following variables are configured in the **Vercel Project Settings > Environment Variables** (applied to *Production* and *Preview*):

### Backend & Core Config (`apps/backend`)

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `DATABASE_URI` | **Yes** | `postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` *(Use port 6543 for transaction pooling)* |
| `PAYLOAD_SECRET` | **Yes** | 32+ character random secret string for session signing |
| `NEXT_PUBLIC_SERVER_URL` | **Yes** | `https://kitchen-bots.vercel.app` (or custom domain `https://kitchenbots.in`) |
| `NODE_ENV` | **Yes** | `production` |

### Cloudflare R2 / AWS S3 Media Storage (Optional for launch)

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 Token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 Token Secret Access Key |
| `R2_BUCKET_NAME` | Optional | `kitchen-bots-media` |
| `R2_ACCOUNT_ID` | Optional | Cloudflare Account ID |
| `R2_ENDPOINT` | Optional | `https://<account_id>.r2.cloudflarestorage.com` |

### Payment & Integrations

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `RAZORPAY_KEY_ID` | Optional | `rzp_live_...` (or test key `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay Secret Key for HMAC signature verification |

---

## 4. Step-by-Step Deployment Guide

### Step 1: GitHub Repository Linking (One-Time Setup)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Import the Git repository: `kitchen-bots/kitchen-bots`.
3. Configure the Root Directory settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/backend` (or Monorepo root if deploying via Turborepo)
   - **Build Command**: `cd ../.. && pnpm build` (or `turbo run build`)
   - **Install Command**: `pnpm install`

### Step 2: Provision & Link Supabase Database
1. Create a PostgreSQL project on [Supabase](https://supabase.com).
2. Go to **Project Settings > Database > Connection Pooling**.
3. Select **Mode: Transaction (Port 6543)** and copy the connection string.
4. Add `DATABASE_URI` in Vercel Environment Variables.

### Step 3: Seed Initial Catalog & Create Admin Account
Run the automated seed and admin provisioning scripts locally or via CI:

```bash
# Install dependencies
pnpm install

# Seed official Kitchen Bots categories & 12+ engineered products
pnpm seed

# Create initial Super Admin user
# Default credentials: admin@kitchenbots.com / admin123456
pnpm --filter @kitchen-bots/backend create-admin
```

> [!IMPORTANT]
> Change the default admin credentials immediately after logging into `/admin` on production.

### Step 4: Deploy & Verify
Push to the `main` branch:
```bash
git switch main
git push upstream main
```
Vercel will trigger automatic builds and deploy across edge nodes.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Admin Portal Health**: Navigate to `/admin`, log in, and verify dashboard widgets load.
- [ ] **Catalog CRUD Operations**: Test creating, updating, and deleting a test product/category.
- [ ] **Storefront E-Commerce Flow**: Add a product to the cart, enter phone number with country code (e.g. `+91 9876543210`), and place a test order.
- [ ] **B2B Quotation Flow**: Submit a quotation inquiry and ensure it appears in the `/admin/collections/quotes` queue.
- [ ] **Service & Support Tickets**: Test ticket creation flow at `/service`.
- [ ] **Mobile & Responsive Check**: Test navigation, freeze bar, and checkout drawer on iOS/Android.

---

## 6. Monitoring & Maintenance

- **Uptime Monitoring**: Add a free health check ping on `https://kitchen-bots.vercel.app/api/health` or `/admin` via [BetterStack](https://betterstack.com) or [UptimeRobot](https://uptimerobot.com).
- **Log Inspection**: Real-time serverless logs are available directly in **Vercel Dashboard > Deployments > Logs**.
- **Database Backups**: Supabase automatically creates daily point-in-time recovery (PITR) snapshots.
