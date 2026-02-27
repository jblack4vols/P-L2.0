import { LOCATIONS, MONTHS, COGS_CATEGORIES, EXPENSE_CATEGORIES } from './constants'
import type { PLData } from './analysis'
import { buildEmptyPL } from './analysis'

/**
 * Parse a QuickBooks P&L CSV export and populate PLData.
 *
 * QuickBooks P&L CSV format (typical):
 * - Row 1+: header rows (company name, report title, date range)
 * - A column header row with month names
 * - Then rows like: "Category Name", value1, value2, ... value12, total
 *
 * We detect the month columns, then match category rows to our COGS/Expense categories.
 * Revenue rows should be under an "Income" or "Revenue" section.
 */

type ParseResult = {
  success: boolean
  data?: PLData
  warnings: string[]
  error?: string
  matchedRows: number
  unmatchedRows: string[]
}

// Normalize a string for fuzzy matching
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Try to match a CSV row label to a known category
function matchCategory(label: string, categories: readonly string[]): string | null {
  const n = norm(label)
  for (const cat of categories) {
    const nc = norm(cat)
    if (n === nc) return cat
    if (n.includes(nc) || nc.includes(n)) return cat
  }
  // Partial matching for common QB names
  const mapping: Record<string, string> = {
    'payroll': 'Payroll Expenses',
    'rent': 'Rent or Lease',
    'utilities': 'Utilities',
    'insurance': 'Insurance',
    'office supplies': 'Office Supplies',
    'repairs': 'Repairs & Maintenance',
    'depreciation': 'Depreciation',
    'advertising': 'Advertising',
    'professional fees': 'Professional Fees',
    'telephone': 'Telephone',
    'travel': 'Travel',
    'meals': 'Meals & Entertainment',
    'dues': 'Dues & Subscriptions',
    'bank': 'Bank Charges',
    'interest': 'Interest Expense',
    'taxes': 'Taxes & Licenses',
    'supplies': 'Medical Supplies',
    'lab': 'Lab Fees',
    'contract labor': 'Contract Labor',
    'billing': 'Billing Services',
    'software': 'Software & IT',
    'continuing ed': 'Continuing Education',
    'equipment': 'Equipment Lease',
    'laundry': 'Laundry & Cleaning',
    'marketing': 'Marketing',
    'bad debt': 'Bad Debt',
    'misc': 'Miscellaneous',
  }
  for (const [key, val] of Object.entries(mapping)) {
    if (n.includes(key)) return val
  }
  return null
}

// Detect which columns map to which months
function detectMonthColumns(header: string[]): Record<number, string> {
  const monthMap: Record<number, string> = {}
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const fullMonths = MONTHS as readonly string[]

  for (let i = 0; i < header.length; i++) {
    const h = header[i].toLowerCase().trim()
    for (let m = 0; m < monthNames.length; m++) {
      if (h.includes(monthNames[m])) {
        monthMap[i] = fullMonths[m]
        break
      }
    }
  }
  return monthMap
}

// Parse CSV text into rows (handles quoted fields)
function parseCSVText(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"'
          i++
        } else if (ch === '"') {
          inQuotes = false
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ',') {
          cells.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
    }
    cells.push(current.trim())
    rows.push(cells)
  }
  return rows
}

// Parse a dollar amount from various formats
function parseMoney(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/[$,\s"]/g, '').replace(/\((.+)\)/, '-$1')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

/**
 * Parse a QuickBooks CSV for a specific location.
 * The CSV should be a P&L for one location or you specify which entity it maps to.
 */
export function parseQuickBooksCSV(csvText: string, targetLocation: string): ParseResult {
  const warnings: string[] = []
  const unmatchedRows: string[] = []
  let matchedRows = 0

  try {
    const rows = parseCSVText(csvText)
    if (rows.length < 3) {
      return { success: false, error: 'CSV appears to be empty or too short.', warnings, matchedRows: 0, unmatchedRows: [] }
    }

    // Find the header row with month names
    let headerRowIdx = -1
    let monthColumns: Record<number, string> = {}

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const detected = detectMonthColumns(rows[i])
      if (Object.keys(detected).length >= 3) {
        headerRowIdx = i
        monthColumns = detected
        break
      }
    }

    if (headerRowIdx === -1) {
      return { success: false, error: 'Could not find month columns in the CSV header. Make sure the file is a QuickBooks P&L export.', warnings, matchedRows: 0, unmatchedRows: [] }
    }

    warnings.push(`Found ${Object.keys(monthColumns).length} month columns starting at row ${headerRowIdx + 1}`)

    const data = buildEmptyPL()
    let section: 'income' | 'cogs' | 'expense' | 'other' | 'unknown' = 'unknown'

    // Process data rows
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0]) continue
      const label = row[0].trim()
      const lowerLabel = label.toLowerCase()

      // Detect section headers
      if (lowerLabel.includes('income') || lowerLabel.includes('revenue') || lowerLabel.includes('sales')) {
        if (lowerLabel.includes('other income')) section = 'other'
        else if (lowerLabel.includes('total')) continue
        else section = 'income'
        continue
      }
      if (lowerLabel.includes('cost of') || lowerLabel.includes('cogs') || lowerLabel.includes('cost of goods')) {
        section = 'cogs'
        continue
      }
      if (lowerLabel.includes('expense') || lowerLabel.includes('operating')) {
        section = 'expense'
        continue
      }
      if (lowerLabel.includes('other expense')) {
        section = 'other'
        continue
      }
      if (lowerLabel.startsWith('total') || lowerLabel.startsWith('net') || lowerLabel.startsWith('gross')) continue

      // Skip indentation-only rows and section totals
      if (!label || label === '' || lowerLabel.startsWith('total')) continue

      // Extract values for each month
      const monthValues: Record<string, number> = {}
      let hasValues = false
      for (const [colIdx, month] of Object.entries(monthColumns)) {
        const val = parseMoney(row[parseInt(colIdx)] || '')
        if (val !== 0) hasValues = true
        monthValues[month] = val
      }

      if (!hasValues) continue

      const loc = targetLocation
      if (!data[loc]) continue

      if (section === 'income') {
        // Add as revenue
        for (const [month, val] of Object.entries(monthValues)) {
          data[loc].revenue[month] = (data[loc].revenue[month] || 0) + val
        }
        matchedRows++
      } else if (section === 'cogs') {
        const cat = matchCategory(label, COGS_CATEGORIES)
        if (cat) {
          for (const [month, val] of Object.entries(monthValues)) {
            if (!data[loc].cogs[month]) data[loc].cogs[month] = {}
            data[loc].cogs[month][cat] = (data[loc].cogs[month][cat] || 0) + Math.abs(val)
          }
          matchedRows++
        } else {
          unmatchedRows.push(`[COGS] ${label}`)
        }
      } else if (section === 'expense') {
        const cat = matchCategory(label, EXPENSE_CATEGORIES)
        if (cat) {
          for (const [month, val] of Object.entries(monthValues)) {
            if (!data[loc].expenses[month]) data[loc].expenses[month] = {}
            data[loc].expenses[month][cat] = (data[loc].expenses[month][cat] || 0) + Math.abs(val)
          }
          matchedRows++
        } else {
          unmatchedRows.push(`[Expense] ${label}`)
        }
      } else if (section === 'other') {
        for (const [month, val] of Object.entries(monthValues)) {
          if (val >= 0) {
            data[loc].otherIncome[month] = (data[loc].otherIncome[month] || 0) + val
          } else {
            data[loc].otherExpense[month] = (data[loc].otherExpense[month] || 0) + Math.abs(val)
          }
        }
        matchedRows++
      }
    }

    if (matchedRows === 0) {
      return { success: false, error: 'No matching data rows found. Check that the CSV is a standard QuickBooks P&L export.', warnings, matchedRows, unmatchedRows }
    }

    if (unmatchedRows.length > 0) {
      warnings.push(`${unmatchedRows.length} categories were not auto-matched and may need manual entry`)
    }

    return { success: true, data, warnings, matchedRows, unmatchedRows }
  } catch (err: any) {
    return { success: false, error: `Parse error: ${err.message}`, warnings, matchedRows, unmatchedRows }
  }
}
