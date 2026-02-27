import { LOCATIONS, MONTHS, COGS_CATEGORIES, EXPENSE_CATEGORIES } from './constants'
import { fmt, pct } from './analysis'
import type { PLData, AnalysisResult, LocationResult } from './analysis'

declare global {
  interface Window { XLSX: any }
}

function getXLSX() {
  if (typeof window !== 'undefined' && window.XLSX) return window.XLSX
  throw new Error('SheetJS library not loaded. Please refresh the page.')
}

type ExportOptions = {
  year: number
  selectedMonths: string[]
  plData: PLData
  analysis: AnalysisResult | null
  headcount: Record<string, Record<string, number>>
}

export function exportToExcel(opts: ExportOptions) {
  const XLSX = getXLSX()
  const wb = XLSX.utils.book_new()
  const { year, selectedMonths, plData, analysis, headcount } = opts
  const locs = [...LOCATIONS] as string[]
  const monthLabel = selectedMonths.length === 12 ? 'Full Year' : selectedMonths.join(', ')

  // ── Sheet 1: Summary Table ──
  if (analysis) {
    const summaryRows: any[][] = [
      ['TriStar Physical Therapy — P&L Summary'],
      [`Year: ${year}`, `Months: ${monthLabel}`],
      [],
      ['Metric', ...locs],
    ]
    const metrics: [string, (r: LocationResult) => string][] = [
      ['Revenue', r => fmt(r.revenue)],
      ['Revenue Share', r => pct(r.revShare)],
      ['COGS (Direct)', r => fmt(r.cogsD)],
      ['COGS (Allocated)', r => fmt(r.cogsAlloc)],
      ['Gross Profit (Direct)', r => fmt(r.gpD)],
      ['Gross Profit (Allocated)', r => fmt(r.gpA)],
      ['GM%', r => pct(r.gmPct)],
      ['OpEx (Direct)', r => fmt(r.expD)],
      ['OpEx (Allocated)', r => fmt(r.expAlloc)],
      ['Net Income (Direct)', r => fmt(r.niD)],
      ['Net Income (Allocated)', r => fmt(r.niA)],
      ['NI% (Direct)', r => pct(r.niPctD)],
      ['NI% (Allocated)', r => pct(r.niPctA)],
    ]
    metrics.forEach(([label, fn]) => {
      summaryRows.push([label, ...locs.map(l => fn(analysis.results[l]))])
    })
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)
    ws1['!cols'] = [{ wch: 22 }, ...locs.map(() => ({ wch: 16 }))]
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
  }

  // ── Sheet 2: Scorecard Rankings ──
  if (analysis) {
    const { results, rankings, composite, sortedLocs } = analysis
    const scoreRows: any[][] = [
      ['TriStar PT — Scorecard Rankings'],
      [`Year: ${year}`, `Months: ${monthLabel}`],
      [],
      ['Rank', 'Location', 'Grade', 'Composite', 'Revenue', 'GM%', 'NI%', 'CM%', 'Rev/Clin', 'NI/Clin', 'MoS%'],
    ]
    sortedLocs.forEach((loc, idx) => {
      const r = results[loc]
      const rk = rankings[loc]
      const g = composite[loc]
      const numLocs = locs.length
      const p = g / numLocs
      const grade = p <= 0.25 ? 'A' : p <= 0.5 ? 'B' : p <= 0.75 ? 'C' : 'D'
      scoreRows.push([
        idx + 1, loc, grade, g.toFixed(1),
        rk.revenue, rk.gmPct, rk.niPctD, rk.cmPct,
        rk.revPerClin, rk.niPerClinD, rk.mosPctA,
      ])
    })
    const ws2 = XLSX.utils.aoa_to_sheet(scoreRows)
    ws2['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 10 }, ...Array(7).fill({ wch: 10 })]
    XLSX.utils.book_append_sheet(wb, ws2, 'Scorecard')
  }

  // ── Sheet 3: Break-Even Analysis ──
  if (analysis) {
    const beRows: any[][] = [
      ['TriStar PT — Break-Even Analysis'],
      [`Year: ${year}`, `Months: ${monthLabel}`],
      [],
      ['Location', 'Revenue', 'CM', 'CM%', 'BE (Direct)', 'MoS (Direct)', 'BE (Allocated)', 'MoS (Allocated)'],
    ]
    locs.forEach(loc => {
      const r = analysis.results[loc]
      beRows.push([
        loc, fmt(r.revenue), fmt(r.cm), pct(r.cmPct),
        fmt(r.beD), fmt(r.mosD), fmt(r.beA), fmt(r.mosA),
      ])
    })
    const ws3 = XLSX.utils.aoa_to_sheet(beRows)
    ws3['!cols'] = [{ wch: 16 }, ...Array(7).fill({ wch: 16 })]
    XLSX.utils.book_append_sheet(wb, ws3, 'Break-Even')
  }

  // ── Sheet 4: Revenue by Month ──
  {
    const revRows: any[][] = [
      ['TriStar PT — Monthly Revenue'],
      [`Year: ${year}`],
      [],
      ['Location', ...[...MONTHS]],
    ]
    locs.forEach(loc => {
      const rev = plData[loc]?.revenue || {}
      revRows.push([loc, ...[...MONTHS].map(m => rev[m] || 0)])
    })
    // Totals row
    revRows.push(['TOTAL', ...[...MONTHS].map(m =>
      locs.reduce((s, l) => s + (plData[l]?.revenue?.[m] ?? 0), 0)
    )])
    const ws4 = XLSX.utils.aoa_to_sheet(revRows)
    ws4['!cols'] = [{ wch: 16 }, ...MONTHS.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, ws4, 'Revenue')
  }

  // ── Sheet 5: COGS Detail ──
  {
    const cogsRows: any[][] = [
      ['TriStar PT — COGS by Location & Category'],
      [`Year: ${year}`, `Months: ${monthLabel}`],
      [],
      ['Location', 'Category', ...[...MONTHS]],
    ]
    locs.forEach(loc => {
      ;[...COGS_CATEGORIES].forEach(cat => {
        cogsRows.push([
          loc, cat,
          ...[...MONTHS].map(m => plData[loc]?.cogs?.[m]?.[cat] ?? 0),
        ])
      })
    })
    const ws5 = XLSX.utils.aoa_to_sheet(cogsRows)
    ws5['!cols'] = [{ wch: 16 }, { wch: 24 }, ...MONTHS.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, ws5, 'COGS Detail')
  }

  // ── Sheet 6: Expenses Detail ──
  {
    const expRows: any[][] = [
      ['TriStar PT — Expenses by Location & Category'],
      [`Year: ${year}`, `Months: ${monthLabel}`],
      [],
      ['Location', 'Category', ...[...MONTHS]],
    ]
    locs.forEach(loc => {
      ;[...EXPENSE_CATEGORIES].forEach(cat => {
        expRows.push([
          loc, cat,
          ...[...MONTHS].map(m => plData[loc]?.expenses?.[m]?.[cat] ?? 0),
        ])
      })
    })
    const ws6 = XLSX.utils.aoa_to_sheet(expRows)
    ws6['!cols'] = [{ wch: 16 }, { wch: 28 }, ...MONTHS.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, ws6, 'Expenses Detail')
  }

  // ── Sheet 7: Headcount ──
  {
    const roles = ['PT', 'PTA', 'OT', 'COTA', 'TECH', 'FD']
    const hcRows: any[][] = [
      ['TriStar PT — Headcount'],
      [`Year: ${year}`],
      [],
      ['Location', ...roles, 'Total'],
    ]
    locs.forEach(loc => {
      const hc = headcount[loc] || {}
      const total = roles.reduce((s, r) => s + (hc[r] || 0), 0)
      hcRows.push([loc, ...roles.map(r => hc[r] || 0), total])
    })
    const ws7 = XLSX.utils.aoa_to_sheet(hcRows)
    ws7['!cols'] = [{ wch: 16 }, ...roles.map(() => ({ wch: 8 })), { wch: 8 }]
    XLSX.utils.book_append_sheet(wb, ws7, 'Headcount')
  }

  // ── Download ──
  const filename = `TriStar_PT_PL_${year}_${monthLabel.replace(/[, ]+/g, '_')}.xlsx`
  XLSX.writeFile(wb, filename)
}
