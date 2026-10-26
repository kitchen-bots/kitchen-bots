# Kitchen Bots — Database, File Storage & Cloud Provider Audit

**Status**: Verified & Audited  
**Date**: October 2026  
**Audit Type**: Read-only static inspection & environment audit (zero code/data modifications)

---

## 1. Executive Summary & Direct Answers

| Question | Answer | Details & Evidence |
| :--- | :--- | :--- |
| **1. Are we currently using Supabase for the database?** | **YES** | Configured in [apps/backend/src/payload.config.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/payload.config.ts#L21-L25) and `.env.local` using `DATABASE_URI` targeting Supabase PostgreSQL via transaction/session pooler. Direct PostgreSQL driver (`pg`, `@payloadcms/db-postgres`), no Supabase client SDK needed. |
| **2. Are we using Supabase Storage for files?** | **NO** | Neither `@supabase/storage-js` nor `@supabase/supabase-js` is installed or imported anywhere in the codebase. Supabase is strictly utilized as a managed PostgreSQL relational database. |
| **3. Are we using Cloudflare R2 for files?** | **YES (Configured for Production)** | Payload CMS native Media collection has used `@payloadcms/storage-s3` pointing to Cloudflare R2 since initial commit (`54efa71`). Operations routes (`documents` and `media/upload`) now share this via [apps/backend/src/lib/storage/r2-provider.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/storage/r2-provider.ts) when `STORAGE_DRIVER=r2`. |
| **4. Did we remove Cloudflare, or did we add R2 support?** | **ADDED R2 SUPPORT (Never Removed)** | Cloudflare R2 was never removed. R2 configuration was present from day one in Payload CMS. We recently added unified R2 driver support to custom operations routes to prevent ephemeral local filesystem writes on Vercel. |
| **5. What should we keep, and what should we change next?** | **KEEP CURRENT STACK** | **Keep**: Supabase PostgreSQL for DB + Cloudflare R2 for object storage (with local disk provider for local dev/testing).<br>**Change Next**: Configure production environment variables (`STORAGE_DRIVER=r2`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`) in Vercel. Do not introduce Supabase Storage. |

---

## 2. Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                      KITCHEN BOTS ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+

                          +------------------------------------------+
                          |             Clients / Users              |
                          +--------------------+---------------------+
                                               |
                                               v
                          +------------------------------------------+
                          |   Next.js Backend & Operations Routes    |
                          |      (Deployed on Vercel Serverless)     |
                          +----------+--------------------+----------+
                                     |                    |
        +----------------------------+                    +----------------------------+
        |                                                                              |
        v [Relational Data]                                                            v [Object Storage]
+----------------------------------+                              +------------------------------------+
|       DATABASE LAYER             |                              |         FILE STORAGE LAYER         |
+----------------------------------+                              +------------------------------------+
| Database: PostgreSQL             |                              | 1. Payload CMS Media:              |
| Provider: Supabase               |                              |    - @payloadcms/storage-s3        |
| Host: aws-0-ap-southeast-1       |                              |    - Target: Cloudflare R2         |
| Pooler: Port 6543 / PgBouncer    |                              |                                    |
| Adapter: @payloadcms/db-postgres |                              | 2. Operations Documents & Media:   |
| Repo: PostgresOperationsRepo     |                              |    - IStorageProvider Abstraction  |
|                                  |                              |    - Dev: LocalStorageProvider     |
| Env Vars:                        |                              |    - Prod: R2StorageProvider       |
| - DATABASE_URI (Supabase Prod)   |                              |                                    |
| - OPERATIONS_DATABASE_URI (Test) |                              | Env Vars:                          |
+----------------------------------+                              | - STORAGE_DRIVER (local | r2)      |
                                                                  | - R2_BUCKET_NAME                   |
                                                                  | - R2_ACCESS_KEY_ID                 |
                                                                  | - R2_SECRET_ACCESS_KEY             |
                                                                  | - R2_ACCOUNT_ID / R2_ENDPOINT      |
                                                                  | - R2_PUBLIC_URL                    |
                                                                  +------------------------------------+
```

---

## 3. Database Audit

### 3.1 Target & Provider
- **Production / Default Target**: Supabase PostgreSQL (`aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`).
- **Development / Test Target**: Local PostgreSQL (`postgresql://localhost:5432/kitchen_bots_test` via `OPERATIONS_DATABASE_URI`).
- **Connection Method**: Standard PostgreSQL connection pooling via `pg.Pool` and `@payloadcms/db-postgres`.
  - In [apps/backend/src/payload.config.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/payload.config.ts#L21-L25), `isRemoteDb` detects Supabase pooler connections and strips conflicting query parameters while enabling SSL (`rejectUnauthorized: false`).
  - In [apps/backend/src/lib/postgres-operations-repo.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/postgres-operations-repo.ts#L16-L25), `OPERATIONS_DATABASE_URI` is strictly guarded: if `NODE_ENV === 'production'`, attempting to use `OPERATIONS_DATABASE_URI` throws a fatal error, forcing use of `DATABASE_URI`.

### 3.2 Is Supabase Storage Used?
- **Finding**: **NO**.
- Zero references to Supabase Storage APIs or client libraries. Supabase acts purely as a managed database host.

---

## 4. File-Storage Provider Matrix

| File Type / Purpose | Route / Mechanism | Local Dev (`STORAGE_DRIVER=local`) | Production (`STORAGE_DRIVER=r2`) |
| :--- | :--- | :--- | :--- |
| **1. Product Images & Videos** | `/api/operations/media/upload` | `public/images/products/<file>` (synced to storefront public) | Uploads object to Cloudflare R2 bucket; returns CDN / public R2 URL |
| **2. Business Documents & Versions** | `/api/operations/documents` & `.../download` | `storage/documents/<category>/<file>` on disk | Streams object to/from Cloudflare R2 bucket via `@aws-sdk/client-s3` |
| **3. Payload CMS Native Media** | Admin Media Collection (`/admin/collections/media`) | Cloudflare R2 (configured via `@payloadcms/storage-s3`) | Cloudflare R2 (configured via `@payloadcms/storage-s3`) |
| **4. Storefront Product Images** | `apps/storefront` UI components | Served as static assets from `/images/products/` | Served directly from Cloudflare R2 public URL / CDN domain |
| **5. Application Logs / Temporary Test Files** | Test runners / Puppeteer artifacts | Local artifacts directory (`.gemini/antigravity-ide/brain/...`) | Ephemeral serverless memory (`/tmp`) or test logs |

---

## 5. History: Did We Remove Cloudflare or Add R2?

1. **Inception (`commit 54efa71`)**:
   - `payload.config.ts` was created with `@payloadcms/storage-s3` targeting `R2_BUCKET_NAME || 'kitchen-bots-media'`.
   - `.env.example` included `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`.
2. **Recent Development**:
   - Custom operations endpoints (`/api/operations/documents` and `/api/operations/media/upload`) initially wrote exclusively to local filesystem paths (`storage/documents` and `public/images/products`).
   - On Vercel serverless functions, the local filesystem is ephemeral and read-only outside `/tmp`.
   - We implemented `apps/backend/src/lib/storage/` providing `IStorageProvider`, `LocalStorageProvider`, and `R2StorageProvider`.
   - **Conclusion**: Cloudflare R2 was **never removed**. We added unified R2 driver support to custom operations routes to make them compatible with production serverless deployment.

---

## 6. Provider Selection & Fallback Behavior

In [apps/backend/src/lib/storage/index.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/storage/index.ts#L12-L46):
- Default: If `STORAGE_DRIVER` is unset, it defaults to `local`.
- Strict Production Guard: If `STORAGE_DRIVER=r2` is set, but credentials (`R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY`) are missing, it throws a fatal error:
  ```ts
  FATAL: STORAGE_DRIVER=r2 is configured for production, but R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing. Refusing to silently fall back to local ephemeral storage in production.
  ```
- This ensures test suites and local development work offline without credentials, while production deployments never silently drop uploads onto ephemeral disk.

---

## 7. Architecture Recommendation & Comparison

### Option Comparison
1. **Supabase PostgreSQL + Supabase Storage**:
   - *Pros*: Single cloud dashboard.
   - *Cons*: Requires installing `@supabase/supabase-js`, rewriting Payload CMS storage adapter, migrating existing S3 plugins, and paying Supabase egress bandwidth costs.
2. **Supabase PostgreSQL + Cloudflare R2 (RECOMMENDED)**:
   - *Pros*:
     - **Zero egress fees**: Cloudflare R2 charges $0 for data egress, crucial for high-resolution equipment photos and heavy operational PDFs.
     - **S3 Compatibility**: Native compatibility with `@payloadcms/storage-s3` and `@aws-sdk/client-s3`.
     - **Zero code rewrites**: Already fully implemented and verified in both Payload CMS and custom operations routes.
     - **Clean separation**: Database handles relational transactions; object storage handles bulk media.
3. **Supabase PostgreSQL + Local Disk**:
   - *Status*: Valid for local development only. Incompatible with Vercel serverless production.

### Final Recommendation
- **Retain the current stack**:
  - **Database**: Supabase PostgreSQL.
  - **Object Storage**: Cloudflare R2 for production; Local filesystem for local development and testing.
- **Next Operational Steps (No code changes needed)**:
  - Populate production environment variables in Vercel (`STORAGE_DRIVER=r2`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`).

---

## 8. Production Storage Configuration Readiness Checklist

### 8.1 Verification Status
- [x] **Provider Resolution Guard**: Verified in `apps/backend/src/lib/storage/index.ts`. If `STORAGE_DRIVER=r2`, missing credentials trigger a fatal error; zero silent fallback to local disk.
- [x] **Bucket & Credential Consistency**: Verified. Both Payload CMS (`payload.config.ts`) and custom storage (`r2-provider.ts`) use identical variables: `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_PUBLIC_URL`.
- [x] **Public CDN / Download URL Alignment**: Verified. `R2StorageProvider.getPublicUrl()` constructs `${R2_PUBLIC_URL}/${key}` matching storefront and Payload public asset structure.
- [x] **Secure Download & RBAC**: Verified in `/api/operations/documents/download/route.ts`. Public documents stream directly; internal and restricted documents enforce JWT session and RBAC authorization prior to fetching objects.
- [x] **Legacy Path Compatibility**: Verified. `LocalStorageProvider` and `R2StorageProvider` handle prefixed slashes and historical filename formats.
- [x] **Documentation in `.env.example`**: Verified. All `R2_*` variables are documented in `apps/backend/.env.example` and root `.env.example`.
- [ ] **Live Vercel Staging Environment Variables**: **UNVERIFIED**. Vercel CLI is not installed/authenticated in the local environment, and live dashboard settings cannot be inspected without credentials.

### 8.2 Audit Verdict
**READY FOR APPROVED STAGING TEST (Pending Vercel Env Configuration)**  
The codebase is 100% prepared and structurally verified. Once `STORAGE_DRIVER=r2` and R2 credentials are set in the staging deployment environment, live end-to-end upload/download verification can proceed safely.

