'use client'
import { LOCATIONS, COLORS } from '@/lib/constants'
import { fmt, pct } from '@/lib/analysis'
import type { AnalysisResult } from '@/lib/analysis'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

type Props = { analysis: AnalysisResult | null }

export default function Dashboard({ analysis }: Props) {
  if (!analysis) return <p className="text-gray-400 p-8 text-center">No data to display.</p>

  const { results } = analysis
  const locs = [...LOCATIONS] as string[]

  const revenueData = locs.map((l, i) => ({ name: l.split(' ')[0], full: l, value: results[l].revenue, fill: COLORS[i] }))
  const niData = locs.map((l, i) => ({ name: l.split(' ')[0], full: l, direct: results[l].niD, alloc: results[l].niA, fill: COLORS[i] }))
  const gmData = locs.map((l, i) => ({ name: l.split(' ')[0], full: l, value: results[l].gmPct * 100, fill: COLORS[i] }))
  const revPerClin = locs.map((l, i) => ({ name: l.split(' ')[0], full: l, value: results[l].revPerClin, fill: COLORS[i] }))
  const pieData = locs.filter(l => results[l].revenue > 0).map((l, i) => ({ name: l, value: results[l].revenue, fill: COLORS[i] }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white shadow-lg border rounded p-2 text-xs">
        <p className="font-bold">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && Math.abs(p.value) > 1 ? fmt(p.value) : pct(p.value / 100)}
          </p>
        ))}
      </div>
    )
  }

  // Totals for summary row
  const totalRev = locs.reduce((s, l) => s + results[l].revenue, 0)
  const totalNiD = locs.reduce((s, l) => s + results[l].niD, 0)
  const totalNiA = locs.reduce((s, l) => s + results[l].niA, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Location */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Revenue by Location</h3>
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Revenue">
                {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Data Table */}
          <div className="mt-3 overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Location</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {locs.map(loc => (
                  <tr key={loc} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 font-medium text-gray-700">{loc}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(results[loc].revenue)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{totalRev ? pct(results[loc].revenue / totalRev) : '0.0%'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                  <td className="px-2 py-1.5">TOTAL</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(totalRev)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Share Pie */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Revenue Share</h3>
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius="55%"
                label={({ name, percent }: any) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
                fontSize={9}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Revenue Share Table */}
          <div className="mt-3 overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Location</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Share</th>
                </tr>
              </thead>
              <tbody>
                {locs.filter(l => results[l].revenue > 0).map(loc => (
                  <tr key={loc} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 font-medium text-gray-700">{loc}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(results[loc].revenue)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{totalRev ? pct(results[loc].revenue / totalRev) : '0.0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Income Comparison */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Net Income: Direct vs Allocated</h3>
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
            <BarChart data={niData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="direct" name="Direct" fill="#548235" />
              <Bar dataKey="alloc" name="Allocated" fill="#BF8F00" />
            </BarChart>
          </ResponsiveContainer>
          {/* NI Data Table */}
          <div className="mt-3 overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Location</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">NI (Direct)</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">NI% (D)</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">NI (Alloc)</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">NI% (A)</th>
                </tr>
              </thead>
              <tbody>
                {locs.map(loc => {
                  const r = results[loc]
                  return (
                    <tr key={loc} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 font-medium text-gray-700">{loc}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.niD < 0 ? 'text-red-600' : ''}`}>{fmt(r.niD)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.niPctD < 0 ? 'text-red-600' : 'text-green-700'}`}>{pct(r.niPctD)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.niA < 0 ? 'text-red-600' : ''}`}>{fmt(r.niA)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.niPctA < 0 ? 'text-red-600' : 'text-green-700'}`}>{pct(r.niPctA)}</td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                  <td className="px-2 py-1.5">TOTAL</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${totalNiD < 0 ? 'text-red-600' : ''}`}>{fmt(totalNiD)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{totalRev ? pct(totalNiD / totalRev) : '-'}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${totalNiA < 0 ? 'text-red-600' : ''}`}>{fmt(totalNiA)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{totalRev ? pct(totalNiA / totalRev) : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gross Margin % */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Gross Margin %</h3>
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
            <BarChart data={gmData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v.toFixed(0)}%`} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="GM%">
                {gmData.map((d, i) => <Cell key={i} fill={d.value >= 50 ? '#22c55e' : d.value >= 30 ? '#eab308' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* GM% Data Table */}
          <div className="mt-3 overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Location</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">COGS</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">Gross Profit</th>
                  <th className="text-right px-2 py-1.5 font-medium text-gray-500">GM%</th>
                </tr>
              </thead>
              <tbody>
                {locs.map(loc => {
                  const r = results[loc]
                  return (
                    <tr key={loc} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 font-medium text-gray-700">{loc}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.revenue)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.cogsD)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.gpD)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${r.gmPct >= 0.5 ? 'text-green-700' : r.gmPct >= 0.3 ? 'text-yellow-700' : 'text-red-600'}`}>{pct(r.gmPct)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue per Clinician - full width */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Revenue per Clinician</h3>
        <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
          <BarChart data={revPerClin} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Rev/Clinician">
              {revPerClin.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Rev/Clinician Table */}
        <div className="mt-3 overflow-x-auto scroll-touch">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">Location</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Revenue</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Clinicians</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">Rev / Clinician</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500">NI / Clinician (D)</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const r = results[loc]
                return (
                  <tr key={loc} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 font-medium text-gray-700">{loc}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.revenue)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.clinHC}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmt(r.revPerClin)}</td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${r.niPerClinD < 0 ? 'text-red-600' : ''}`}>{fmt(r.niPerClinD)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Company Overview Table */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">Company Overview</h3>
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left px-2 py-2 font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 min-w-[120px]">Location</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">Revenue</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">GM%</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">NI (D)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">NI% (D)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">NI (A)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">NI% (A)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">Rev/Clin</th>
                <th className="text-right px-2 py-2 font-medium text-gray-600">Clinicians</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const r = results[loc]
                return (
                  <tr key={loc} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-2 font-medium text-gray-800 sticky left-0 bg-white z-10">{loc}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(r.revenue)}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${r.gmPct >= 0.5 ? 'text-green-700' : r.gmPct >= 0.3 ? 'text-yellow-700' : 'text-red-600'}`}>{pct(r.gmPct)}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${r.niD < 0 ? 'text-red-600' : ''}`}>{fmt(r.niD)}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${r.niPctD < 0 ? 'text-red-600' : 'text-green-700'}`}>{pct(r.niPctD)}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${r.niA < 0 ? 'text-red-600' : ''}`}>{fmt(r.niA)}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${r.niPctA < 0 ? 'text-red-600' : 'text-green-700'}`}>{pct(r.niPctA)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(r.revPerClin)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{r.clinHC}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <td className="px-2 py-2 sticky left-0 bg-gray-50 z-10">TOTAL</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(totalRev)}</td>
                <td className="px-2 py-2 text-right">-</td>
                <td className={`px-2 py-2 text-right tabular-nums ${totalNiD < 0 ? 'text-red-600' : ''}`}>{fmt(totalNiD)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{totalRev ? pct(totalNiD / totalRev) : '-'}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${totalNiA < 0 ? 'text-red-600' : ''}`}>{fmt(totalNiA)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{totalRev ? pct(totalNiA / totalRev) : '-'}</td>
                <td className="px-2 py-2 text-right">-</td>
                <td className="px-2 py-2 text-right tabular-nums">{locs.reduce((s, l) => s + results[l].clinHC, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
