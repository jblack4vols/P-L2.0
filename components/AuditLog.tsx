'use client'
import { useState, useEffect } from 'react'
import { fetchAuditLog, type AuditEntry } from '@/lib/auditLog'

type Props = { userId: string }

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  save: 'bg-green-100 text-green-700',
  export: 'bg-purple-100 text-purple-700',
  budget_save: 'bg-yellow-100 text-yellow-700',
  payroll_save: 'bg-orange-100 text-orange-700',
  scenario_create: 'bg-indigo-100 text-indigo-700',
}

export default function AuditLog({ userId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadEntries()
  }, [userId, filter, startDate, endDate])

  async function loadEntries() {
    setLoading(true)
    const data = await fetchAuditLog(userId, {
      actionType: filter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 200,
    })
    setEntries(data)
    setLoading(false)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Audit Log</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="save">Data Save</option>
          <option value="export">Export</option>
          <option value="budget_save">Budget Save</option>
          <option value="payroll_save">Payroll Save</option>
          <option value="scenario_create">Scenario</option>
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" placeholder="Start date" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" placeholder="End date" />
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-8">Loading audit log...</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No audit entries found.</div>
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="sm:hidden space-y-2">
            {entries.map(e => (
              <div key={e.id} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[e.action_type] || 'bg-gray-100 text-gray-600'}`}>
                    {e.action_type}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatDate(e.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700">{e.change_summary || '—'}</p>
                {e.location && <p className="text-xs text-gray-400 mt-1">{e.location} • {e.year || ''}</p>}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-500">Time</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Action</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Resource</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Year</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Location</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(e.created_at)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[e.action_type] || 'bg-gray-100 text-gray-600'}`}>
                        {e.action_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{e.resource_type}</td>
                    <td className="px-3 py-2 text-gray-500">{e.year || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{e.location || '—'}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[300px] truncate">{e.change_summary || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
