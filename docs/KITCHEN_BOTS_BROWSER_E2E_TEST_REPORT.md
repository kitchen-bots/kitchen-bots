# KITCHEN BOTS — REAL BROWSER E2E TEST REPORT (SECOND PASS AUDIT)

> **Execution Date:** October 25, 2026  
> **Automation Tooling:** Google Chrome (Native macOS Binary: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) driven via `puppeteer-core`  
> **Backend URL:** `http://localhost:3001`  
> **Storefront URL:** `http://localhost:5173`  
> **Database:** Local PostgreSQL `kitchen_bots_test` on `localhost:5432` (`OPERATIONS_DATABASE_URI`)  
> **Auth Method:** Real login form submission at `http://localhost:3001/admin/login`

---

## 1. Executive Summary & Verification Matrix

All tests below were executed in real headless Google Chrome with automated assertions, network request tracking, and DOM state inspection.

| Test ID | Module & Feature | Exact Interaction / Input | Expected Result | Actual Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **AUTH-01** | Admin Authentication | Enter credentials on `/admin/login`, submit | Redirect off `/login` to `/admin` | Redirected to `/admin` | **PASS** | URL inspection |
| **AUTH-02** | Security Guard | POST `/api/operations/invoices` without cookies | HTTP 403 Forbidden | HTTP 403 returned | **PASS** | Network response |
| **PAY-NEG-01** | Overpayment Guard | POST payment with ₹999,999.99 for ₹118.00 invoice | HTTP 422 with balance error | HTTP 422: `Payment of 99999999 exceeds outstanding balance of 6800` | **PASS** | Network response |
| **PAY-NEG-02** | Duplicate Reference Guard | POST payment reusing identical UTR & method | HTTP 422 unique constraint error | HTTP 422: `duplicate key value violates unique constraint "uq_payment_txn_ref"` | **PASS** | Database & API |
| **PAY-NEG-03** | Unsupported Status Guard | POST `newStatus: 'cancelled'` | HTTP 400 clean validation error | HTTP 400: `Invalid payment status: cancelled` (enforces DB check) | **PASS** | Network response |
| **PAY-01** | Payments Page Load | Open `/admin?tab=payments` | Workspace renders with filters | Search bar, KPI cards & tabs rendered | **PASS** | DOM & `docs/e2e_screenshots/pass2/pay_01_load.png` |
| **PAY-TAB-Pending** | Pending Tab Filter | Click "Pending (n)" button | Tab activates, cards filtered | Tab activated, 0 receipt cards shown | **PASS** | `pay_tab_pending.png` |
| **PAY-TAB-Cancelled**| Cancelled Tab Filter | Click "Cancelled (n)" button | Tab activates, cards filtered | Tab activated, 0 receipt cards shown | **PASS** | `pay_tab_cancelled.png` |
| **PAY-TAB-Completed**| Completed Tab Filter | Click "Completed (n)" button | Tab activates, cards filtered | Tab activated, completed cards visible | **PASS** | `pay_tab_completed.png` |
| **PAY-SRCH-01** | Payments Search Negative | Type nonexistent UTR string | 0 cards, empty state | 0 cards rendered | **PASS** | `pay_search_empty.png` |
| **PAY-SRCH-02** | Payments Search Positive | Clear & type synthetic UTR | Exactly 1 card matches | Exactly 1 card rendered | **PASS** | `pay_search_match.png` |
| **PAY-DRW-01** | Detail Drawer | Click "View Details" on card | Slide-over drawer opens | Drawer open with notes & status controls | **PASS** | `pay_drawer.png` |
| **PAY-NOTE-NEG** | Note Validation | Submit blank/whitespace note | Button disabled or rejected | Button disabled (`disabled=true`) | **PASS** | DOM attribute |
| **PAY-NOTE-01** | Add Internal Note | Type note, click "Add Note" | POST 200, note shown in audit log | HTTP 200, note immediately visible | **PASS** | `pay_note_added.png` |
| **PAY-STS-OPTS** | Supported Statuses | Inspect `<select>` options | Only `pending`, `success`, `failed` | Options: `pending`, `success`, `failed` | **PASS** | DOM inspection |
| **PAY-STS-01** | Status Transition | Select `pending`, enter reason, submit | POST 200, feedback displayed | HTTP 200 returned, status updated | **PASS** | `pay_status_pending.png` |
| **PAY-PERSIST-01** | Status Persistence | Full page reload, switch to Pending tab | Card appears in Pending tab | 1 card displayed in Pending | **PASS** | `pay_persist_pending.png` |
| **PAY-PERSIST-02** | Note Persistence | Re-open drawer after page reload | Note present in audit history | Note present in audit log | **PASS** | DOM inspection |
| **PAY-RCPT-01** | Receipt Preview Modal | Click "Print Receipt Voucher" | Voucher modal opens with print action | Modal rendered with company voucher info | **PASS** | `pay_receipt.png` |
| **PAY-RCPT-02** | Print Receipt Action | Click Print in modal | `window.print()` invoked | `window.print()` invoked | **PASS** | Headless DOM assertion (real PDF print dialogue unavailable in headless Chrome) |
| **PAY-NAV-01** | Invoice Navigation | Click "Open Invoice Page" in drawer | Switches tab & opens invoice details | Navigated to Invoicing & selected invoice opened | **PASS** | `pay_nav_invoice.png` |
| **PAY-NAV-02** | Order Navigation | Click "Open Order Drawer" in drawer | Opens order drawer | Synthetic invoice had no linked order ID | **NOT RUN** | Documented limitation |
| **DOC-01** | Native File Selection | Select local PDF file via `<input type="file">` | File name & size displayed | File name displayed in preview | **PASS** | `doc_file_selected.png` |
| **DOC-02** | Document Upload | Submit multipart form with PDF | HTTP 200, document saved | HTTP 200 returned | **PASS** | `doc_uploaded.png` |
| **DOC-03** | Document Persistence | Reload Documents workspace | Uploaded document in list | Document listed after refresh | **PASS** | `doc_persist.png` |
| **DOC-04** | Document Download | Fetch `/api/operations/documents/download?id=X` | Real PDF bytes returned (`%PDF`) | HTTP 200, `application/pdf`, head starts with `%PDF-1.4` | **PASS** | Network response & content-type |
| **LOAD-overview** | Route Smoke | Navigate to `/admin?tab=overview` | Renders cleanly | Text length 1872, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-orders** | Route Smoke | Navigate to `/admin?tab=orders` | Renders cleanly | Text length 2961, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-products** | Route Smoke | Navigate to `/admin?tab=products` | Renders cleanly | Text length 6009, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-ledger** | Route Smoke | Navigate to `/admin?tab=ledger` | Renders cleanly | Text length 3485, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-crm** | Route Smoke | Navigate to `/admin?tab=crm` | Renders cleanly | Text length 2952, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-enquiries** | Route Smoke | Navigate to `/admin?tab=enquiries` | Renders cleanly | Text length 1743, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-manufacturing**| Route Smoke | Navigate to `/admin?tab=manufacturing` | Renders cleanly | Text length 4480, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-services** | Route Smoke | Navigate to `/admin?tab=services` | Renders cleanly | Text length 1817, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-invoicing** | Route Smoke | Navigate to `/admin?tab=invoicing` | Renders cleanly | Text length 1950, 0 unhandled console errors | **PASS** | Browser check |
| **LOAD-hr** | Route Smoke | Navigate to `/admin?tab=hr` | Renders cleanly | Text length 2374, 0 unhandled console errors | **PASS** | Browser check |

---

## 2. Console Errors & Network Failures Analysis

During the second-pass E2E run, 3 console errors and 3 HTTP 4xx responses were logged:
1. `422 POST /api/operations/invoices`: Expected failure from **PAY-NEG-01** (overpayment rejection test).
2. `422 POST /api/operations/invoices`: Expected failure from **PAY-NEG-02** (duplicate UTR reference rejection test).
3. `400 POST /api/operations/invoices`: Expected failure from **PAY-NEG-03** (unsupported status `cancelled` test).

Zero unhandled frontend runtime exceptions (`TypeError`, `ReferenceError`, unhandled promise rejections) occurred across all 10 module route smoke tests.

---

## 3. Storage Architecture & Cloudflare R2 Disclosure

- **Document Storage**: Uploaded files currently write to local disk at `apps/backend/storage/documents/<category>/`.
- **Serverless / Vercel Limitation**: On ephemeral serverless platforms (e.g., Vercel), files written to local disk will not survive container restarts. For durable production multi-instance hosting, direct streaming to Cloudflare R2 (`kitchen-bots-media`) must be enabled via S3 client hooks.
- **Current Development State**: Local disk storage is 100% operational, delivering valid PDF bytes via `/api/operations/documents/download?id=X`.

---

## 4. Test Data Cleanup Audit

All synthetic mutation test records created during testing were tracked with the unique prefix `E2E-SYNTH-`:
- **Database Target**: Confirmed local test database `kitchen_bots_test` on `localhost:5432`.
- **Synthetic Records Cleaned**:
  - 4 `payment_transactions` rows deleted.
  - 4 `invoice_items` rows deleted.
  - 4 `invoices` rows deleted.
  - 4 `business_documents` rows and version records deleted.
  - 4 uploaded temporary PDF files removed from `apps/backend/storage/documents/warranty/`.
- **Zero Production or Real Business Records Affected**.
