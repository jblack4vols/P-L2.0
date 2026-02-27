-- TriStar PT P&L Analyzer - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- NOTE: Run only the NEW tables if you already have pl_data and headcount.

-- 1. P&L Data Table
CREATE TABLE IF NOT EXISTS pl_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month text NOT NULL,
  location text NOT NULL,
  entity_type text NOT NULL DEFAULT 'location',
  revenue numeric DEFAULT 0,
  cogs jsonb DEFAULT '{}'::jsonb,
  expenses jsonb DEFAULT '{}'::jsonb,
  other_income numeric DEFAULT 0,
  other_expense numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month, location)
);

-- 2. Headcount Table
CREATE TABLE IF NOT EXISTS headcount (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  location text NOT NULL,
  pt integer DEFAULT 0,
  pta integer DEFAULT 0,
  ot integer DEFAULT 0,
  cota integer DEFAULT 0,
  tech integer DEFAULT 0,
  fd integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, location)
);

-- 3. Audit Log Table (NEW)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  year integer,
  location text,
  change_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 4. Annual Budgets Table (NEW)
CREATE TABLE IF NOT EXISTS annual_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  budget_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- 5. Payroll Employees Table (NEW)
CREATE TABLE IF NOT EXISTS payroll_employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  department text DEFAULT 'Clinical',
  job_role text DEFAULT '',
  hourly_rate numeric DEFAULT 0,
  salary_annual numeric DEFAULT 0,
  is_hourly boolean DEFAULT true,
  status text DEFAULT 'active',
  hire_date date,
  created_at timestamptz DEFAULT now()
);

-- 6. Payroll Hours Table (NEW)
CREATE TABLE IF NOT EXISTS payroll_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES payroll_employees(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month text NOT NULL,
  hours_worked numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  UNIQUE(employee_id, year, month)
);

-- 7. Threshold Alerts Table (NEW)
CREATE TABLE IF NOT EXISTS threshold_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_name text NOT NULL,
  metric_type text NOT NULL,
  threshold_value numeric NOT NULL,
  comparison_op text NOT NULL DEFAULT 'lt',
  scope text DEFAULT 'all',
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. What-If Scenarios Table (NEW)
CREATE TABLE IF NOT EXISTS what_if_scenarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  year integer NOT NULL,
  adjustments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ══════════════════════════════════════════════════

ALTER TABLE pl_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;

-- pl_data policies
CREATE POLICY "Users can view own pl_data" ON pl_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pl_data" ON pl_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pl_data" ON pl_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pl_data" ON pl_data FOR DELETE USING (auth.uid() = user_id);

-- headcount policies
CREATE POLICY "Users can view own headcount" ON headcount FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own headcount" ON headcount FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own headcount" ON headcount FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own headcount" ON headcount FOR DELETE USING (auth.uid() = user_id);

-- audit_log policies
CREATE POLICY "Users can view own audit_log" ON audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit_log" ON audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- annual_budgets policies
CREATE POLICY "Users can view own budgets" ON annual_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON annual_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON annual_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON annual_budgets FOR DELETE USING (auth.uid() = user_id);

-- payroll_employees policies
CREATE POLICY "Users can view own employees" ON payroll_employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON payroll_employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON payroll_employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON payroll_employees FOR DELETE USING (auth.uid() = user_id);

-- payroll_hours policies (via employee ownership)
CREATE POLICY "Users can view own payroll_hours" ON payroll_hours FOR SELECT
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own payroll_hours" ON payroll_hours FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own payroll_hours" ON payroll_hours FOR UPDATE
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own payroll_hours" ON payroll_hours FOR DELETE
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));

-- threshold_alerts policies
CREATE POLICY "Users can view own alerts" ON threshold_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON threshold_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON threshold_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON threshold_alerts FOR DELETE USING (auth.uid() = user_id);

-- what_if_scenarios policies
CREATE POLICY "Users can view own scenarios" ON what_if_scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenarios" ON what_if_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON what_if_scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON what_if_scenarios FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_pl_data_user_year ON pl_data(user_id, year);
CREATE INDEX IF NOT EXISTS idx_headcount_user_year ON headcount(user_id, year);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_year ON annual_budgets(user_id, year);
CREATE INDEX IF NOT EXISTS idx_employees_user ON payroll_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hours_employee ON payroll_hours(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON threshold_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_year ON what_if_scenarios(user_id, year);
