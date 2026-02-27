'use client'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'
import ExportMenu from './ExportMenu'
import type { PLData, AnalysisResult } from '@/lib/analysis'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  email: string
  year: number
  setYear: (y: number) => void
  saveStatus: SaveStatus
  onSave: () => void
  dirty: boolean
  selectedMonths: string[]
  plData: PLData
  analysis: AnalysisResult | null
  headcount: Record<string, Record<string, number>>
  alertCount?: number
}

function statusBadge(s: SaveStatus) {
  if (s === 'saving') return <span className="text-brand-cream text-xs animate-pulse">Saving...</span>
  if (s === 'saved') return <span className="text-green-300 text-xs">Saved</span>
  if (s === 'error') return <span className="text-red-300 text-xs">Save failed</span>
  return null
}

export default function Header({ email, year, setYear, saveStatus, onSave, dirty, selectedMonths, plData, analysis, headcount, alertCount = 0 }: Props) {
  function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.signOut().then(() => { window.location.href = '/login' })
  }

  return (
    <header className="bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image src="/logo.svg" alt="TriStar PT" width={36} height={36} className="rounded-full flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap text-brand-orange">TriStar PT</h1>
            <span className="text-gray-400 text-xs hidden sm:inline">P&L Analyzer</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1.5 text-sm min-h-[36px] focus:border-brand-orange">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <button onClick={onSave} disabled={saveStatus === 'saving'}
              className={`px-3 py-1.5 rounded text-sm font-medium transition active:scale-95 min-h-[36px] ${
                dirty ? 'bg-brand-orange hover:bg-brand-orange-hover text-white ring-2 ring-orange-300' : 'bg-brand-orange hover:bg-brand-orange-hover text-white'
              } disabled:opacity-50`}>
              {saveStatus === 'saving' ? 'Saving...' : dirty ? 'Save *' : 'Save'}
            </button>
            <ExportMenu year={year} selectedMonths={selectedMonths} plData={plData} analysis={analysis} headcount={headcount} />
            {alertCount > 0 && (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-40"></span>
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{alertCount}</span>
              </span>
            )}
            <span className="hidden sm:inline">{statusBadge(saveStatus)}</span>
          </div>
          <span className="text-gray-400 text-xs hidden lg:inline truncate max-w-[140px]">{email}</span>
          <button onClick={handleLogout}
            className="text-gray-400 hover:text-brand-orange text-xs sm:text-sm underline whitespace-nowrap transition">
            Logout
          </button>
        </div>
      </div>
      {saveStatus !== 'idle' && (
        <div className="sm:hidden bg-gray-900 px-3 py-1 text-center">{statusBadge(saveStatus)}</div>
      )}
    </header>
  )
}
