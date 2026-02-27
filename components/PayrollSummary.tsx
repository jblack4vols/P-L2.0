'use client'
import { computePayrollSummary, type Employee, type PayrollHours } from '@/lib/payrollCalculator'

type Props = {
  employees: Employee[]
  hours: PayrollHours[]
  selectedMonths: string[]
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function PayrollSummary({ employees, hours, selectedMonths }: Props) {
  const rows = computePayrollSummary(employees, hours, selectedMonths)
  const totals = rows.reduce((acc, r) => ({
    emps: acc.emps + r.totalEmployees,
    reg: acc.reg + r.totalRegularPay,
    ot: acc.ot + r.totalOvertimePay,
    gross: acc.gross + r.totalGrossPay,
    tax: acc.tax + r.estimatedTaxes,
    total: acc.total + r.totalLaborCost,
  }), { emps: 0, reg: 0, ot: 0, gross: 0, tax: 0, total: 0 })

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Payroll Summary</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total Employees</div>
          <div className="text-xl font-bold text-gray-800">{totals.emps}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Gross Pay</div>
          <div className="text-xl font-bold text-gray-800">{fmt(totals.gross)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Est. Taxes (22%)</div>
          <div className="text-xl font-bold text-gray-800">{fmt(totals.tax)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total Labor Cost</div>
          <div className="text-xl font-bold text-brand-orange">{fmt(totals.total)}</div>
        </div>
      </div>

      {/* Table view (all screen sizes) */}
      <div className="overflow-x-auto scroll-touch">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium text-gray-500">Location</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Employees</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Regular Pay</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">OT Pay</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Gross Pay</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Est. Taxes</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.location} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.location}</td>
                <td className="px-3 py-2 text-right">{r.totalEmployees}</td>
                <td className="px-3 py-2 text-right">{fmt(r.totalRegularPay)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.totalOvertimePay)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.totalGrossPay)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.estimatedTaxes)}</td>
                <td className="px-3 py-2 text-right font-bold text-brand-orange">{fmt(r.totalLaborCost)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2 text-right">{totals.emps}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.reg)}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.ot)}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.gross)}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.tax)}</td>
              <td className="px-3 py-2 text-right text-brand-orange">{fmt(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
