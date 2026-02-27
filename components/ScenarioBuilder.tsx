'use client'
import { useState } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { saveScenario, deleteScenario, applyScenario, type Scenario, type ScenarioAdjustment } from '@/lib/scenarioEngine'
import { fmt, pct, type PLData, type AnalysisResult, type HeadcountData } from '@/lib/analysis'

type Props = {
  userId: string
  year: number
  plData: PLData
  headcount: HeadcountData
  selectedMonths: string[]
  currentAnalysis: AnalysisResult | null
  scenarios: Scenario[]
  onRefresh: () => void
}

export default function ScenarioBuilder({ userId, year, plData, headcount, selectedMonths, currentAnalysis, scenarios, onRefresh }: Props) {
  const [editing, setEditing] = useState<{ name: string; adjustments: ScenarioAdjustment[]; id?: string } | null>(null)
  const [comparison, setComparison] = useState<{ name: string; result: AnalysisResult } | null>(null)
  const [saving, setSaving] = useState(false)

  function addAdjustment() {
    if (!editing) return
    setEditing({
      ...editing,
      adjustments: [...editing.adjustments, { location: 'all', metric: 'revenue', adjust_type: 'pct', value: 0 }],
    })
  }

  function updateAdj(idx: number, field: string, val: any) {
    if (!editing) return
    const adjs = [...editing.adjustments]
    adjs[idx] = { ...adjs[idx], [field]: val }
    setEditing({ ...editing, adjustments: adjs })
  }

  function removeAdj(idx: number) {
    if (!editing) return
    setEditing({ ...editing, adjustments: editing.adjustments.filter((_, i) => i !== idx) })
  }

  async function handleSave() {
    if (!editing?.name || editing.adjustments.length === 0) return
    setSaving(true)
    await saveScenario({ id: editing.id, user_id: userId, name: editing.name, year, adjustments: editing.adjustments })
    setSaving(false)
    setEditing(null)
    onRefresh()
  }

  function handleCompare(scenario: Scenario) {
    const result = applyScenario(plData, headcount, scenario.adjustments, selectedMonths)
    setComparison({ name: scenario.name, result })
  }

  async function handleDeleteScenario(id: string) {
    if (!confirm('Delete this scenario?')) return
    await deleteScenario(id)
    onRefresh()
  }

  const locs = [...LOCATIONS] as string[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">What-If Scenarios</h2>
        <button onClick={() => setEditing({ name: '', adjustments: [{ location: 'all', metric: 'revenue', adjust_type: 'pct', value: 0 }] })}
          className="px-4 py-1.5 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange-hover min-h-[36px]">
          + New Scenario
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <input placeholder="Scenario Name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 min-h-[36px]" />
          <div className="space-y-2 mb-3">
            {editing.adjustments.map((adj, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-lg p-2">
                <select value={adj.location} onChange={e => updateAdj(i, 'location', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs min-h-[32px]">
                  <option value="all">All Locations</option>
                  {locs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={adj.metric} onChange={e => updateAdj(i, 'metric', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs min-h-[32px]">
                  <option value="revenue">Revenue</option>
                  <option value="cogs">COGS</option>
                  <option value="expenses">Expenses</option>
                </select>
                <select value={adj.adjust_type} onChange={e => updateAdj(i, 'adjust_type', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs min-h-[32px]">
                  <option value="pct">% Change</option>
                  <option value="flat">$ Flat</option>
                </select>
                <input type="number" value={adj.value} onChange={e => updateAdj(i, 'value', parseFloat(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right min-h-[32px]" />
                <button onClick={() => removeAdj(i)} className="text-red-500 text-xs hover:underline">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addAdjustment} className="text-xs text-brand-orange hover:underline">+ Add Adjustment</button>
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm min-h-[32px]">Cancel</button>
            <button onClick={handleSave} disabled={saving || !editing.name}
              className="px-4 py-1.5 bg-brand-orange text-white rounded text-sm font-medium disabled:opacity-50 min-h-[32px]">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Saved scenarios */}
      {scenarios.length === 0 && !editing ? (
        <div className="text-gray-400 text-center py-8">No scenarios yet. Create one to model different outcomes.</div>
      ) : (
        <div className="space-y-2 mb-6">
          {scenarios.map(s => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-gray-500">{s.adjustments.length} adjustment{s.adjustments.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCompare(s)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Compare</button>
                <button onClick={() => setEditing({ id: s.id, name: s.name, adjustments: s.adjustments })} className="text-xs text-brand-orange hover:underline">Edit</button>
                <button onClick={() => handleDeleteScenario(s.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison view */}
      {comparison && currentAnalysis && (
        <div>
          <h3 className="text-md font-bold text-gray-800 mb-3">Actual vs "{comparison.name}"</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Location</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Actual Rev</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Scenario Rev</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Actual NI</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Scenario NI</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Actual GM%</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Scenario GM%</th>
                </tr>
              </thead>
              <tbody>
                {locs.map(loc => {
                  const a = currentAnalysis.results[loc]
                  const s = comparison.result.results[loc]
                  if (!a || !s) return null
                  return (
                    <tr key={loc} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium">{loc}</td>
                      <td className="px-3 py-2 text-right">{fmt(a.revenue)}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{fmt(s.revenue)}</td>
                      <td className="px-3 py-2 text-right">{fmt(a.niD)}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{fmt(s.niD)}</td>
                      <td className="px-3 py-2 text-right">{pct(a.gmPct)}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{pct(s.gmPct)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button onClick={() => setComparison(null)} className="mt-3 text-xs text-gray-500 hover:underline">Close comparison</button>
        </div>
      )}
    </div>
  )
}
