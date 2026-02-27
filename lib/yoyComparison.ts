import { LOCATIONS } from './constants'
import type { AnalysisResult, LocationResult } from './analysis'

export type YoYRow = {
  location: string
  metric: string
  prior: number
  current: number
  change: number
  changePct: number
}

export function computeYoY(currentAnalysis: AnalysisResult | null, priorAnalysis: AnalysisResult | null): YoYRow[] {
  if (!currentAnalysis || !priorAnalysis) return []
  const rows: YoYRow[] = []
  const locs = [...LOCATIONS] as string[]

  const metrics: [string, (r: LocationResult) => number][] = [
    ['Revenue', r => r.revenue],
    ['Gross Profit', r => r.gpD],
    ['GM%', r => r.gmPct],
    ['Net Income', r => r.niD],
    ['NI%', r => r.niPctD],
    ['Rev/Clinician', r => r.revPerClin],
  ]

  locs.forEach(loc => {
    const cur = currentAnalysis.results[loc]
    const pri = priorAnalysis.results[loc]
    if (!cur || !pri) return

    metrics.forEach(([name, fn]) => {
      const c = fn(cur)
      const p = fn(pri)
      rows.push({
        location: loc,
        metric: name,
        prior: p,
        current: c,
        change: c - p,
        changePct: p !== 0 ? (c - p) / Math.abs(p) : 0,
      })
    })
  })

  return rows
}
