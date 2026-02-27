export const LOCATIONS = [
  "Bean Station", "Jefferson City", "Johnson City", "Maryville",
  "Morristown", "New Tazewell", "Newport", "Rogersville"
] as const

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const

export const STAFF_ROLES = ["PT","PTA","OT","COTA","TECH","FD"] as const

export const COGS_CATEGORIES = [
  "Clinical Supplies","COTA Wages & Taxes","Equipment Tax & Shipping",
  "Medical Director","Merchant Service Fees","OT Wages & Taxes",
  "PTA Wages & Taxes","PT Wages & Taxes","TECH Wages & Taxes"
] as const

export const EXPENSE_CATEGORIES = [
  "Subcontractor Services","Labor - Admin","Labor - Billing","Labor - Front Desk",
  "Labor - Marketing","Labor - Owner","Labor - Payroll Taxes","Labor - Referral Dept",
  "Employee Benefits","Additional Employee Expenses","Automobile","Bank Charges",
  "Dues & Memberships","Insurance","Marketing","Office Expenses",
  "Professional Development","Professional Fees","Rent & Lease","Utilities",
  "Technology & Software","Charitable Contributions","Meals & Entertainment",
  "Travel","IT Services","Payroll Fees","Repairs & Maintenance","Miscellaneous"
] as const

export const COLORS = ["#ff8200","#000000","#c46500","#44546A","#7030A0","#548235","#BF8F00","#C00000"]

export const DEFAULT_HEADCOUNT: Record<string, Record<string, number>> = {
  "Bean Station":   {PT:1,PTA:2,OT:1,COTA:1,TECH:1,FD:2},
  "Jefferson City":  {PT:2,PTA:1,OT:2,COTA:0,TECH:1,FD:1},
  "Johnson City":   {PT:0,PTA:0,OT:0,COTA:0,TECH:0,FD:0},
  "Maryville":      {PT:2,PTA:1,OT:1,COTA:0,TECH:1,FD:1},
  "Morristown":     {PT:4,PTA:2,OT:3,COTA:1,TECH:2,FD:2},
  "New Tazewell":   {PT:2,PTA:1,OT:1,COTA:0,TECH:1,FD:1},
  "Newport":        {PT:2,PTA:2,OT:2,COTA:1,TECH:1,FD:1},
  "Rogersville":    {PT:1,PTA:1,OT:2,COTA:0,TECH:1,FD:2},
}
