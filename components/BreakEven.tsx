'use client'
import { LOCATIONS } from '@/lib/constants'
import { fmt, pct } from '@/lib/analysis'
import type { AnalysisResult } from '@/lib/analysis'

type Props = { analysis: AnalysisResult | null }

export default function BreakEven({ analysis }: Props) {
  if (!analysis) return <p className="text-gray-400 p-8 text-center">No data to display.</p>

  const { results } = analysis
  const locs = [...LOCATIONS] as string[]

  return (
    <div>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        Break-even revenue = Fixed Costs / CM%. Margin of Safety shows how far above (or below) break-even each location is.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {locs.map(loc => {
          const r = results[loc]
          if (!r) return null
          const aboveDirect = r.mosD > 0
          const aboveAlloc = r.mosA > 0

          // Progress bar: how close to break-even (capped at 200%)
          const beProgressD = r.beD > 0 ? Math.min((r.revenue / r.beD) * 100, 200) : 100
          const beProgressA = r.beA > 0 ? Math.min((r.revenue / r.beA) * 100, 200) : 100

          return (
            <div key={loc} className="bg-white rounded-lg border p-3 sm:p-4 shadow-sm">
              <h4 className="font-bold text-gray-800 text-sm mb-2 sm:mb-3">{loc}</h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-medium">{fmt(r.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CM</span>
                  <span className="font-medium">{fmt(r.cm)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CM%</span>
                  <span className="font-medium">{pct(r.cmPct)}</span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="text-gray-600 font-medium mb-1">Direct View</div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Break-Even</span>
                    <span className="font-medium">{fmt(r.beD)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 mb-1">
                    <div className={`h-1.5 rounded-full ${aboveDirect ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(beProgressD, 100)}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MoS</span>
                    <span className={`font-bold ${aboveDirect ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosD)} ({pct(r.mosPctD)})</span>
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="text-gray-600 font-medium mb-1">Allocated View</div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Break-Even</span>
                    <span className="font-medium">{fmt(r.beA)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 mb-1">
                    <div className={`h-1.5 rounded-full ${aboveAlloc ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(beProgressA, 100)}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MoS</span>
                    <span className={`font-bold ${aboveAlloc ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.mosA)} ({pct(r.mosPctA)})</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
