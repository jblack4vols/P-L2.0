'use client'
import { useState, useRef } from 'react'
import { LOCATIONS, MONTHS, COGS_CATEGORIES, EXPENSE_CATEGORIES, STAFF_ROLES, DEFAULT_HEADCOUNT } from '@/lib/constants'
import { parseQuickBooksCSV } from '@/lib/csvParser'
import type { PLData, HeadcountData } from '@/lib/analysis'

type Props = {
  plData: PLData
  setPlData: (d: PLData) => void
  headcount: HeadcountData
  setHeadcount: (h: HeadcountData) => void
}

const INPUT_TABS = ['Revenue', 'COGS', 'Expenses', 'Other', 'Headcount', 'Corporate']

function cellClassStatic() {
  return 'w-full px-1.5 py-1.5 text-right text-sm border border-gray-200 rounded focus:ring-2 focus:ring-brand-orange focus:border-transparent min-h-[36px]'
}

function CategoryGrid({ entities, cats, getter, setter }: {
  entities: string[]
  cats: readonly string[]
  getter: (ent: string, m: string, cat: string) => number
  setter: (ent: string, m: string, cat: string, v: number) => void
}) {
  const [selEntity, setSelEntity] = useState(entities[0])
  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        {entities.map(e => (
          <button key={e} onClick={() => setSelEntity(e)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border whitespace-nowrap min-h-[32px] ${
              selEntity === e ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >{e}</button>
        ))}
      </div>
      <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-1.5 sticky left-0 bg-gray-50 min-w-[160px] z-10">Category</th>
              {[...MONTHS].map(m => <th key={m} className="text-right p-1.5 min-w-[80px]">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {cats.map(cat => (
              <tr key={cat} className="border-t border-gray-100">
                <td className="p-1.5 sticky left-0 bg-white font-medium text-gray-700 truncate max-w-[160px] z-10" title={cat}>{cat}</td>
                {[...MONTHS].map(m => (
                  <td key={m} className="p-0.5">
                    <input type="number" step="0.01"
                      className={cellClassStatic()}
                      value={getter(selEntity, m, cat) || ''}
                      onChange={e => setter(selEntity, m, cat, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DataInput({ plData, setPlData, headcount, setHeadcount }: Props) {
  const [subTab, setSubTab] = useState('Revenue')
  const [csvLocation, setCsvLocation] = useState(([...LOCATIONS] as string[])[0])
  const [csvStatus, setCsvStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' })
  const [csvWarnings, setCsvWarnings] = useState<string[]>([])
  const [showCsvImport, setShowCsvImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locs = [...LOCATIONS] as string[]

  function cellClass() {
    return 'w-full px-1.5 py-1.5 text-right text-sm border border-gray-200 rounded focus:ring-2 focus:ring-brand-orange focus:border-transparent min-h-[36px]'
  }

  function updateRevenue(loc: string, month: string, val: number) {
    const next = { ...plData }
    next[loc] = { ...next[loc], revenue: { ...next[loc].revenue, [month]: val } }
    setPlData(next)
  }

  function updateCogs(entity: string, month: string, cat: string, val: number) {
    const next = { ...plData }
    const ent = next[entity] || { revenue: {}, cogs: {}, expenses: {}, otherIncome: {}, otherExpense: {} }
    next[entity] = {
      ...ent,
      cogs: { ...ent.cogs, [month]: { ...(ent.cogs?.[month] || {}), [cat]: val } }
    }
    setPlData(next)
  }

  function updateExpense(entity: string, month: string, cat: string, val: number) {
    const next = { ...plData }
    const ent = next[entity] || { revenue: {}, cogs: {}, expenses: {}, otherIncome: {}, otherExpense: {} }
    next[entity] = {
      ...ent,
      expenses: { ...ent.expenses, [month]: { ...(ent.expenses?.[month] || {}), [cat]: val } }
    }
    setPlData(next)
  }

  function updateOther(entity: string, month: string, field: 'otherIncome' | 'otherExpense', val: number) {
    const next = { ...plData }
    const ent = next[entity] || { revenue: {}, cogs: {}, expenses: {}, otherIncome: {}, otherExpense: {} }
    next[entity] = { ...ent, [field]: { ...(ent[field] || {}), [month]: val } }
    setPlData(next)
  }

  function updateHC(loc: string, role: string, val: number) {
    const next = { ...headcount }
    next[loc] = { ...next[loc], [role]: val }
    setHeadcount(next)
  }

  function loadDefaults() {
    setHeadcount({ ...DEFAULT_HEADCOUNT })
  }

  // CSV Import handler
  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvStatus({ type: 'idle', message: 'Parsing...' })
    setCsvWarnings([])

    try {
      const text = await file.text()
      const result = parseQuickBooksCSV(text, csvLocation)

      if (result.success && result.data) {
        // Merge parsed data into existing plData
        const next = { ...plData }
        const parsed = result.data
        for (const loc of locs) {
          if (!parsed[loc]) continue
          // Merge revenue
          for (const m of [...MONTHS] as string[]) {
            if (parsed[loc].revenue[m]) {
              if (!next[loc]) continue
              next[loc] = { ...next[loc], revenue: { ...next[loc].revenue, [m]: parsed[loc].revenue[m] } }
            }
          }
          // Merge COGS
          for (const m of [...MONTHS] as string[]) {
            if (parsed[loc].cogs[m]) {
              if (!next[loc]) continue
              next[loc] = {
                ...next[loc],
                cogs: { ...next[loc].cogs, [m]: { ...next[loc].cogs[m], ...parsed[loc].cogs[m] } }
              }
            }
          }
          // Merge expenses
          for (const m of [...MONTHS] as string[]) {
            if (parsed[loc].expenses[m]) {
              if (!next[loc]) continue
              next[loc] = {
                ...next[loc],
                expenses: { ...next[loc].expenses, [m]: { ...next[loc].expenses[m], ...parsed[loc].expenses[m] } }
              }
            }
          }
          // Merge other
          for (const m of [...MONTHS] as string[]) {
            if (parsed[loc].otherIncome[m]) {
              next[loc] = { ...next[loc], otherIncome: { ...next[loc].otherIncome, [m]: parsed[loc].otherIncome[m] } }
            }
            if (parsed[loc].otherExpense[m]) {
              next[loc] = { ...next[loc], otherExpense: { ...next[loc].otherExpense, [m]: parsed[loc].otherExpense[m] } }
            }
          }
        }
        setPlData(next)

        const msg = `Imported ${result.matchedRows} rows for ${csvLocation}.`
        setCsvStatus({ type: 'success', message: msg })
        setCsvWarnings(result.warnings)
        if (result.unmatchedRows.length > 0) {
          setCsvWarnings(prev => [...prev, ...result.unmatchedRows.map(r => `Unmatched: ${r}`)])
        }
      } else {
        setCsvStatus({ type: 'error', message: result.error || 'Failed to parse CSV.' })
        setCsvWarnings(result.warnings)
      }
    } catch (err: any) {
      setCsvStatus({ type: 'error', message: `Error reading file: ${err.message}` })
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      {/* CSV Import Section */}
      <div className="mb-4">
        <button onClick={() => setShowCsvImport(!showCsvImport)}
          className="flex items-center gap-2 px-3 py-2 bg-brand-cream text-brand-orange rounded-lg text-sm font-medium hover:bg-orange-100 transition w-full sm:w-auto justify-center sm:justify-start min-h-[40px]">
          <span>{showCsvImport ? '▼' : '▶'}</span>
          <span>Import from QuickBooks CSV</span>
        </button>

        {showCsvImport && (
          <div className="mt-3 p-3 sm:p-4 bg-brand-cream rounded-lg border border-orange-200">
            <p className="text-xs text-gray-600 mb-3">
              Export your P&L from QuickBooks as CSV, then upload it here. Select which location it belongs to.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <select value={csvLocation} onChange={e => setCsvLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[40px]">
                  {locs.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">CSV File</label>
                <input ref={fileInputRef} type="file" accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand-orange file:text-white hover:file:bg-orange-700 file:min-h-[36px] file:cursor-pointer"
                />
              </div>
            </div>

            {csvStatus.type !== 'idle' && (
              <div className={`mt-3 p-2 rounded text-xs ${
                csvStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {csvStatus.message}
              </div>
            )}

            {csvWarnings.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800 max-h-[120px] overflow-y-auto">
                {csvWarnings.map((w, i) => <div key={i}>{w}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-tab selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-touch pb-1 no-scrollbar">
        {INPUT_TABS.map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition whitespace-nowrap min-h-[36px] ${
              subTab === t ? 'bg-brand-cream text-brand-orange' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{t}</button>
        ))}
      </div>

      {subTab === 'Revenue' && (
        <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-1.5 sticky left-0 bg-gray-50 min-w-[120px] z-10">Location</th>
                {[...MONTHS].map(m => <th key={m} className="text-right p-1.5 min-w-[80px]">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => (
                <tr key={loc} className="border-t border-gray-100">
                  <td className="p-1.5 font-medium text-gray-700 sticky left-0 bg-white z-10">{loc}</td>
                  {[...MONTHS].map(m => (
                    <td key={m} className="p-0.5">
                      <input type="number" step="0.01"
                        className={cellClass()}
                        value={plData[loc]?.revenue[m] || ''}
                        onChange={e => updateRevenue(loc, m, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'COGS' && <CategoryGrid
        entities={locs} cats={COGS_CATEGORIES}
        getter={(ent, m, cat) => plData[ent]?.cogs?.[m]?.[cat] ?? 0}
        setter={(ent, m, cat, v) => updateCogs(ent, m, cat, v)}
      />}

      {subTab === 'Expenses' && <CategoryGrid
        entities={locs} cats={EXPENSE_CATEGORIES}
        getter={(ent, m, cat) => plData[ent]?.expenses?.[m]?.[cat] ?? 0}
        setter={(ent, m, cat, v) => updateExpense(ent, m, cat, v)}
      />}

      {subTab === 'Corporate' && (
        <div>
          <p className="text-xs sm:text-sm text-gray-500 mb-3">
            Enter corporate/admin costs that will be allocated to locations by revenue share.
          </p>
          <CategoryGrid
            entities={['Corporate']} cats={[...COGS_CATEGORIES, ...EXPENSE_CATEGORIES]}
            getter={(ent, m, cat) => {
              return (plData['Corporate']?.cogs?.[m]?.[cat] ?? 0) + (plData['Corporate']?.expenses?.[m]?.[cat] ?? 0)
            }}
            setter={(ent, m, cat, v) => {
              if ((COGS_CATEGORIES as readonly string[]).includes(cat)) updateCogs('Corporate', m, cat, v)
              else updateExpense('Corporate', m, cat, v)
            }}
          />
        </div>
      )}

      {subTab === 'Other' && (
        <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-1.5 sticky left-0 bg-gray-50 z-10 min-w-[100px]">Entity</th>
                <th className="text-left p-1.5 min-w-[70px]">Type</th>
                {[...MONTHS].map(m => <th key={m} className="text-right p-1.5 min-w-[80px]">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...locs, 'Corporate'].map(ent => (
                ['otherIncome', 'otherExpense'].map(field => (
                  <tr key={`${ent}-${field}`} className="border-t border-gray-100">
                    <td className="p-1.5 font-medium text-gray-700 sticky left-0 bg-white z-10">{ent}</td>
                    <td className="p-1.5 text-gray-500">{field === 'otherIncome' ? 'Income' : 'Expense'}</td>
                    {[...MONTHS].map(m => (
                      <td key={m} className="p-0.5">
                        <input type="number" step="0.01"
                          className={cellClass()}
                          value={plData[ent]?.[field as 'otherIncome' | 'otherExpense']?.[m] || ''}
                          onChange={e => updateOther(ent, m, field as 'otherIncome' | 'otherExpense', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'Headcount' && (
        <div>
          <button onClick={loadDefaults}
            className="mb-3 px-3 py-2 bg-brand-cream text-brand-orange rounded text-xs font-medium hover:bg-orange-100 min-h-[36px]">
            Load TriStar Defaults
          </button>
          <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 sticky left-0 bg-gray-50 z-10 min-w-[120px]">Location</th>
                  {[...STAFF_ROLES].map(r => <th key={r} className="text-center p-2 min-w-[55px]">{r}</th>)}
                  <th className="text-center p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {locs.map(loc => {
                  const hc = headcount[loc] || {}
                  const total = [...STAFF_ROLES].reduce((s, r) => s + (hc[r] || 0), 0)
                  return (
                    <tr key={loc} className="border-t border-gray-100">
                      <td className="p-2 font-medium sticky left-0 bg-white z-10">{loc}</td>
                      {[...STAFF_ROLES].map(r => (
                        <td key={r} className="p-1">
                          <input type="number" min="0" step="1"
                            className="w-full px-1 py-1.5 text-center text-sm border border-gray-200 rounded focus:ring-2 focus:ring-brand-orange min-h-[36px]"
                            value={hc[r] || ''}
                            onChange={e => updateHC(loc, r, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center font-bold text-brand-orange">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
