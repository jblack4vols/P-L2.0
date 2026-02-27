'use client'
import { useState, useRef } from 'react'
import { LOCATIONS } from '@/lib/constants'
import { saveEmployee, deleteEmployee, parseEmployeeCSV, type Employee } from '@/lib/payrollCalculator'

type Props = {
  userId: string
  employees: Employee[]
  setEmployees: (e: Employee[]) => void
  onRefresh: () => void
}

const EMPTY: Partial<Employee> = {
  name: '', location: LOCATIONS[0], department: 'Clinical', job_role: '',
  hourly_rate: 0, salary_annual: 0, is_hourly: true, status: 'active', hire_date: '',
}

export default function PayrollInput({ userId, employees, setEmployees, onRefresh }: Props) {
  const [editing, setEditing] = useState<Partial<Employee> | null>(null)
  const [selLoc, setSelLoc] = useState<string | 'all'>('all')
  const [saving, setSaving] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = selLoc === 'all' ? employees : employees.filter(e => e.location === selLoc)

  async function handleSave() {
    if (!editing?.name) return
    setSaving(true)
    const ok = await saveEmployee({ ...editing, user_id: userId })
    setSaving(false)
    if (ok) { setEditing(null); onRefresh() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this employee?')) return
    const ok = await deleteEmployee(id)
    if (ok) onRefresh()
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseEmployeeCSV(text, userId)
    if (parsed.length === 0) { setImportMsg('No valid rows found in CSV'); return }
    setSaving(true)
    let count = 0
    for (const emp of parsed) {
      const ok = await saveEmployee({ ...emp, user_id: userId } as any)
      if (ok) count++
    }
    setSaving(false)
    setImportMsg(`Imported ${count} of ${parsed.length} employees`)
    onRefresh()
    if (fileRef.current) fileRef.current.value = ''
    setTimeout(() => setImportMsg(''), 4000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800">Employees</h2>
        <div className="flex gap-2">
          <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer min-h-[36px] flex items-center">
            Import CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => setEditing({ ...EMPTY })}
            className="px-4 py-1.5 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange-hover min-h-[36px]">
            + Add Employee
          </button>
        </div>
      </div>

      {importMsg && <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{importMsg}</div>}

      {/* Location filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        <button onClick={() => setSelLoc('all')}
          className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
            selLoc === 'all' ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
          }`}>All ({employees.length})</button>
        {[...LOCATIONS].map(loc => {
          const c = employees.filter(e => e.location === loc).length
          return (
            <button key={loc} onClick={() => setSelLoc(loc)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
                selLoc === loc ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
              }`}>{loc} ({c})</button>
          )
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing.id ? 'Edit Employee' : 'New Employee'}</h3>
            <div className="space-y-3">
              <input placeholder="Full Name" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              <select value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                {[...LOCATIONS].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input placeholder="Department" value={editing.department || ''} onChange={e => setEditing({ ...editing, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              <input placeholder="Job Role" value={editing.job_role || ''} onChange={e => setEditing({ ...editing, job_role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={editing.is_hourly === true} onChange={() => setEditing({ ...editing, is_hourly: true })} /> Hourly
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={editing.is_hourly === false} onChange={() => setEditing({ ...editing, is_hourly: false })} /> Salary
                </label>
              </div>
              {editing.is_hourly ? (
                <input type="number" placeholder="Hourly Rate" value={editing.hourly_rate || ''} step="0.01"
                  onChange={e => setEditing({ ...editing, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              ) : (
                <input type="number" placeholder="Annual Salary" value={editing.salary_annual || ''} step="1000"
                  onChange={e => setEditing({ ...editing, salary_annual: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              )}
              <input type="date" value={editing.hire_date || ''} onChange={e => setEditing({ ...editing, hire_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]" />
              <select value={editing.status || 'active'} onChange={e => setEditing({ ...editing, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[36px]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving || !editing.name}
                className="flex-1 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium disabled:opacity-50 min-h-[36px]">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium min-h-[36px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee list */}
      {filtered.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No employees. Add one or import CSV.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => (
            <div key={emp.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{emp.name}</div>
                <div className="text-xs text-gray-500">
                  {emp.location} • {emp.department} • {emp.job_role}
                  {emp.status === 'inactive' && <span className="ml-1 text-red-500">(inactive)</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {emp.is_hourly ? `$${emp.hourly_rate}/hr` : `$${emp.salary_annual.toLocaleString()}/yr`}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(emp)} className="text-xs text-brand-orange hover:underline">Edit</button>
                <button onClick={() => handleDelete(emp.id)} className="text-xs text-red-500 hover:underline ml-2">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
