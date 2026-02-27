import { createBrowserClient } from '@supabase/ssr'
import { LOCATIONS, MONTHS } from './constants'
import type { PLData, HeadcountData } from './analysis'
import { buildEmptyPL } from './analysis'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Save all P&L data for a given year
export async function savePLData(userId: string, year: number, plData: PLData): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const records: any[] = []
    const allEntities = [...(LOCATIONS as any), 'Corporate']

    allEntities.forEach((entity: string) => {
      const isLoc = entity !== 'Corporate'
      MONTHS.forEach(month => {
        records.push({
          user_id: userId,
          year,
          month,
          location: entity,
          entity_type: isLoc ? 'location' : 'corporate',
          revenue: isLoc ? (plData[entity]?.revenue[month] || 0) : 0,
          cogs: plData[entity]?.cogs[month] || {},
          expenses: plData[entity]?.expenses[month] || {},
          other_income: plData[entity]?.otherIncome[month] || 0,
          other_expense: plData[entity]?.otherExpense[month] || 0,
          updated_at: new Date().toISOString(),
        })
      })
    })

    const { error } = await supabase
      .from('pl_data')
      .upsert(records, { onConflict: 'user_id,year,month,location' })

    if (error) { console.error('Save error:', error); return false }
    return true
  } catch (e) {
    console.error('Save failed:', e)
    return false
  }
}

// Load P&L data for a given year
export async function loadPLData(userId: string, year: number): Promise<PLData | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('pl_data')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)

    if (error || !data || data.length === 0) return null

    const pl = buildEmptyPL()
    data.forEach((row: any) => {
      const entity = row.location
      const month = row.month
      if (pl[entity]) {
        if (row.entity_type === 'location') {
          pl[entity].revenue[month] = row.revenue || 0
        }
        pl[entity].cogs[month] = row.cogs || {}
        pl[entity].expenses[month] = row.expenses || {}
        pl[entity].otherIncome[month] = row.other_income || 0
        pl[entity].otherExpense[month] = row.other_expense || 0
      }
    })
    return pl
  } catch (e) {
    console.error('Load failed:', e)
    return null
  }
}

// Save headcount
export async function saveHeadcount(userId: string, year: number, headcount: HeadcountData): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const records = Object.entries(headcount).map(([loc, hc]) => ({
      user_id: userId,
      year,
      location: loc,
      pt: hc.PT || 0,
      pta: hc.PTA || 0,
      ot: hc.OT || 0,
      cota: hc.COTA || 0,
      tech: hc.TECH || 0,
      fd: hc.FD || 0,
    }))

    const { error } = await supabase
      .from('headcount')
      .upsert(records, { onConflict: 'user_id,year,location' })

    if (error) { console.error('Headcount save error:', error); return false }
    return true
  } catch (e) {
    console.error('Headcount save failed:', e)
    return false
  }
}

// Load headcount
export async function loadHeadcount(userId: string, year: number): Promise<HeadcountData | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('headcount')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)

    if (error || !data || data.length === 0) return null

    const hc: HeadcountData = {}
    data.forEach((row: any) => {
      hc[row.location] = {
        PT: row.pt || 0,
        PTA: row.pta || 0,
        OT: row.ot || 0,
        COTA: row.cota || 0,
        TECH: row.tech || 0,
        FD: row.fd || 0,
      }
    })
    return hc
  } catch (e) {
    console.error('Headcount load failed:', e)
    return null
  }
}
