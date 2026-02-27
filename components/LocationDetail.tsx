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
      {/* Location selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        {locs.map(l => (
          <button key={l} onClick={() => setSelLoc(l)}
            className={`px-3 py-2 rounded text-xs font-medium border transition whitespace-nowrap min-h-[36px] ${
              selLoc === l ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-orange'
            }`}
          >{l}</button>
        ))}
      </div>

      {/* P&L Summary Table */}
      <div className="bg-white rounded-lg border p-3 sm:p-4 mb-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">P&L Summary — {selLoc}</h4>
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left px-2 py-2 font-medium text-gray-600">Metric</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">Amount</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Revenue', value: r.revenue, bold: true },
                { label: 'Direct COGS', value: r.cogsD },
                { label: 'Allocated COGS', value: r.cogsAlloc },
                { label: 'Gross Profit (Direct)', value: r.gpD, bold: true },
                { label: 'Gross Margin %', value: r.gmPct, isPct: true, bold: true },
                { label: 'Direct Operating Expenses', value: r.expD },
                { label: 'Allocated Operating Expenses', value: r.expAlloc },
                { label: 'NOI (Direct)', value: r.noiD },
                { label: 'NOI (Allocated)', value: r.noiA },
                { label: 'Other Income', value: r.oiD },
                { label: 'Other Expenses', value: r.oeD },
                { label: 'Net Income (Direct)', value: r.niD, bold: true },
                { label: 'NI% (Direct)', value: r.niPctD, isPct: true, bold: true },
                { label: 'Net Income (Allocated)', value: r.niA, bold: true },
                { label: 'NI% (Allocated)', value: r.niPctA, isPct: true, bold: true },
              ].map(row => (
                <tr key={row.label} className={`border-t border-gray-100 ${row.bold ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <td className={`px-2 py-1.5 text-gray-700 ${row.bold ? 'font-bold' : ''}`}>{row.label}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${row.bold ? 'font-bold' : ''} ${!row.isPct && row.value < 0 ? 'text-red-600' : ''}`}>
                    {row.isPct ? pct(row.value) : fmt(row.value)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                    {row.isPct ? '-' : r.revenue ? pct(row.value / r.revenue) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COGS + OpEx side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* COGS Breakdown Table */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3">COGS Breakdown</h4>
          {cogsByCategory.length === 0 ? (
            <p className="text-gray-400 text-xs">No COGS data entered.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Category</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Amount</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">% of COGS</th>
                </tr>
              </thead>
              <tbody>
                {cogsByCategory.map(({ cat, total }) => (
                  <tr key={cat} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 text-gray-700" title={cat}>{cat}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(total)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{r.cogsD ? pct(total / r.cogsD) : '-'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                  <td className="px-2 py-1.5">Total COGS</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.cogsD)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">100.0%</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* OpEx Breakdown Table */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3">OpEx Breakdown</h4>
          {expByCategory.length === 0 ? (
            <p className="text-gray-400 text-xs">No expense data entered.</p>
          ) : (
            <div className="max-h-[350px] overflow-y-auto scroll-touch">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-2 py-1.5 font-medium text-gray-500 bg-gray-50">Category</th>
                    <th className="text-right px-2 py-1.5 font-medium text-gray-500 bg-gray-50">Amount</th>
                    <th className="text-right px-2 py-1.5 font-medium text-gray-500 bg-gray-50">% of OpEx</th>
                  </tr>
                </thead>
                <tbody>
                  {expByCategory.map(({ cat, total }) => (
                    <tr key={cat} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-700" title={cat}>{cat}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(total)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{r.expD ? pct(total / r.expD) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                    <td className="px-2 py-1.5">Total OpEx</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.expD)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Staffing + Per Clinician + Break-Even */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3">Staffing</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">Role</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Count</th>
              </tr>
            </thead>
            <tbody>
              {[...STAFF_ROLES].map(role => (
                <tr key={role} className="border-t border-gray-100">
                  <td className="px-2 py-1.5 text-gray-700">{role}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{hc[role] || 0}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <td className="px-2 py-1.5">Clinical</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.clinHC}</td>
              </tr>
              <tr className="font-bold bg-gray-50">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.allHC}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3">Per Clinician Metrics</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">Metric</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">Revenue / Clinician</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmt(r.revPerClin)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">NI / Clinician (Direct)</td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${r.niPerClinD < 0 ? 'text-red-600' : ''}`}>{fmt(r.niPerClinD)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">NI / Clinician (Alloc)</td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${r.niPerClinA < 0 ? 'text-red-600' : ''}`}>{fmt(r.niPerClinA)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">GP / Clinician</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">{r.clinHC ? fmt(r.gpD / r.clinHC) : '-'}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">OpEx / Clinician</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">{r.clinHC ? fmt(r.expD / r.clinHC) : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3">Break-Even</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">Metric</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Direct</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Allocated</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">CM%</td>
                <td className="px-2 py-1.5 text-right tabular-nums" colSpan={2}>{pct(r.cmPct)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">Break-Even</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.beD)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.beA)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">MoS ($)</td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${r.mosD >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosD)}</td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${r.mosA >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosA)}</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-700">MoS (%)</td>
                <td className={`px-2 py-1.5 text-right tabular-nums ${r.mosPctD >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pct(r.mosPctD)}</td>
                <td className={`px-2 py-1.5 text-right tabular-nums ${r.mosPctA >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pct(r.mosPctA)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-lg border p-3 sm:p-4 mb-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">Monthly Revenue</h4>
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {ms.map(m => <th key={m} className="text-right px-2 py-1.5 font-medium text-gray-500">{m}</th>)}
                <th className="text-right px-2 py-1.5 font-bold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {ms.map(m => (
                  <td key={m} className="text-right px-2 py-1.5 tabular-nums">{fmt(plData[selLoc]?.revenue[m] || 0)}</td>
                ))}
                <td className="text-right px-2 py-1.5 font-bold tabular-nums">{fmt(r.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly COGS Table */}
      <div className="bg-white rounded-lg border p-3 sm:p-4 mb-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">Monthly COGS</h4>
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {ms.map(m => <th key={m} className="text-right px-2 py-1.5 font-medium text-gray-500">{m}</th>)}
                <th className="text-right px-2 py-1.5 font-bold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {ms.map(m => {
                  const cats = plData[selLoc]?.cogs[m] || {}
                  const total = Object.values(cats).reduce((a: number, b: any) => a + (b || 0), 0)
                  return <td key={m} className="text-right px-2 py-1.5 tabular-nums">{fmt(total)}</td>
                })}
                <td className="text-right px-2 py-1.5 font-bold tabular-nums">{fmt(r.cogsD)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Operating Expenses Table */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">Monthly Operating Expenses</h4>
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {ms.map(m => <th key={m} className="text-right px-2 py-1.5 font-medium text-gray-500">{m}</th>)}
                <th className="text-right px-2 py-1.5 font-bold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {ms.map(m => {
                  const cats = plData[selLoc]?.expenses[m] || {}
                  const total = Object.values(cats).reduce((a: number, b: any) => a + (b || 0), 0)
                  return <td key={m} className="text-right px-2 py-1.5 tabular-nums">{fmt(total)}</td>
                })}
                <td className="text-right px-2 py-1.5 font-bold tabular-nums">{fmt(r.expD)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
