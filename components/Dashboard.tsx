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

  const revenueData = locs.map((l, i) => ({ name: l.split(' ')[0], value: results[l].revenue, fill: COLORS[i] }))
  const niData = locs.map((l, i) => ({ name: l.split(' ')[0], direct: results[l].niD, alloc: results[l].niA, fill: COLORS[i] }))
  const gmData = locs.map((l, i) => ({ name: l.split(' ')[0], value: results[l].gmPct * 100, fill: COLORS[i] }))
  const revPerClin = locs.map((l, i) => ({ name: l.split(' ')[0], value: results[l].revPerClin, fill: COLORS[i] }))
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

  return (
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
      </div>

      {/* Revenue per Clinician */}
      <div className="bg-white rounded-lg border p-3 sm:p-4 lg:col-span-2">
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
      </div>
    </div>
  )
}
