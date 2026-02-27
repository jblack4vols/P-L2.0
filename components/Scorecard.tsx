'use client'
import { useState } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { fmt, pct, grade } from '@/lib/analysis'
import type { AnalysisResult } from '@/lib/analysis'

type Props = { analysis: AnalysisResult | null }

const METRIC_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  gmPct: 'GM%',
  niPctD: 'NI% (D)',
  cmPct: 'CM%',
  revPerClin: 'Rev/Clin',
  niPerClinD: 'NI/Clin',
  mosPctA: 'MoS%',
}

function gradeColor(g: string) {
  if (g === 'A') return 'bg-green-100 text-green-800 border-green-300'
  if (g === 'B') return 'bg-blue-100 text-blue-800 border-blue-300'
  if (g === 'C') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

function gradeBg(g: string) {
  if (g === 'A') return 'border-l-4 border-l-green-500'
  if (g === 'B') return 'border-l-4 border-l-blue-500'
  if (g === 'C') return 'border-l-4 border-l-yellow-500'
  return 'border-l-4 border-l-red-500'
}

export default function Scorecard({ analysis }: Props) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  if (!analysis) return <p className="text-gray-400 p-8 text-center">No data to display.</p>

  const { results, rankings, composite, sortedLocs } = analysis
  const metrics = Object.keys(METRIC_LABELS)

  const CardView = () => (
    <div className="grid grid-cols-1 gap-3">
      {sortedLocs.map((loc, idx) => {
        const g = grade(composite[loc])
        const r = results[loc]
        return (
          <div key={loc} className={`bg-white rounded-lg border p-3 shadow-sm ${gradeBg(g)}`}>
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-sm">#{idx + 1}</span>
                <h4 className="font-bold text-gray-800 text-sm">{loc}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Score: {composite[loc].toFixed(1)}</span>
                <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-sm text-center border ${gradeColor(g)}`}>{g}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {metrics.map(m => {
                const val = (r as any)?.[m]
                const rank = rankings[loc]?.[m] || '-'
                const display = typeof val === 'number'
                  ? (m.includes('Pct') || m === 'gmPct' || m === 'cmPct' ? pct(val) : fmt(val))
                  : '-'
                return (
                  <div key={m} className="flex justify-between">
                    <span className="text-gray-500">{METRIC_LABELS[m]}</span>
                    <span className="tabular-nums text-gray-800">{display} <span className="text-gray-400 text-[10px]">#{rank}</span></span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  const TableView = () => (
    <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
      <table className="w-full text-xs min-w-[800px]">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="text-left p-2 sticky left-0 bg-gray-100 z-10">#</th>
            <th className="text-left p-2 sticky left-6 bg-gray-100 z-10 min-w-[120px]">Location</th>
            <th className="text-center p-2">Grade</th>
            <th className="text-right p-2">Score</th>
            {metrics.map(m => <th key={m} className="text-center p-2">{METRIC_LABELS[m]}</th>)}
          </tr>
        </thead>
        <tbody>
          {sortedLocs.map((loc, idx) => {
            const g = grade(composite[loc])
            const r = results[loc]
            return (
              <tr key={loc} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-500 sticky left-0 bg-white z-10">{idx + 1}</td>
                <td className="p-2 font-medium text-gray-800 sticky left-6 bg-white z-10">{loc}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-sm border ${gradeColor(g)}`}>{g}</span>
                </td>
                <td className="p-2 text-right font-mono">{composite[loc].toFixed(1)}</td>
                {metrics.map(m => {
                  const rank = rankings[loc]?.[m] || '-'
                  const val = (r as any)?.[m]
                  const display = typeof val === 'number'
                    ? (m.includes('Pct') || m === 'gmPct' || m === 'cmPct' ? pct(val) : fmt(val))
                    : '-'
                  return (
                    <td key={m} className="p-2 text-center">
                      <div className="text-gray-700">{display}</div>
                      <div className="text-gray-400 text-[10px]">#{rank}</div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        Locations ranked across 7 key metrics. Composite score = average rank (lower is better).
      </p>

      {/* View mode toggle - visible on mobile */}
      <div className="flex justify-end mb-3 sm:hidden">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'cards' ? 'bg-brand-orange text-white' : 'bg-white text-gray-600'}`}>
            Cards
          </button>
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-brand-orange text-white' : 'bg-white text-gray-600'}`}>
            Table
          </button>
        </div>
      </div>

      <div className="sm:hidden">{viewMode === 'cards' ? <CardView /> : <TableView />}</div>
      <div className="hidden sm:block"><TableView /></div>
    </div>
  )
}
