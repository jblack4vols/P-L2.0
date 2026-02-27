'use client'
import { useState } from 'react'
import { LOCATIONS, MONTHS } from '@/lib/constants'
import type { BudgetData } from '@/lib/budgetAnalysis'

type Props = {
  budget: BudgetData
  setBudget: (b: BudgetData) => void
  onSave: () => void
  saving: boolean
}

export default function BudgetInput({ budget, setBudget, onSave, saving }: Props) {
  const [selLoc, setSelLoc] = useState<string>(LOCATIONS[0])
  const [metric, setMetric] = useState<'revenue' | 'cogs' | 'expenses'>('revenue')

  function update(month: string, val: number) {
    const next = { ...budget }
    next[selLoc] = { ...next[selLoc], [metric]: { ...next[selLoc]?.[metric], [month]: val } }
    setBudget(next)
  }

  const total = [...MONTHS].reduce((s, m) => s + (budget[selLoc]?.[metric]?.[m] ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800">Budget Entry</h2>
        <button onClick={onSave} disabled={saving}
          className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange-hover disabled:opacity-50 min-h-[36px]">
          {saving ? 'Saving...' : 'Save Budget'}
        </button>
      </div>

      {/* Location selector */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        {[...LOCATIONS].map(loc => (
          <button key={loc} onClick={() => setSelLoc(loc)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
              selLoc === loc ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
            }`}>{loc}</button>
        ))}
      </div>

      {/* Metric toggle */}
      <div className="flex gap-2 mb-4">
        {(['revenue', 'cogs', 'expenses'] as const).map(m => (
          <button key={m} onClick={() => setMetric(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              metric === m ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } min-h-[36px]`}>
            {m === 'revenue' ? 'Revenue' : m === 'cogs' ? 'COGS' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* Monthly grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {[...MONTHS].map(m => (
          <div key={m}>
            <label className="text-xs text-gray-500 font-medium">{m}</label>
            <input type="number" step="0.01"
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-brand-orange focus:border-transparent min-h-[36px]"
              value={budget[selLoc]?.[metric]?.[m] || ''}
              onChange={e => update(m, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <span className="text-sm text-gray-500">Annual Total:</span>
        <span className="ml-2 text-lg font-bold text-gray-800">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  )
}
