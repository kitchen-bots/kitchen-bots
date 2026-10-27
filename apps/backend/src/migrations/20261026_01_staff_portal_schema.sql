-- Migration: 20261026_01_staff_portal_schema.sql
-- Description: Provision staff profiles, employee self-service portal, and operational tables.
-- Safety: Fully idempotent using CREATE TABLE IF NOT EXISTS, DO EXCEPTION blocks, and CREATE INDEX IF NOT EXISTS.
-- Preserves existing tables, constraints, records, and relationships.

BEGIN;

-- Preflight verification: users table must exist (Payload CMS core)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Preflight verification failed: "users" table does not exist.';
  END IF;
END $$;

-- Enums (Safe creation with exception handling)
DO $$ BEGIN
  CREATE TYPE "enum_employment_status" AS ENUM ('active', 'on_leave', 'probation', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "enum_attendance_status" AS ENUM ('present', 'absent', 'half_day', 'holiday', 'late', 'on_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "enum_leave_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Staff Profiles (Core extension linking user_id -> users.id)
CREATE TABLE IF NOT EXISTS "staff_profiles" (
  "id" text PRIMARY KEY,
  "user_id" integer UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
  "employee_id" text UNIQUE NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "department" text NOT NULL DEFAULT 'Engineering',
  "job_title" text NOT NULL DEFAULT 'Technician',
  "status" "enum_employment_status" DEFAULT 'active' NOT NULL,
  "employment_status" text DEFAULT 'active' NOT NULL,
  "employee_type" text DEFAULT 'full-time' NOT NULL,
  "date_of_joining" date DEFAULT CURRENT_DATE NOT NULL,
  "tags" text[] DEFAULT '{}',
  "address" jsonb DEFAULT '{}',
  "salary_details" jsonb DEFAULT '{}',
  "bank_details" jsonb DEFAULT '{}',
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_staff_profiles_user_id" ON "staff_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_staff_profiles_email" ON "staff_profiles"(LOWER(TRIM("email")));
CREATE INDEX IF NOT EXISTS "idx_staff_profiles_dept" ON "staff_profiles"("department");
CREATE INDEX IF NOT EXISTS "idx_staff_profiles_status" ON "staff_profiles"("status");

-- 2. Attendance Records, Breaks, and Corrections
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
CREATE INDEX IF NOT EXISTS "idx_attendance_staff_date" ON "attendance_records"("staff_id", "date");

CREATE TABLE IF NOT EXISTS "attendance_breaks" (
  "id" text PRIMARY KEY,
  "attendance_id" text NOT NULL REFERENCES "attendance_records"("id") ON DELETE CASCADE,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "duration_minutes" integer,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_attendance_breaks_att" ON "attendance_breaks"("attendance_id");

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
CREATE INDEX IF NOT EXISTS "idx_attendance_corrections_att" ON "attendance_corrections"("attendance_id");

-- 3. Production Task Allocations
CREATE TABLE IF NOT EXISTS "production_task_allocations" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE RESTRICT,
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "task_name" text NOT NULL,
  "stage" text NOT NULL CHECK ("stage" IN ('cad_prep', 'fabrication', 'electronics', 'qa', 'packaging')),
  "deadline" timestamp with time zone,
  "status" text DEFAULT 'assigned' NOT NULL CHECK ("status" IN ('assigned', 'in_progress', 'completed', 'blocked')),
  "blocker_reason" text,
  "completed_at" timestamp with time zone,
  "assigned_by" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_allocations_staff" ON "production_task_allocations"("staff_id");
CREATE INDEX IF NOT EXISTS "idx_allocations_order" ON "production_task_allocations"("order_id");

-- 4. Daily Work Logs
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
CREATE INDEX IF NOT EXISTS "idx_work_logs_order" ON "daily_work_logs"("order_id");

-- 5. Leave Requests
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
CREATE INDEX IF NOT EXISTS "idx_leave_staff" ON "leave_requests"("staff_id");
CREATE INDEX IF NOT EXISTS "idx_leave_status" ON "leave_requests"("status");

-- 6. HR Expenses
CREATE TABLE IF NOT EXISTS "hr_expenses" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "category" text NOT NULL DEFAULT 'travel',
  "amount" numeric(10,2) NOT NULL,
  "expense_date" date NOT NULL,
  "receipt_url" text,
  "notes" text,
  "status" text DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'approved', 'rejected', 'reimbursed')),
  "approved_by" text,
  "decision_notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_hr_expenses_staff" ON "hr_expenses"("staff_id");
CREATE INDEX IF NOT EXISTS "idx_hr_expenses_status" ON "hr_expenses"("status");

-- 7. HR Payslips
CREATE TABLE IF NOT EXISTS "hr_payslips" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "month_year" text NOT NULL,
  "gross_paise" bigint NOT NULL,
  "net_paise" bigint NOT NULL,
  "document_url" text NOT NULL,
  "issued_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_staff_payslip_month" UNIQUE ("staff_id", "month_year")
);
CREATE INDEX IF NOT EXISTS "idx_hr_payslips_staff" ON "hr_payslips"("staff_id");

-- 8. Employee Helpdesk Tickets & Messages
CREATE TABLE IF NOT EXISTS "employee_tickets" (
  "id" text PRIMARY KEY,
  "staff_id" text NOT NULL REFERENCES "staff_profiles"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "category" text NOT NULL DEFAULT 'general',
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'in_progress', 'resolved', 'closed')),
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_tickets_staff" ON "employee_tickets"("staff_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "employee_tickets"("status");

CREATE TABLE IF NOT EXISTS "employee_ticket_messages" (
  "id" text PRIMARY KEY,
  "ticket_id" text NOT NULL REFERENCES "employee_tickets"("id") ON DELETE CASCADE,
  "sender_role" text NOT NULL,
  "sender_name" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_ticket" ON "employee_ticket_messages"("ticket_id");

-- 9. Secure Attachments
CREATE TABLE IF NOT EXISTS "secure_attachments" (
  "id" text PRIMARY KEY,
  "original_filename" text NOT NULL,
  "stored_filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "uploaded_by_user_id" text NOT NULL,
  "uploaded_by_staff_id" text REFERENCES "staff_profiles"("id") ON DELETE SET NULL,
  "category" text NOT NULL CHECK ("category" IN ('receipt', 'ticket', 'payslip', 'task')),
  "reference_id" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_attachments_staff" ON "secure_attachments"("uploaded_by_staff_id");

-- 10. Services: Warranty, Repair & Support Cases
CREATE TABLE IF NOT EXISTS "service_cases" (
  "id" serial PRIMARY KEY,
  "reference" varchar(64) UNIQUE NOT NULL,
  "type" varchar(32) NOT NULL,
  "customer_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "customer_name" varchar(128) NOT NULL,
  "customer_email" varchar(128) NOT NULL,
  "customer_phone" varchar(32),
  "company_name" varchar(128),
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "product_name" varchar(128),
  "product_sku" varchar(64),
  "serial_number" varchar(64),
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "order_reference" varchar(64),
  "purchase_date" timestamp with time zone,
  "warranty_start_date" timestamp with time zone,
  "warranty_expiry_date" timestamp with time zone,
  "warranty_status" varchar(32) DEFAULT 'unverified',
  "subject" varchar(256) NOT NULL,
  "category" varchar(64) DEFAULT 'General',
  "description" text NOT NULL,
  "status" varchar(32) DEFAULT 'new' NOT NULL,
  "priority" varchar(32) DEFAULT 'normal' NOT NULL,
  "assigned_to" varchar(128),
  "assigned_technician" varchar(128),
  "due_date" timestamp with time zone,
  "resolution_summary" text,
  "resolved_at" timestamp with time zone,
  "resolved_by" varchar(128),
  "warranty_decision" varchar(32),
  "warranty_decision_reason" text,
  "warranty_decision_by" varchar(128),
  "warranty_decision_at" timestamp with time zone,
  "approved_resolution" varchar(64),
  "repair_stage" varchar(64),
  "diagnosed_fault" text,
  "probable_cause" text,
  "parts_estimate_paise" bigint DEFAULT 0,
  "labour_estimate_paise" bigint DEFAULT 0,
  "total_estimate_paise" bigint DEFAULT 0,
  "customer_approved" boolean DEFAULT false,
  "customer_approved_at" timestamp with time zone,
  "quality_checked" boolean DEFAULT false,
  "quality_checked_by" varchar(128),
  "quality_checked_at" timestamp with time zone,
  "quality_check_notes" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_service_cases_type" ON "service_cases"("type");
CREATE INDEX IF NOT EXISTS "idx_service_cases_status" ON "service_cases"("status");
CREATE INDEX IF NOT EXISTS "idx_service_cases_ref" ON "service_cases"("reference");

CREATE TABLE IF NOT EXISTS "service_activities" (
  "id" serial PRIMARY KEY,
  "service_id" integer NOT NULL REFERENCES "service_cases"("id") ON DELETE CASCADE,
  "type" varchar(32) NOT NULL,
  "title" varchar(128) NOT NULL,
  "content" text NOT NULL,
  "author" varchar(128) NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_service_activities_service" ON "service_activities"("service_id");

CREATE TABLE IF NOT EXISTS "service_parts" (
  "id" serial PRIMARY KEY,
  "service_id" integer NOT NULL REFERENCES "service_cases"("id") ON DELETE CASCADE,
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "part_sku" varchar(64),
  "part_name" varchar(128) NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_price_paise" bigint DEFAULT 0 NOT NULL,
  "status" varchar(32) DEFAULT 'needed' NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_service_parts_service" ON "service_parts"("service_id");

COMMIT;
