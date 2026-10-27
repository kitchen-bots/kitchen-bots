-- Verification Script: verify_staff_portal_schema.sql
-- Description: Comprehensive read-only audit of all 15 operational tables + core users table,
-- checking table existence, primary keys, foreign keys, and indexes.
-- Execution: Safe to run anytime. No writes, locks, or side effects.

-- 1. Table Existence Check (16 tables: 1 core prerequisite + 15 operational)
SELECT
  t.table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS table_status
FROM (
  VALUES
    ('users'),
    ('staff_profiles'),
    ('attendance_records'),
    ('attendance_breaks'),
    ('attendance_corrections'),
    ('production_task_allocations'),
    ('daily_work_logs'),
    ('leave_requests'),
    ('hr_expenses'),
    ('hr_payslips'),
    ('employee_tickets'),
    ('employee_ticket_messages'),
    ('secure_attachments'),
    ('service_cases'),
    ('service_activities'),
    ('service_parts')
) AS t(table_name)
ORDER BY t.table_name;

-- 2. Foreign Key References Check
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'staff_profiles', 'attendance_records', 'attendance_breaks', 'attendance_corrections',
    'production_task_allocations', 'daily_work_logs', 'leave_requests', 'hr_expenses',
    'hr_payslips', 'employee_tickets', 'employee_ticket_messages', 'secure_attachments',
    'service_cases', 'service_activities', 'service_parts'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 3. Operational Indexes Check
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'staff_profiles', 'attendance_records', 'attendance_breaks', 'attendance_corrections',
    'production_task_allocations', 'daily_work_logs', 'leave_requests', 'hr_expenses',
    'hr_payslips', 'employee_tickets', 'employee_ticket_messages', 'secure_attachments',
    'service_cases', 'service_activities', 'service_parts'
  )
ORDER BY tablename, indexname;
