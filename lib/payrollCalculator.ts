import { createBrowserClient } from '@supabase/ssr'
import { LOCATIONS } from './constants'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Employee = {
  id: string
  user_id: string
  name: string
  location: string
  department: string
  job_role: string
  hourly_rate: number
  salary_annual: number
  is_hourly: boolean
  status: 'active' | 'inactive'
  hire_date: string
}

export type PayrollHours = {
  employee_id: string
  month: string
  hours_worked: number
  overtime_hours: number
}

export type PayrollSummaryRow = {
  location: string
  totalEmployees: number
  totalRegularPay: number
  totalOvertimePay: number
  totalGrossPay: number
  estimatedTaxes: number
  totalLaborCost: number
}

const TAX_RATE = 0.22
const OT_MULTIPLIER = 1.5

// --- CRUD ---
export async function loadEmployees(userId: string): Promise<Employee[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (error) { console.error('Load employees error:', error); return [] }
    return (data || []) as Employee[]
  } catch (e) { console.error('Load employees failed:', e); return [] }
}

export async function saveEmployee(emp: Partial<Employee> & { user_id: string }): Promise<boolean> {
  try {
    const supabase = getSupabase()
    if (emp.id) {
      const { error } = await supabase.from('payroll_employees').update(emp).eq('id', emp.id)
      if (error) { console.error('Update employee error:', error); return false }
    } else {
      const { error } = await supabase.from('payroll_employees').insert(emp)
      if (error) { console.error('Insert employee error:', error); return false }
    }
    return true
  } catch (e) { console.error('Save employee failed:', e); return false }
}

export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('payroll_employees').delete().eq('id', id)
    if (error) { console.error('Delete employee error:', error); return false }
    return true
  } catch (e) { console.error('Delete employee failed:', e); return false }
}

// --- Hours ---
export async function loadPayrollHours(userId: string, year: number): Promise<PayrollHours[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('payroll_hours')
      .select('*, payroll_employees!inner(user_id)')
      .eq('payroll_employees.user_id', userId)
      .eq('year', year)
    if (error) { console.error('Load hours error:', error); return [] }
    return (data || []).map((d: any) => ({
      employee_id: d.employee_id,
      month: d.month,
      hours_worked: d.hours_worked,
      overtime_hours: d.overtime_hours,
    }))
  } catch (e) { console.error('Load hours failed:', e); return [] }
}

export async function savePayrollHours(employeeId: string, year: number, month: string, hours: number, ot: number): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('payroll_hours').upsert({
      employee_id: employeeId,
      year,
      month,
      hours_worked: hours,
      overtime_hours: ot,
    }, { onConflict: 'employee_id,year,month' })
    if (error) { console.error('Save hours error:', error); return false }
    return true
  } catch (e) { console.error('Save hours failed:', e); return false }
}

// --- Calculations ---
export function computePayrollSummary(
  employees: Employee[],
  hours: PayrollHours[],
  selectedMonths: string[]
): PayrollSummaryRow[] {
  const locs = [...LOCATIONS] as string[]
  return locs.map(loc => {
    const locEmps = employees.filter(e => e.location === loc && e.status === 'active')
    let totalReg = 0, totalOT = 0

    locEmps.forEach(emp => {
      const empHours = hours.filter(h => h.employee_id === emp.id && selectedMonths.includes(h.month))
      if (emp.is_hourly) {
        const reg = empHours.reduce((s, h) => s + h.hours_worked, 0)
        const ot = empHours.reduce((s, h) => s + h.overtime_hours, 0)
        totalReg += reg * emp.hourly_rate
        totalOT += ot * emp.hourly_rate * OT_MULTIPLIER
      } else {
        const monthlyPay = emp.salary_annual / 12
        totalReg += monthlyPay * selectedMonths.length
      }
    })

    const gross = totalReg + totalOT
    const taxes = gross * TAX_RATE
    return {
      location: loc,
      totalEmployees: locEmps.length,
      totalRegularPay: totalReg,
      totalOvertimePay: totalOT,
      totalGrossPay: gross,
      estimatedTaxes: taxes,
      totalLaborCost: gross + taxes,
    }
  })
}

// --- CSV Import ---
export function parseEmployeeCSV(csvText: string, userId: string): Partial<Employee>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const nameIdx = headers.findIndex(h => h.includes('name'))
  const locIdx = headers.findIndex(h => h.includes('location'))
  const deptIdx = headers.findIndex(h => h.includes('department') || h.includes('dept'))
  const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('title') || h.includes('position'))
  const rateIdx = headers.findIndex(h => h.includes('rate') || h.includes('hourly'))
  const salaryIdx = headers.findIndex(h => h.includes('salary') || h.includes('annual'))
  const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('hourly'))

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(',').map(c => c.trim())
    const isHourly = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase().includes('hourly') : (rateIdx >= 0 && parseFloat(cols[rateIdx]) > 0)
    return {
      user_id: userId,
      name: cols[nameIdx] || 'Unknown',
      location: cols[locIdx] || LOCATIONS[0],
      department: cols[deptIdx] || 'Clinical',
      job_role: cols[roleIdx] || 'Staff',
      hourly_rate: rateIdx >= 0 ? parseFloat(cols[rateIdx]) || 0 : 0,
      salary_annual: salaryIdx >= 0 ? parseFloat(cols[salaryIdx]) || 0 : 0,
      is_hourly: isHourly,
      status: 'active' as const,
      hire_date: new Date().toISOString().split('T')[0],
    }
  })
}
