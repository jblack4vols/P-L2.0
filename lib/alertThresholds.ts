import { createBrowserClient } from '@supabase/ssr'
import { LOCATIONS } from './constants'
import type { AnalysisResult } from './analysis'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type AlertConfig = {
  id: string
  user_id: string
  alert_name: string
  metric_type: string
  threshold_value: number
  comparison_op: 'lt' | 'gt' | 'lte' | 'gte'
  scope: 'all' | 'specific'
  location: string | null
  is_active: boolean
}

export type TriggeredAlert = {
  config: AlertConfig
  location: string
  actualValue: number
  message: string
}

const METRIC_FNS: Record<string, (r: any) => number> = {
  'GM%': r => r.gmPct,
  'NI% (Direct)': r => r.niPctD,
  'NI% (Allocated)': r => r.niPctA,
  'Revenue': r => r.revenue,
  'CM%': r => r.cmPct,
  'Rev/Clinician': r => r.revPerClin,
  'MoS% (Direct)': r => r.mosPctD,
  'MoS% (Allocated)': r => r.mosPctA,
}

export const METRIC_OPTIONS = Object.keys(METRIC_FNS)

const OP_LABELS: Record<string, string> = { lt: '<', gt: '>', lte: '≤', gte: '≥' }

export async function loadAlerts(userId: string): Promise<AlertConfig[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('threshold_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) { console.error('Load alerts error:', error); return [] }
    return (data || []) as AlertConfig[]
  } catch (e) { console.error('Load alerts failed:', e); return [] }
}

export async function saveAlert(alert: Partial<AlertConfig> & { user_id: string }): Promise<boolean> {
  try {
    const supabase = getSupabase()
    if (alert.id) {
      const { error } = await supabase.from('threshold_alerts').update(alert).eq('id', alert.id)
      if (error) return false
    } else {
      const { error } = await supabase.from('threshold_alerts').insert(alert)
      if (error) return false
    }
    return true
  } catch (e) { return false }
}

export async function deleteAlert(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('threshold_alerts').delete().eq('id', id)
    return !error
  } catch (e) { return false }
}

export function checkAlerts(alerts: AlertConfig[], analysis: AnalysisResult | null): TriggeredAlert[] {
  if (!analysis) return []
  const triggered: TriggeredAlert[] = []
  const locs = [...LOCATIONS] as string[]

  alerts.filter(a => a.is_active).forEach(config => {
    const fn = METRIC_FNS[config.metric_type]
    if (!fn) return

    const checkLocs = config.scope === 'specific' && config.location ? [config.location] : locs
    checkLocs.forEach(loc => {
      const r = analysis.results[loc]
      if (!r) return
      const val = fn(r)
      let tripped = false
      switch (config.comparison_op) {
        case 'lt': tripped = val < config.threshold_value; break
        case 'gt': tripped = val > config.threshold_value; break
        case 'lte': tripped = val <= config.threshold_value; break
        case 'gte': tripped = val >= config.threshold_value; break
      }
      if (tripped) {
        const isPct = config.metric_type.includes('%')
        const actual = isPct ? (val * 100).toFixed(1) + '%' : val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        const thresh = isPct ? (config.threshold_value * 100).toFixed(1) + '%' : config.threshold_value.toLocaleString()
        triggered.push({
          config,
          location: loc,
          actualValue: val,
          message: `${loc}: ${config.metric_type} is ${actual} (threshold: ${OP_LABELS[config.comparison_op]} ${thresh})`,
        })
      }
    })
  })

  return triggered
}
