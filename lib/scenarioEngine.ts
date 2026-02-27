import { createBrowserClient } from '@supabase/ssr'
import { LOCATIONS, MONTHS } from './constants'
import { runAnalysis, type PLData, type AnalysisResult, type HeadcountData } from './analysis'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Scenario = {
  id: string
  user_id: string
  name: string
  year: number
  adjustments: ScenarioAdjustment[]
  created_at: string
}

export type ScenarioAdjustment = {
  location: string | 'all'
  metric: 'revenue' | 'cogs' | 'expenses'
  adjust_type: 'pct' | 'flat'
  value: number
}

export async function loadScenarios(userId: string, year: number): Promise<Scenario[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('what_if_scenarios')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data || []) as Scenario[]
  } catch (e) { return [] }
}

export async function saveScenario(scenario: Partial<Scenario> & { user_id: string }): Promise<boolean> {
  try {
    const supabase = getSupabase()
    if (scenario.id) {
      const { error } = await supabase.from('what_if_scenarios').update({
        name: scenario.name,
        adjustments: scenario.adjustments,
      }).eq('id', scenario.id)
      return !error
    } else {
      const { error } = await supabase.from('what_if_scenarios').insert(scenario)
      return !error
    }
  } catch (e) { return false }
}

export async function deleteScenario(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('what_if_scenarios').delete().eq('id', id)
    return !error
  } catch (e) { return false }
}

export function applyScenario(
  basePL: PLData,
  headcount: HeadcountData,
  adjustments: ScenarioAdjustment[],
  selectedMonths: string[]
): AnalysisResult {
  // Deep clone
  const pl = JSON.parse(JSON.stringify(basePL)) as PLData
  const locs = [...LOCATIONS] as string[]

  adjustments.forEach(adj => {
    const targetLocs = adj.location === 'all' ? locs : [adj.location]
    targetLocs.forEach(loc => {
      if (!pl[loc]) return
      MONTHS.forEach(m => {
        if (adj.metric === 'revenue') {
          const cur = pl[loc].revenue?.[m] ?? 0
          pl[loc].revenue[m] = adj.adjust_type === 'pct' ? cur * (1 + adj.value / 100) : cur + adj.value
        } else if (adj.metric === 'cogs') {
          const cats = pl[loc].cogs?.[m] ?? {}
          Object.keys(cats).forEach(cat => {
            const cur = cats[cat] ?? 0
            cats[cat] = adj.adjust_type === 'pct' ? cur * (1 + adj.value / 100) : cur + adj.value / Object.keys(cats).length
          })
          pl[loc].cogs[m] = cats
        } else if (adj.metric === 'expenses') {
          const cats = pl[loc].expenses?.[m] ?? {}
          Object.keys(cats).forEach(cat => {
            const cur = cats[cat] ?? 0
            cats[cat] = adj.adjust_type === 'pct' ? cur * (1 + adj.value / 100) : cur + adj.value / Object.keys(cats).length
          })
          pl[loc].expenses[m] = cats
        }
      })
    })
  })

  return runAnalysis(pl, headcount, selectedMonths)
}
