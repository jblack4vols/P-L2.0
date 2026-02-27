'use client'
import { MONTHS } from '@/lib/constants'

type Props = { selected: string[]; setSelected: (m: string[]) => void }

export default function MonthSelector({ selected, setSelected }: Props) {
  const all = [...MONTHS]
  const allSelected = selected.length === 12
  const quarters = [
    { label: 'Q1', months: ['Jan','Feb','Mar'] },
    { label: 'Q2', months: ['Apr','May','Jun'] },
    { label: 'Q3', months: ['Jul','Aug','Sep'] },
    { label: 'Q4', months: ['Oct','Nov','Dec'] },
  ]

  return (
    <div className="mb-4">
      {/* Quick select row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <button onClick={() => setSelected(allSelected ? [] : [...all])}
          className={`px-2.5 py-1.5 rounded text-xs font-medium border transition min-h-[32px] ${
            allSelected ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-orange'
          }`}>All</button>
        {quarters.map(q => {
          const qOn = q.months.every(m => selected.includes(m))
          return (
            <button key={q.label}
              onClick={() => setSelected(qOn ? selected.filter(x => !q.months.includes(x)) : Array.from(new Set([...selected, ...q.months])))}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border transition min-h-[32px] hidden sm:inline-flex ${
                qOn ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-500 border-gray-300 hover:border-brand-orange'
              }`}>{q.label}</button>
          )
        })}
      </div>
      {/* Individual months */}
      <div className="flex flex-wrap items-center gap-1">
        {all.map(m => {
          const on = selected.includes(m)
          return (
            <button key={m}
              onClick={() => setSelected(on ? selected.filter(x => x !== m) : [...selected, m])}
              className={`px-2 py-1.5 rounded text-xs font-medium border transition min-h-[30px] min-w-[38px] ${
                on ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-500 border-gray-300 hover:border-brand-orange'
              }`}>{m}</button>
          )
        })}
      </div>
    </div>
  )
}
