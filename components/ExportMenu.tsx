'use client'
import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '@/lib/excelExport'
import { exportToPDF } from '@/lib/pdfExport'
import type { PLData, AnalysisResult } from '@/lib/analysis'

type Props = {
  year: number
  selectedMonths: string[]
  plData: PLData
  analysis: AnalysisResult | null
  headcount: Record<string, Record<string, number>>
}

export default function ExportMenu({ year, selectedMonths, plData, analysis, headcount }: Props) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleExcelExport() {
    setExporting(true)
    setError('')
    try {
      exportToExcel({ year, selectedMonths, plData, analysis, headcount })
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handlePdfExport() {
    setExporting(true)
    setError('')
    try {
      exportToPDF({ year, selectedMonths, analysis })
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-cream text-brand-orange rounded-lg text-sm font-medium hover:bg-orange-100 transition min-h-[36px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleExcelExport}
            disabled={exporting}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-green-600 text-lg">📊</span>
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            onClick={handlePdfExport}
            disabled={exporting}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-red-600 text-lg">📄</span>
            {exporting ? 'Exporting...' : 'Export to PDF'}
          </button>
          {error && (
            <div className="px-4 py-2 text-xs text-red-600 border-t border-gray-100">{error}</div>
          )}
        </div>
      )}
    </div>
  )
}
