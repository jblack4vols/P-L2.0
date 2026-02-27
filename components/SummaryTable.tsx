'use client'
import { useState } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { fmt, pct } from '@/lib/analysis'
import type { AnalysisResult } from '@/lib/analysis'

type Props = { analysis: AnalysisResult | null }

function cn(val: number, isMargin: boolean = false): string {
  if (isMargin) {
    if (val >= 0.1) return 'text-green-700 bg-green-50'
    if (val >= 0) return 'text-yellow-700 bg-yellow-50'
    return 'text-red-700 bg-red-50'
  }
  return val < 0 ? 'text-red-600' : ''
}

const ROWS: { label: string; key: string; isCurrency: boolean; isMargin?: boolean; bold?: boolean }[] = [
  { label: 'Revenue', key: 'revenue', isCurrency: true, bold: true },
  { label: 'Rev Share', key: 'revShare', isCurrency: false },
  { label: 'Direct COGS', key: 'cogsD', isCurrency: true },
  { label: 'Alloc. COGS', key: 'cogsAlloc', isCurrency: true },
  { label: 'Gross Profit', key: 'gpD', isCurrency: true, bold: true },
  { label: 'GM%', key: 'gmPct', isCurrency: false, isMargin: true },
  { label: 'Direct OpEx', key: 'expD', isCurrency: true },
  { label: 'Alloc. OpEx', key: 'expAlloc', isCurrency: true },
  { label: 'Net Income (D)', key: 'niD', isCurrency: true, bold: true },
  { label: 'NI% (Direct)', key: 'niPctD', isCurrency: false, isMargin: true },
  { label: 'Net Income (A)', key: 'niA', isCurrency: true, bold: true },
  { label: 'NI% (Alloc)', key: 'niPctA', isCurrency: false, isMargin: true },
]

export default function SummaryTable({ analysis }: Props) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  if (!analysis) return <p className="text-gray-400 p-8 text-center">Enter data and select months to see analysis.</p>

  const { results, totalRev } = analysis
  const locs = [...LOCATIONS] as string[]

  // Mobile card view
  const CardView = () => (
    <div className="grid grid-cols-1 gap-3">
      {locs.map(loc => {
        const r = results[loc]
        if (!r) return null
        return (
          <div key={loc} className="bg-white rounded-lg border p-3 shadow-sm">
            <h4 className="font-bold text-gray-800 text-sm mb-2 pb-2 border-b">{loc}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ROWS.map(row => {
                const v = (r as any)?.[row.key] || 0
                return (
                  <div key={row.key} className={`flex justify-between col-span-1 ${row.bold ? 'font-semibold' : ''}`}>
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`tabular-nums ${row.isMargin ? cn(v, true) : cn(v)} px-1 rounded`}>
                      {row.isCurrency ? fmt(v) : pct(v)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // Desktop table view
  const TableView = () => (
    <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
      <table className="w-full text-xs min-w-[900px]">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="text-left p-2 sticky left-0 bg-gray-100 min-w-[130px] z-10">Metric</th>
            {locs.map(loc => <th key={loc} className="text-right p-2 min-w-[95px]">{loc}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => (
            <tr key={row.key} className="border-t border-gray-100 hover:bg-gray-50">
              <td className={`p-2 text-gray-700 sticky left-0 bg-white z-10 ${row.bold ? 'font-bold' : 'font-medium'}`}>{row.label}</td>
              {locs.map(loc => {
                const v = (results[loc] as any)?.[row.key] || 0
                return (
                  <td key={loc} className={`p-2 text-right tabular-nums ${row.isMargin ? cn(v, true) : cn(v)} ${row.bold ? 'font-bold' : ''} rounded`}>
                    {row.isCurrency ? fmt(v) : pct(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
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

      {/* Show cards on mobile by default, table on desktop */}
      <div className="sm:hidden">{viewMode === 'cards' ? <CardView /> : <TableView />}</div>
      <div className="hidden sm:block"><TableView /></div>
    </div>
  )
}
