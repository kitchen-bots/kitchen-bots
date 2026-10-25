-- ==============================================================================
-- KITCHEN BOTS OPERATIONS PLATFORM: SCHEMA ENHANCEMENTS
-- Modules: Inventory Movements, Invoicing & Payments, HR Staff & Production Allocation
-- STATUS: DRAFT FOR REVIEW (NOT EXECUTED AGAINST SUPABASE PRODUCTION)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. INVENTORY LEDGER & STOCK MOVEMENTS
-- ------------------------------------------------------------------------------

-- Movement Type Enum
DO $$ BEGIN
  CREATE TYPE "enum_stock_movement_type" AS ENUM (
    'receipt',       -- Supplier delivery / inward stock
    'reservation',   -- Committed to approved commercial order
    'release',       -- De-allocated on order cancel/amendment
    'deduction',     -- Dispatched/shipped out
    'adjustment',    -- Periodic physical audit reconciliation
    'defect_scrap'   -- Scrapped during manufacturing QA
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" text PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "sku" text NOT NULL,
  "movement_type" "enum_stock_movement_type" NOT NULL,
  "quantity" integer NOT NULL CHECK ("quantity" > 0),
  "reference_type" text CHECK ("reference_type" IN ('order', 'supplier_po', 'cycle_count', 'qa_inspection')),
  "reference_id" text,
  "notes" text,
  "performed_by" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_stock_movements_product_sku" ON "stock_movements"("product_id", "sku");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_ref" ON "stock_movements"("reference_type", "reference_id");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_created_at" ON "stock_movements"("created_at" DESC);


-- ------------------------------------------------------------------------------
-- 2. INVOICE BUILDER & PAYMENT TRANSACTIONS
-- ------------------------------------------------------------------------------

-- Invoice Status Enum
DO $$ BEGIN
  CREATE TYPE "enum_invoice_status" AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment Method Enum
DO $$ BEGIN
  CREATE TYPE "enum_payment_method" AS ENUM ('bank_neft', 'upi', 'card', 'cheque', 'cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY,
  "invoice_number" text UNIQUE NOT NULL,
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "billing_address" jsonb NOT NULL,
  "subtotal_paise" numeric NOT NULL CHECK ("subtotal_paise" >= 0),
  "tax_gst_paise" numeric NOT NULL CHECK ("tax_gst_paise" >= 0),
  "total_paise" numeric NOT NULL CHECK ("total_paise" >= 0),
  "paid_paise" numeric DEFAULT 0 NOT NULL CHECK ("paid_paise" >= 0),
  "balance_due_paise" numeric NOT NULL CHECK ("balance_due_paise" >= 0),
  "status" "enum_invoice_status" DEFAULT 'draft' NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "issued_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" text PRIMARY KEY,
  "invoice_id" text NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "sku" text,
  "hsn_code" text DEFAULT '8438', -- Machinery for industrial preparation/manufacture of food
  "quantity" integer NOT NULL CHECK ("quantity" > 0),
  "unit_price_paise" numeric NOT NULL CHECK ("unit_price_paise" >= 0),
  "total_paise" numeric NOT NULL CHECK ("total_paise" >= 0)
);

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" text PRIMARY KEY,
  "invoice_id" text NOT NULL REFERENCES "invoices"("id") ON DELETE RESTRICT,
  "amount_paise" numeric NOT NULL CHECK ("amount_paise" > 0),
  "payment_method" "enum_payment_method" NOT NULL,
  "transaction_reference" text NOT NULL, -- UTR or Bank Slip Ref
  "status" text DEFAULT 'success' NOT NULL CHECK ("status" IN ('pending', 'success', 'failed')),
  "recorded_by" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_payment_txn_ref" UNIQUE ("transaction_reference", "payment_method")
);

CREATE INDEX IF NOT EXISTS "idx_invoices_order" ON "invoices"("order_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice" ON "invoice_items"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_payment_txns_invoice" ON "payment_transactions"("invoice_id");


-- ------------------------------------------------------------------------------
-- 3. HR MANAGEMENT: STAFF, ATTENDANCE, LEAVE & PRODUCTION ALLOCATION
-- ------------------------------------------------------------------------------

-- Employment Status Enum
DO $$ BEGIN
  CREATE TYPE "enum_employment_status" AS ENUM ('active', 'on_leave', 'probation', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Attendance Status Enum
DO $$ BEGIN
  CREATE TYPE "enum_attendance_status" AS ENUM ('present', 'absent', 'half_day', 'holiday');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Leave Status Enum
DO $$ BEGIN
  CREATE TYPE "enum_leave_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "staff_profiles" (
  "id" text PRIMARY KEY,
  "user_id" integer UNIQUE REFERENCES "users"("id") ON DELETE SET NULL, -- Extends existing auth accounts
  "employee_id" text UNIQUE NOT NULL, -- e.g. KB-EMP-0104
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "department" text NOT NULL, -- Fabrication, Assembly, QA, Logistics, Sales, Admin
  "job_title" text NOT NULL,
  "status" "enum_employment_status" DEFAULT 'active' NOT NULL,
  "date_of_joining" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "check_in" timestamp with time zone,
  "check_out" timestamp with time zone,
  "working_hours" numeric(4,2),
  "status" "enum_attendance_status" DEFAULT 'present' NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_staff_attendance_day" UNIQUE ("staff_id", "date")
);

CREATE TABLE IF NOT EXISTS "leave_requests" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "leave_type" text NOT NULL CHECK ("leave_type" IN ('casual', 'sick', 'earned', 'unpaid')),
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "reason" text NOT NULL,
  "status" "enum_leave_status" DEFAULT 'pending' NOT NULL,
  "approved_by" text,
  "decision_notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

-- Team Assignments to Manufacturing Work Orders & Tasks
CREATE TABLE IF NOT EXISTS "production_task_allocations" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE RESTRICT,
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "task_name" text NOT NULL, -- e.g. "Kinematics Wiring & Calibration", "CNC Milling Chassis"
  "stage" text NOT NULL,     -- 'cad_prep', 'fabrication', 'electronics', 'qa', 'packaging'
  "deadline" timestamp with time zone,
  "status" text DEFAULT 'in_progress' NOT NULL CHECK ("status" IN ('assigned', 'in_progress', 'completed', 'blocked')),
  "blocker_reason" text,
  "completed_at" timestamp with time zone,
  "assigned_by" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_attendance_staff_date" ON "attendance_records"("staff_id", "date");
CREATE INDEX IF NOT EXISTS "idx_leave_staff" ON "leave_requests"("staff_id");
CREATE INDEX IF NOT EXISTS "idx_allocations_order" ON "production_task_allocations"("order_id");
CREATE INDEX IF NOT EXISTS "idx_allocations_staff" ON "production_task_allocations"("staff_id");

-- 4. HR ATTENDANCE ENHANCEMENTS & DAILY WORK LOGS
DO $$ BEGIN
  ALTER TYPE "enum_attendance_status" ADD VALUE IF NOT EXISTS 'late';
  ALTER TYPE "enum_attendance_status" ADD VALUE IF NOT EXISTS 'on_leave';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "attendance_breaks" (
  "id" text PRIMARY KEY,
  "attendance_id" text NOT NULL REFERENCES "attendance_records"("id") ON DELETE CASCADE,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "duration_minutes" integer,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "attendance_corrections" (
  "id" text PRIMARY KEY,
  "attendance_id" text NOT NULL REFERENCES "attendance_records"("id") ON DELETE CASCADE,
  "original_check_in" timestamp with time zone,
  "original_check_out" timestamp with time zone,
  "corrected_check_in" timestamp with time zone,
  "corrected_check_out" timestamp with time zone,
  "reason" text NOT NULL,
  "requested_by" text NOT NULL,
  "approved_by" text,
  "status" text DEFAULT 'approved' NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "daily_work_logs" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "task_description" text NOT NULL,
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "task_allocation_id" text REFERENCES "production_task_allocations"("id") ON DELETE SET NULL,
  "time_spent_minutes" integer NOT NULL CHECK ("time_spent_minutes" > 0),
  "completed_work" text,
  "pending_work" text,
  "blockers" text,
  "status" text DEFAULT 'submitted' NOT NULL CHECK ("status" IN ('draft', 'submitted', 'approved', 'returned')),
  "reviewed_by" text,
  "review_notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_work_logs_staff_date" ON "daily_work_logs"("staff_id", "date");
-- ------------------------------------------------------------------------------
-- 5. ORDER WORKSPACE: DIAGNOSTIC BLOCKERS & AUDITED CANCELLATIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "order_blockers" (
  "id" text PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "reason" text NOT NULL,
  "diagnostic_details" text,
  "responsible_team" text,
  "next_action" text,
  "status" text DEFAULT 'open' NOT NULL CHECK ("status" IN ('open', 'resolved', 'dismissed')),
  "resolution_notes" text,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_cancellations" (
  "id" text PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "reason_category" text NOT NULL,
  "reason_explanation" text,
  "actor_category" text NOT NULL CHECK ("actor_category" IN ('customer', 'administrator', 'system_automation', 'external_integration')),
  "actor_identity" text,
  "previous_status" text,
  "refund_status" text,
  "restock_status" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_order_blockers_order" ON "order_blockers"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_cancellations_order" ON "order_cancellations"("order_id");

COMMIT;
