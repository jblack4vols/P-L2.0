import { LOCATIONS } from './constants'
import { fmt, pct, type AnalysisResult } from './analysis'

declare global {
  interface Window { html2pdf: any }
}

export function exportToPDF(opts: { year: number; selectedMonths: string[]; analysis: AnalysisResult | null }) {
  const { year, selectedMonths, analysis } = opts
  if (!analysis) throw new Error('No analysis data to export')
  if (typeof window === 'undefined' || !window.html2pdf) throw new Error('PDF library not loaded. Refresh the page.')

  const monthLabel = selectedMonths.length === 12 ? 'Full Year' : selectedMonths.join(', ')
  const locs = [...LOCATIONS] as string[]
  const { results, sortedLocs, composite } = analysis
  const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; max-width: 1000px; margin: 0 auto;">
      <!-- Cover -->
      <div style="text-align: center; padding: 80px 20px 40px;">
        <div style="font-size: 14px; color: #ff8200; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">TRISTAR PHYSICAL THERAPY</div>
        <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 8px;">P&L Analysis Report</h1>
        <p style="font-size: 16px; color: #666;">${year} &mdash; ${monthLabel}</p>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">Generated ${now}</p>
      </div>

      <div style="page-break-before: always;"></div>

      <!-- Executive Summary -->
      <h2 style="font-size: 18px; color: #ff8200; border-bottom: 2px solid #ff8200; padding-bottom: 6px; margin: 20px 0 12px;">Executive Summary</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Location</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Revenue</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">GM%</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Net Income</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">NI%</th>
          </tr>
        </thead>
        <tbody>
          ${locs.map(loc => {
            const r = results[loc]
            return `<tr>
              <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: 500;">${loc}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.revenue)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${pct(r.gmPct)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.niD)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; color: ${r.niPctD >= 0 ? '#16a34a' : '#dc2626'};">${pct(r.niPctD)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>

      <div style="page-break-before: always;"></div>

      <!-- Scorecard -->
      <h2 style="font-size: 18px; color: #ff8200; border-bottom: 2px solid #ff8200; padding-bottom: 6px; margin: 20px 0 12px;">Performance Scorecard</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Rank</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Location</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Grade</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Revenue</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">GM%</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">NI%</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Rev/Clin</th>
          </tr>
        </thead>
        <tbody>
          ${sortedLocs.map((loc, idx) => {
            const r = results[loc]
            const g = composite[loc]
            const p = g / locs.length
            const grade = p <= 0.25 ? 'A' : p <= 0.5 ? 'B' : p <= 0.75 ? 'C' : 'D'
            const gradeColor = grade === 'A' ? '#16a34a' : grade === 'B' ? '#2563eb' : grade === 'C' ? '#d97706' : '#dc2626'
            return `<tr>
              <td style="padding: 6px 8px; border: 1px solid #ddd;">${idx + 1}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: 500;">${loc}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-weight: 700; color: ${gradeColor};">${grade}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.revenue)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${pct(r.gmPct)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${pct(r.niPctD)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.revPerClin)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>

      <div style="page-break-before: always;"></div>

      <!-- Break-Even -->
      <h2 style="font-size: 18px; color: #ff8200; border-bottom: 2px solid #ff8200; padding-bottom: 6px; margin: 20px 0 12px;">Break-Even Analysis</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Location</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Revenue</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">CM%</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">BE Point</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Margin of Safety</th>
          </tr>
        </thead>
        <tbody>
          ${locs.map(loc => {
            const r = results[loc]
            return `<tr>
              <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: 500;">${loc}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.revenue)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${pct(r.cmPct)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${fmt(r.beD)}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; color: ${r.mosD >= 0 ? '#16a34a' : '#dc2626'};">${fmt(r.mosD)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 40px; padding: 20px; color: #999; font-size: 10px;">
        TriStar Physical Therapy &mdash; Confidential
      </div>
    </div>
  `

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  const filename = `TriStar_PT_PL_Report_${year}.pdf`
  window.html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css'] },
    })
    .from(container)
    .save()
    .then(() => { document.body.removeChild(container) })
    .catch((err: any) => { document.body.removeChild(container); throw err })
}
