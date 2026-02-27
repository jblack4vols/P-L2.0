'use client'
import { useState, useEffect } from 'react'
import { LOCATIONS, MONTHS } from '@/lib/constants'
import { loadPLData, loadHeadcount } from '@/lib/database'
import { runAnalysis } from '@/lib/analysis'
import { computeYoY, type YoYRow } from '@/lib/yoyComparison'
import type { AnalysisResult } from '@/lib/analysis'

type Props = {
  userId: string
  year: number
  selectedMonths: string[]
  currentAnalysis: AnalysisResult | null
}

function fmt(n: number) {
  if (Math.abs(n) < 1 && n !== 0) return (n * 100).toFixed(1) + '%'
  return n < 0
    ? `(${Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })})`
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtMetric(name: string, val: number) {
  if (name.includes('%')) return (val * 100).toFixed(1) + '%'
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtChange(name: string, val: number) {
  if (name.includes('%')) return (val > 0 ? '+' : '') + (val * 100).toFixed(1) + 'pp'
  const s = val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  return val > 0 ? '+' + s : s
}

export default function YoYAnalysis({ userId, year, selectedMonths, currentAnalysis }: Props) {
  const [priorAnalysis, setPriorAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [selLoc, setSelLoc] = useState<string | 'all'>('all')

  useEffect(() => {
    loadPriorYear()
  }, [userId, year, selectedMonths])

  async function loadPriorYear() {
    setLoading(true)
    const priorYear = year - 1
    const [pl, hc] = await Promise.all([
      loadPLData(userId, priorYear),
      loadHeadcount(userId, priorYear),
    ])
    if (pl) {
      const result = runAnalysis(pl, hc || {}, selectedMonths)
      setPriorAnalysis(result)
    } else {
      setPriorAnalysis(null)
    }
    setLoading(false)
  }

  const rows = computeYoY(currentAnalysis, priorAnalysis)
  const filtered = selLoc === 'all' ? rows : rows.filter(r => r.location === selLoc)

  if (loading) return <div className="text-gray-400 text-center py-8">Loading {year - 1} data...</div>
  if (!priorAnalysis) return <div className="text-gray-400 text-center py-8">No data available for {year - 1}. Enter prior year data to see comparison.</div>

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Year-over-Year Comparison</h2>
      <p className="text-sm text-gray-500 mb-4">{year - 1} vs {year}</p>

      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        <button onClick={() => setSelLoc('all')}
          className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
            selLoc === 'all' ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
          }`}>All</button>
        {[...LOCATIONS].map(loc => (
          <button key={loc} onClick={() => setSelLoc(loc)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
              selLoc === loc ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
            }`}>{loc}</button>
        ))}
      </div>

      {/* Table view (all screen sizes) */}
      <div className="overflow-x-auto scroll-touch">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium text-gray-500">Location</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Metric</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">{year - 1}</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">{year}</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Change</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">%</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.location}</td>
                <td className="px-3 py-2 text-gray-600">{r.metric}</td>
                <td className="px-3 py-2 text-right">{fmtMetric(r.metric, r.prior)}</td>
                <td className="px-3 py-2 text-right">{fmtMetric(r.metric, r.current)}</td>
                <td className={`px-3 py-2 text-right font-medium ${r.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmtChange(r.metric, r.change)}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${r.changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(r.changePct * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
