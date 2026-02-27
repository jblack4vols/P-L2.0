'use client'
import { useState } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { saveAlert, deleteAlert, METRIC_OPTIONS, type AlertConfig as AlertConfigType } from '@/lib/alertThresholds'

type Props = {
  userId: string
  alerts: AlertConfigType[]
  onRefresh: () => void
}

export default function AlertConfig({ userId, alerts, onRefresh }: Props) {
  const [editing, setEditing] = useState<Partial<AlertConfigType> | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!editing?.alert_name || !editing?.metric_type) return
    setSaving(true)
    await saveAlert({ ...editing, user_id: userId } as any)
    setSaving(false)
    setEditing(null)
    onRefresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this alert?')) return
    await deleteAlert(id)
    onRefresh()
  }

  async function handleToggle(alert: AlertConfigType) {
    await saveAlert({ ...alert, is_active: !alert.is_active })
    onRefresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Alert Thresholds</h2>
        <button onClick={() => setEditing({ alert_name: '', metric_type: 'GM%', threshold_value: 0.5, comparison_op: 'lt', scope: 'all', location: null, is_active: true })}
          className="px-4 py-1.5 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange-hover min-h-[36px]">
          + Add Alert
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing.id ? 'Edit Alert' : 'New Alert'}</h3>
            <div className="space-y-3">
              <input placeholder="Alert Name" value={editing.alert_name || ''} onChange={e => setEditing({ ...editing, alert_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              <select value={editing.metric_type || ''} onChange={e => setEditing({ ...editing, metric_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                {METRIC_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={editing.comparison_op || 'lt'} onChange={e => setEditing({ ...editing, comparison_op: e.target.value as any })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                  <option value="lt">Less than</option>
                  <option value="lte">Less than or equal</option>
                  <option value="gt">Greater than</option>
                  <option value="gte">Greater than or equal</option>
                </select>
                <input type="number" step="0.01" placeholder="Threshold" value={editing.threshold_value ?? ''}
                  onChange={e => setEditing({ ...editing, threshold_value: parseFloat(e.target.value) || 0 })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              </div>
              <p className="text-xs text-gray-400">For percentages, use decimal (e.g., 0.50 for 50%)</p>
              <select value={editing.scope || 'all'} onChange={e => setEditing({ ...editing, scope: e.target.value as any, location: e.target.value === 'all' ? null : LOCATIONS[0] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                <option value="all">All Locations</option>
                <option value="specific">Specific Location</option>
              </select>
              {editing.scope === 'specific' && (
                <select value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                  {[...LOCATIONS].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving || !editing.alert_name}
                className="flex-1 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium disabled:opacity-50 min-h-[36px]">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm min-h-[36px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No alerts configured. Add one to get started.</div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`bg-white rounded-lg border p-3 flex items-center justify-between ${a.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div>
                <div className="font-medium text-sm">{a.alert_name}</div>
                <div className="text-xs text-gray-500">
                  {a.metric_type} {a.comparison_op === 'lt' ? '<' : a.comparison_op === 'gt' ? '>' : a.comparison_op === 'lte' ? '≤' : '≥'}{' '}
                  {a.metric_type.includes('%') ? (a.threshold_value * 100).toFixed(0) + '%' : a.threshold_value}
                  {a.scope === 'specific' ? ` • ${a.location}` : ' • All locations'}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => handleToggle(a)} className={`text-xs px-2 py-1 rounded ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.is_active ? 'Active' : 'Off'}
                </button>
                <button onClick={() => setEditing(a)} className="text-xs text-brand-orange hover:underline">Edit</button>
                <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
