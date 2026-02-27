import { createBrowserClient } from '@supabase/ssr'
import { LOCATIONS, MONTHS } from './constants'
import type { PLData } from './analysis'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type BudgetData = Record<string, { revenue: Record<string, number>; cogs: Record<string, number>; expenses: Record<string, number> }>

export type VarianceRow = {
  location: string
  metric: string
  budget: number
  actual: number
  variance: number
  variancePct: number
}

export function buildEmptyBudget(): BudgetData {
  const b: BudgetData = {}
  ;[...LOCATIONS, 'Corporate'].forEach(loc => {
    b[loc] = { revenue: {}, cogs: {}, expenses: {} }
    MONTHS.forEach(m => { b[loc].revenue[m] = 0; b[loc].cogs[m] = 0; b[loc].expenses[m] = 0 })
  })
  return b
}

export async function saveBudget(userId: string, year: number, budget: BudgetData): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('annual_budgets').upsert({
      user_id: userId,
      year,
      budget_data: budget,
    }, { onConflict: 'user_id,year' })
    if (error) { console.error('Budget save error:', error); return false }
    return true
  } catch (e) { console.error('Budget save failed:', e); return false }
}

export async function loadBudget(userId: string, year: number): Promise<BudgetData | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('annual_budgets')
      .select('budget_data')
      .eq('user_id', userId)
      .eq('year', year)
      .maybeSingle()
    if (error || !data) return null
    return data.budget_data as BudgetData
  } catch (e) { console.error('Budget load failed:', e); return null }
}

export function computeVariance(plData: PLData, budget: BudgetData, selectedMonths: string[]): VarianceRow[] {
  const rows: VarianceRow[] = []
  const locs = [...LOCATIONS] as string[]

  locs.forEach(loc => {
    const actRev = selectedMonths.reduce((s, m) => s + (plData[loc]?.revenue?.[m] ?? 0), 0)
    const budRev = selectedMonths.reduce((s, m) => s + (budget[loc]?.revenue?.[m] ?? 0), 0)
    rows.push({
      location: loc, metric: 'Revenue', budget: budRev, actual: actRev,
      variance: actRev - budRev, variancePct: budRev ? (actRev - budRev) / budRev : 0,
    })

    const actCogs = selectedMonths.reduce((s, m) => {
      const cats = plData[loc]?.cogs?.[m] ?? {}
      return s + Object.values(cats).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
    }, 0)
    const budCogs = selectedMonths.reduce((s, m) => s + (budget[loc]?.cogs?.[m] ?? 0), 0)
    rows.push({
      location: loc, metric: 'COGS', budget: budCogs, actual: actCogs,
      variance: actCogs - budCogs, variancePct: budCogs ? (actCogs - budCogs) / budCogs : 0,
    })

    const actExp = selectedMonths.reduce((s, m) => {
      const cats = plData[loc]?.expenses?.[m] ?? {}
      return s + Object.values(cats).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
    }, 0)
    const budExp = selectedMonths.reduce((s, m) => s + (budget[loc]?.expenses?.[m] ?? 0), 0)
    rows.push({
      location: loc, metric: 'Expenses', budget: budExp, actual: actExp,
      variance: actExp - budExp, variancePct: budExp ? (actExp - budExp) / budExp : 0,
    })
  })
  return rows
}
