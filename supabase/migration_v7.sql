-- TriStar PT P&L Analyzer — V7 Migration
-- Run this in Supabase SQL Editor to add the new feature tables.
-- Safe to run multiple times (IF NOT EXISTS).

-- Audit Log
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

-- Annual Budgets
CREATE TABLE IF NOT EXISTS annual_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  budget_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Payroll Employees
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

-- Payroll Hours
CREATE TABLE IF NOT EXISTS payroll_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES payroll_employees(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month text NOT NULL,
  hours_worked numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  UNIQUE(employee_id, year, month)
);

-- Threshold Alerts
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

-- What-If Scenarios
CREATE TABLE IF NOT EXISTS what_if_scenarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  year integer NOT NULL,
  adjustments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own audit_log" ON audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit_log" ON audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets" ON annual_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON annual_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON annual_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON annual_budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own employees" ON payroll_employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON payroll_employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON payroll_employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON payroll_employees FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payroll_hours" ON payroll_hours FOR SELECT
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own payroll_hours" ON payroll_hours FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own payroll_hours" ON payroll_hours FOR UPDATE
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own payroll_hours" ON payroll_hours FOR DELETE
  USING (employee_id IN (SELECT id FROM payroll_employees WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own alerts" ON threshold_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON threshold_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON threshold_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON threshold_alerts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scenarios" ON what_if_scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenarios" ON what_if_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON what_if_scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON what_if_scenarios FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_year ON annual_budgets(user_id, year);
CREATE INDEX IF NOT EXISTS idx_employees_user ON payroll_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hours_employee ON payroll_hours(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON threshold_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_year ON what_if_scenarios(user_id, year);
