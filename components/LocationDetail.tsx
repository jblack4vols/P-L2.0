'use client'
import { useState } from 'react'
import { LOCATIONS, MONTHS, COGS_CATEGORIES, EXPENSE_CATEGORIES, STAFF_ROLES } from '@/lib/constants'
import { fmt, pct } from '@/lib/analysis'
import type { PLData, HeadcountData, AnalysisResult } from '@/lib/analysis'

type Props = {
  plData: PLData
  headcount: HeadcountData
  analysis: AnalysisResult | null
  selectedMonths: string[]
}

export default function LocationDetail({ plData, headcount, analysis, selectedMonths }: Props) {
  const [selLoc, setSelLoc] = useState(([...LOCATIONS] as string[])[0])
  const locs = [...LOCATIONS] as string[]

  if (!analysis) return <p className="text-gray-400 p-8 text-center">No data to display.</p>
  const r = analysis.results[selLoc]
  if (!r) return null

  const ms = selectedMonths

  const cogsByCategory = COGS_CATEGORIES.map(cat => ({
    cat,
    total: ms.reduce((s, m) => s + (plData[selLoc]?.cogs[m]?.[cat] || 0), 0)
  })).filter(x => x.total !== 0)

  const expByCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: ms.reduce((s, m) => s + (plData[selLoc]?.expenses[m]?.[cat] || 0), 0)
  })).filter(x => x.total !== 0)

  const hc = headcount[selLoc] || {}

  return (
    <div>
      {/* Location selector - horizontal scroll on mobile */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        {locs.map(l => (
          <button key={l} onClick={() => setSelLoc(l)}
            className={`px-3 py-2 rounded text-xs font-medium border transition whitespace-nowrap min-h-[36px] ${
              selLoc === l ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-orange'
            }`}
          >{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* P&L Summary Card */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">P&L Summary</h4>
          <div className="space-y-1.5 text-xs">
            {[
              { l: 'Revenue', v: r.revenue },
              { l: 'Direct COGS', v: -r.cogsD },
              { l: 'Alloc. COGS', v: -r.cogsAlloc },
              { l: 'Gross Profit (D)', v: r.gpD },
              { l: 'GM%', v: r.gmPct, isPct: true },
              { l: 'Direct OpEx', v: -r.expD },
              { l: 'Alloc. OpEx', v: -r.expAlloc },
              { l: 'NOI (Direct)', v: r.noiD },
              { l: 'NOI (Alloc)', v: r.noiA },
              { l: 'Net Income (D)', v: r.niD, bold: true },
              { l: 'NI% (D)', v: r.niPctD, isPct: true },
              { l: 'Net Income (A)', v: r.niA, bold: true },
              { l: 'NI% (A)', v: r.niPctA, isPct: true },
            ].map(row => (
              <div key={row.l} className={`flex justify-between ${row.bold ? 'font-bold border-t pt-1' : ''}`}>
                <span className="text-gray-500">{row.l}</span>
                <span className={row.v < 0 ? 'text-red-600' : 'text-gray-800'}>
                  {row.isPct ? pct(row.v) : fmt(row.v)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COGS Breakdown */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">COGS Breakdown</h4>
          {cogsByCategory.length === 0 ? (
            <p className="text-gray-400 text-xs">No COGS data entered.</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {cogsByCategory.map(({ cat, total }) => (
                <div key={cat} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2" title={cat}>{cat}</span>
                  <span className="text-gray-800 font-medium whitespace-nowrap">{fmt(total)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Total COGS</span>
                <span>{fmt(r.cogsD)}</span>
              </div>
            </div>
          )}
        </div>

        {/* OpEx Breakdown */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">OpEx Breakdown</h4>
          {expByCategory.length === 0 ? (
            <p className="text-gray-400 text-xs">No expense data entered.</p>
          ) : (
            <div className="space-y-1.5 text-xs max-h-[250px] sm:max-h-[300px] overflow-y-auto scroll-touch">
              {expByCategory.map(({ cat, total }) => (
                <div key={cat} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2" title={cat}>{cat}</span>
                  <span className="text-gray-800 font-medium whitespace-nowrap">{fmt(total)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Total OpEx</span>
                <span>{fmt(r.expD)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Staffing */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">Staffing</h4>
          <div className="space-y-1.5 text-xs">
            {[...STAFF_ROLES].map(role => (
              <div key={role} className="flex justify-between">
                <span className="text-gray-500">{role}</span>
                <span className="text-gray-800 font-medium">{hc[role] || 0}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1 font-bold">
              <span>Clinical</span><span>{r.clinHC}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span><span>{r.allHC}</span>
            </div>
          </div>
        </div>

        {/* Per Clinician Metrics */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">Per Clinician</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Rev / Clinician</span>
              <span className="font-medium">{fmt(r.revPerClin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">NI / Clinician (D)</span>
              <span className="font-medium">{fmt(r.niPerClinD)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">NI / Clinician (A)</span>
              <span className="font-medium">{fmt(r.niPerClinA)}</span>
            </div>
          </div>
        </div>

        {/* Break-Even */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">Break-Even</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">CM%</span>
              <span className="font-medium">{pct(r.cmPct)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Break-Even (D)</span>
              <span className="font-medium">{fmt(r.beD)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Break-Even (A)</span>
              <span className="font-medium">{fmt(r.beA)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="text-gray-500">MoS (D)</span>
              <span className={`font-bold ${r.mosD >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosD)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MoS (A)</span>
              <span className={`font-bold ${r.mosA >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosA)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue - horizontal scroll with sticky first col */}
      <div className="mt-4 sm:mt-6 bg-white rounded-lg border p-3 sm:p-4">
        <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">Monthly Revenue</h4>
        <div className="overflow-x-auto scroll-touch -mx-3 sm:mx-0 px-3 sm:px-0">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="bg-gray-50">
                {ms.map(m => <th key={m} className="text-right p-2">{m}</th>)}
                <th className="text-right p-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {ms.map(m => (
                  <td key={m} className="text-right p-2 tabular-nums">{fmt(plData[selLoc]?.revenue[m] || 0)}</td>
                ))}
                <td className="text-right p-2 font-bold tabular-nums">{fmt(r.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
