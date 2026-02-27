'use client'
import { useState } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { computeVariance, type BudgetData } from '@/lib/budgetAnalysis'
import type { PLData } from '@/lib/analysis'

type Props = {
  plData: PLData
  budget: BudgetData
  selectedMonths: string[]
}

function fmt(n: number) {
  return n < 0
    ? `(${Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })})`
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}

export default function BudgetComparison({ plData, budget, selectedMonths }: Props) {
  const [selLoc, setSelLoc] = useState<string | 'all'>('all')
  const rows = computeVariance(plData, budget, selectedMonths)
  const filtered = selLoc === 'all' ? rows : rows.filter(r => r.location === selLoc)

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Budget vs Actual</h2>

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
              <th className="text-right px-3 py-2 font-medium text-gray-500">Budget</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Actual</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Variance ($)</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Variance (%)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const favorable = r.metric === 'Revenue' ? r.variance >= 0 : r.variance <= 0
              return (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.location}</td>
                  <td className="px-3 py-2 text-gray-600">{r.metric}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.budget)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.actual)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${favorable ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.variance)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${favorable ? 'text-green-600' : 'text-red-600'}`}>{pct(r.variancePct)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
