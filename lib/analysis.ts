import { LOCATIONS, MONTHS, COGS_CATEGORIES, EXPENSE_CATEGORIES } from './constants'

export type PLData = Record<string, {
  revenue: Record<string, number>
  cogs: Record<string, Record<string, number>>
  expenses: Record<string, Record<string, number>>
  otherIncome: Record<string, number>
  otherExpense: Record<string, number>
}>

export type HeadcountData = Record<string, Record<string, number>>

export type LocationResult = {
  revenue: number; revShare: number
  cogsD: number; cogsAlloc: number; cogsA: number
  gpD: number; gpA: number
  expD: number; expAlloc: number; expA: number
  noiD: number; noiA: number
  oiD: number; oeD: number; oiAlloc: number; oeAlloc: number
  niD: number; niA: number
  gmPct: number; niPctD: number; niPctA: number
  cm: number; cmPct: number
  beD: number; beA: number
  mosD: number; mosA: number
  mosPctD: number; mosPctA: number
  clinHC: number; allHC: number
  revPerClin: number; niPerClinD: number; niPerClinA: number
}

export type AnalysisResult = {
  results: Record<string, LocationResult>
  rankings: Record<string, Record<string, number>>
  composite: Record<string, number>
  sortedLocs: string[]
  totalRev: number
  corpCogs: number
  corpExp: number
}

export function buildEmptyPL(): PLData {
  const pl: any = {}
  const locs = [...LOCATIONS as any]
  locs.forEach((loc: string) => {
    pl[loc] = { revenue: {}, cogs: {}, expenses: {}, otherIncome: {}, otherExpense: {} }
    MONTHS.forEach(m => {
      pl[loc].revenue[m] = 0
      pl[loc].cogs[m] = {}
      COGS_CATEGORIES.forEach(cat => { pl[loc].cogs[m][cat] = 0 })
      pl[loc].expenses[m] = {}
      EXPENSE_CATEGORIES.forEach(cat => { pl[loc].expenses[m][cat] = 0 })
      pl[loc].otherIncome[m] = 0
      pl[loc].otherExpense[m] = 0
    })
  })
  pl["Corporate"] = { cogs: {}, expenses: {}, otherIncome: {}, otherExpense: {} }
  MONTHS.forEach(m => {
    pl["Corporate"].cogs[m] = {}
    COGS_CATEGORIES.forEach(cat => { pl["Corporate"].cogs[m][cat] = 0 })
    pl["Corporate"].expenses[m] = {}
    EXPENSE_CATEGORIES.forEach(cat => { pl["Corporate"].expenses[m][cat] = 0 })
    pl["Corporate"].otherIncome[m] = 0
    pl["Corporate"].otherExpense[m] = 0
  })
  return pl
}

export function runAnalysis(plData: PLData, headcount: HeadcountData, selectedMonths: string[]): AnalysisResult {
  const ms = selectedMonths
  const results: Record<string, LocationResult> = {}
  let totalRev = 0
  const locs = [...LOCATIONS as any] as string[]

  locs.forEach(loc => {
    const rev = ms.reduce((s, m) => s + (plData[loc]?.revenue?.[m] ?? 0), 0)
    totalRev += rev
  })

  let totalCorpCogs = 0
  COGS_CATEGORIES.forEach(cat => {
    totalCorpCogs += ms.reduce((s, m) => s + (plData["Corporate"]?.cogs?.[m]?.[cat] ?? 0), 0)
  })
  let totalCorpExp = 0
  EXPENSE_CATEGORIES.forEach(cat => {
    totalCorpExp += ms.reduce((s, m) => s + (plData["Corporate"]?.expenses?.[m]?.[cat] ?? 0), 0)
  })
  const corpOI = ms.reduce((s, m) => s + (plData["Corporate"]?.otherIncome?.[m] ?? 0), 0)
  const corpOE = ms.reduce((s, m) => s + (plData["Corporate"]?.otherExpense?.[m] ?? 0), 0)

  locs.forEach(loc => {
    const rev = ms.reduce((s, m) => s + (plData[loc]?.revenue?.[m] ?? 0), 0)
    const rs = totalRev > 0 ? rev / totalRev : 0

    let cogsD = 0
    COGS_CATEGORIES.forEach(cat => {
      cogsD += ms.reduce((s, m) => s + (plData[loc]?.cogs?.[m]?.[cat] ?? 0), 0)
    })
    const cogsAlloc = totalCorpCogs * rs

    let expD = 0
    EXPENSE_CATEGORIES.forEach(cat => {
      expD += ms.reduce((s, m) => s + (plData[loc]?.expenses?.[m]?.[cat] ?? 0), 0)
    })
    const expAlloc = totalCorpExp * rs

    const oiD = ms.reduce((s, m) => s + (plData[loc]?.otherIncome?.[m] ?? 0), 0)
    const oeD = ms.reduce((s, m) => s + (plData[loc]?.otherExpense?.[m] ?? 0), 0)
    const oiAlloc = corpOI * rs
    const oeAlloc = corpOE * rs

    const gpD = rev - cogsD
    const gpA = rev - cogsD - cogsAlloc
    const noiD = gpD - expD
    const noiA = gpA - expD - expAlloc
    const niD = noiD + oiD - oeD
    const niA = noiA + oiD - oeD + oiAlloc - oeAlloc

    const cm = rev - cogsD
    const cmPct = rev > 0 ? cm / rev : 0
    const beD = cmPct > 0 ? expD / cmPct : 0
    const beA = cmPct > 0 ? (expD + expAlloc) / cmPct : 0

    const hc = headcount[loc] || {}
    const clinHC = (hc.PT||0)+(hc.PTA||0)+(hc.OT||0)+(hc.COTA||0)+(hc.TECH||0)
    const allHC = clinHC + (hc.FD||0)

    results[loc] = {
      revenue: rev, revShare: rs,
      cogsD, cogsAlloc, cogsA: cogsD + cogsAlloc,
      gpD, gpA,
      expD, expAlloc, expA: expD + expAlloc,
      noiD, noiA, oiD, oeD, oiAlloc, oeAlloc,
      niD, niA,
      gmPct: rev > 0 ? gpD/rev : 0,
      niPctD: rev > 0 ? niD/rev : 0,
      niPctA: rev > 0 ? niA/rev : 0,
      cm, cmPct, beD, beA,
      mosD: rev - beD, mosA: rev - beA,
      mosPctD: rev > 0 ? (rev-beD)/rev : 0,
      mosPctA: rev > 0 ? (rev-beA)/rev : 0,
      clinHC, allHC,
      revPerClin: clinHC > 0 ? rev/clinHC : 0,
      niPerClinD: clinHC > 0 ? niD/clinHC : 0,
      niPerClinA: clinHC > 0 ? niA/clinHC : 0,
    }
  })

  const metricKeys = ["revenue","gmPct","niPctD","cmPct","revPerClin","niPerClinD","mosPctA"]
  const rankings: Record<string, Record<string, number>> = {}
  locs.forEach(loc => { rankings[loc] = {} })
  metricKeys.forEach(mk => {
    const sorted = [...locs].sort((a, b) => (results[b]?.[mk as keyof LocationResult] as number || 0) - (results[a]?.[mk as keyof LocationResult] as number || 0))
    sorted.forEach((loc, i) => { rankings[loc][mk] = i + 1 })
  })
  const composite: Record<string, number> = {}
  locs.forEach(loc => {
    composite[loc] = Object.values(rankings[loc]).reduce((a, b) => a + b, 0) / metricKeys.length
  })
  const sortedLocs = [...locs].sort((a, b) => composite[a] - composite[b])

  return { results, rankings, composite, sortedLocs, totalRev, corpCogs: totalCorpCogs, corpExp: totalCorpExp }
}

export function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "-"
  const abs = Math.abs(n)
  if (abs >= 1000) return (n < 0 ? "(" : "") + "$" + abs.toLocaleString("en-US", {maximumFractionDigits:0}) + (n < 0 ? ")" : "")
  return (n < 0 ? "(" : "") + "$" + abs.toFixed(0) + (n < 0 ? ")" : "")
}

export function pct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "-"
  return (n * 100).toFixed(1) + "%"
}

export function grade(avg: number, numLocs: number = 8): string {
  const p = avg / numLocs
  if (p <= 0.25) return "A"
  if (p <= 0.5) return "B"
  if (p <= 0.75) return "C"
  return "D"
}
