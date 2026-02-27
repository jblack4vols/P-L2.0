'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MONTHS } from '@/lib/constants'
import { buildEmptyPL, runAnalysis } from '@/lib/analysis'
import { savePLData, loadPLData, saveHeadcount, loadHeadcount } from '@/lib/database'
import { getSeedPLData } from '@/lib/seedData'
import { DEFAULT_HEADCOUNT } from '@/lib/constants'
import { logAudit } from '@/lib/auditLog'
import { loadBudget, saveBudget, buildEmptyBudget } from '@/lib/budgetAnalysis'
import { loadEmployees, loadPayrollHours } from '@/lib/payrollCalculator'
import { loadAlerts, checkAlerts } from '@/lib/alertThresholds'
import { loadScenarios } from '@/lib/scenarioEngine'
import type { PLData, HeadcountData, AnalysisResult } from '@/lib/analysis'
import type { BudgetData } from '@/lib/budgetAnalysis'
import type { Employee, PayrollHours } from '@/lib/payrollCalculator'
import type { AlertConfig as AlertConfigType, TriggeredAlert } from '@/lib/alertThresholds'
import type { Scenario } from '@/lib/scenarioEngine'
import Header from '@/components/Header'
import type { SaveStatus } from '@/components/Header'
import TabBar from '@/components/TabBar'
import MonthSelector from '@/components/MonthSelector'
import DataInput from '@/components/DataInput'
import SummaryTable from '@/components/SummaryTable'
import Dashboard from '@/components/Dashboard'
import Scorecard from '@/components/Scorecard'
import BreakEven from '@/components/BreakEven'
import LocationDetail from '@/components/LocationDetail'
import AuditLog from '@/components/AuditLog'
import BudgetInput from '@/components/BudgetInput'
import BudgetComparison from '@/components/BudgetComparison'
import YoYAnalysis from '@/components/YoYAnalysis'
import PayrollInput from '@/components/PayrollInput'
import PayrollSummary from '@/components/PayrollSummary'
import AlertConfig from '@/components/AlertConfig'
import AlertsPanel from '@/components/AlertsPanel'
import ScenarioBuilder from '@/components/ScenarioBuilder'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const AUTO_SAVE_DELAY = 5000

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [dirty, setDirty] = useState(false)
  const [year, setYear] = useState(2025)
  const [tab, setTab] = useState('input')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([...MONTHS])
  const [plData, setPlData] = useState<PLData>(buildEmptyPL())
  const [headcount, setHeadcount] = useState<HeadcountData>({})
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [toast, setToast] = useState('')

  // Budget state
  const [budget, setBudget] = useState<BudgetData>(buildEmptyBudget())
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [budgetTab, setBudgetTab] = useState<'input' | 'comparison'>('comparison')

  // Payroll state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollHours, setPayrollHours] = useState<PayrollHours[]>([])
  const [payrollTab, setPayrollTab] = useState<'roster' | 'summary'>('summary')

  // Alerts state
  const [alertConfigs, setAlertConfigs] = useState<AlertConfigType[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([])
  const [alertTab, setAlertTab] = useState<'config' | 'active'>('active')

  // Scenarios state
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingData = useRef(false)

  // Auth check + login audit
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        logAudit(data.user.id, 'login', 'auth', { summary: 'User logged in' })
      } else {
        window.location.href = '/login'
      }
      setLoading(false)
    })
  }, [])

  // Load data when year changes
  useEffect(() => {
    if (!user) return
    isLoadingData.current = true
    async function load() {
      const [pl, hc, bud] = await Promise.all([
        loadPLData(user.id, year),
        loadHeadcount(user.id, year),
        loadBudget(user.id, year),
      ])
      if (pl) setPlData(pl)
      else if (year === 2025) setPlData(getSeedPLData())
      else setPlData(buildEmptyPL())
      if (hc) setHeadcount(hc)
      else if (year === 2025) setHeadcount({...DEFAULT_HEADCOUNT})
      else setHeadcount({})
      if (bud) setBudget(bud)
      else setBudget(buildEmptyBudget())
      setDirty(false)
      setSaveStatus('idle')
      setTimeout(() => { isLoadingData.current = false }, 500)
    }
    load()
  }, [user, year])

  // Load employees, alerts, scenarios (not year-specific for employees)
  useEffect(() => {
    if (!user) return
    loadEmployees(user.id).then(setEmployees)
    loadPayrollHours(user.id, year).then(setPayrollHours)
    loadAlerts(user.id).then(setAlertConfigs)
    loadScenarios(user.id, year).then(setScenarios)
  }, [user, year])

  // Recompute analysis
  useEffect(() => {
    if (selectedMonths.length === 0) { setAnalysis(null); return }
    const result = runAnalysis(plData, headcount, selectedMonths)
    setAnalysis(result)
  }, [plData, headcount, selectedMonths])

  // Check alerts when analysis or configs change
  useEffect(() => {
    const triggered = checkAlerts(alertConfigs, analysis)
    setTriggeredAlerts(triggered)
  }, [alertConfigs, analysis])

  // Save handler
  const doSave = useCallback(async () => {
    if (!user) return
    setSaveStatus('saving')
    const [ok1, ok2] = await Promise.all([
      savePLData(user.id, year, plData),
      saveHeadcount(user.id, year, headcount),
    ])
    if (ok1 && ok2) {
      setSaveStatus('saved')
      setDirty(false)
      logAudit(user.id, 'save', 'pl_data', { year, summary: `Saved P&L + headcount for ${year}` })
      setTimeout(() => setSaveStatus('idle'), 3000)
    } else {
      setSaveStatus('error')
      setToast('Save failed — please try again.')
      setTimeout(() => { setToast(''); setSaveStatus('idle') }, 5000)
    }
  }, [user, year, plData, headcount])

  const handleSetPlData = useCallback((newData: PLData) => {
    setPlData(newData)
    if (!isLoadingData.current) {
      setDirty(true)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => { doSave() }, AUTO_SAVE_DELAY)
    }
  }, [doSave])

  const handleSetHeadcount = useCallback((newHC: HeadcountData) => {
    setHeadcount(newHC)
    if (!isLoadingData.current) {
      setDirty(true)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => { doSave() }, AUTO_SAVE_DELAY)
    }
  }, [doSave])

  function handleSave() {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    doSave()
  }

  async function handleBudgetSave() {
    if (!user) return
    setBudgetSaving(true)
    const ok = await saveBudget(user.id, year, budget)
    setBudgetSaving(false)
    if (ok) {
      logAudit(user.id, 'budget_save', 'budget', { year, summary: `Saved budget for ${year}` })
      setToast('Budget saved!')
      setTimeout(() => setToast(''), 3000)
    } else {
      setToast('Budget save failed')
      setTimeout(() => setToast(''), 4000)
    }
  }

  function refreshEmployees() {
    if (!user) return
    loadEmployees(user.id).then(setEmployees)
  }

  function refreshAlerts() {
    if (!user) return
    loadAlerts(user.id).then(setAlertConfigs)
  }

  function refreshScenarios() {
    if (!user) return
    loadScenarios(user.id, year).then(setScenarios)
  }

  useEffect(() => {
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        email={user?.email || ''}
        year={year}
        setYear={setYear}
        saveStatus={saveStatus}
        onSave={handleSave}
        dirty={dirty}
        selectedMonths={selectedMonths}
        plData={plData}
        analysis={analysis}
        headcount={headcount}
        alertCount={triggeredAlerts.length}
      />
      <TabBar active={tab} setActive={setTab} alertCount={triggeredAlerts.length} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        {tab !== 'input' && tab !== 'audit' && tab !== 'payroll' && (
          <MonthSelector selected={selectedMonths} setSelected={setSelectedMonths} />
        )}

        {tab === 'input' && (
          <DataInput plData={plData} setPlData={handleSetPlData} headcount={headcount} setHeadcount={handleSetHeadcount} />
        )}
        {tab === 'summary' && <SummaryTable analysis={analysis} />}
        {tab === 'dashboard' && <Dashboard analysis={analysis} />}
        {tab === 'scorecard' && <Scorecard analysis={analysis} />}
        {tab === 'breakeven' && <BreakEven analysis={analysis} />}
        {tab === 'detail' && (
          <LocationDetail plData={plData} headcount={headcount} analysis={analysis} selectedMonths={selectedMonths} />
        )}

        {/* Budget tab */}
        {tab === 'budget' && (
          <div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setBudgetTab('comparison')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${budgetTab === 'comparison' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Variance
              </button>
              <button onClick={() => setBudgetTab('input')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${budgetTab === 'input' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Enter Budget
              </button>
            </div>
            {budgetTab === 'input' ? (
              <BudgetInput budget={budget} setBudget={setBudget} onSave={handleBudgetSave} saving={budgetSaving} />
            ) : (
              <BudgetComparison plData={plData} budget={budget} selectedMonths={selectedMonths} />
            )}
          </div>
        )}

        {/* YoY tab */}
        {tab === 'yoy' && user && (
          <YoYAnalysis userId={user.id} year={year} selectedMonths={selectedMonths} currentAnalysis={analysis} />
        )}

        {/* Payroll tab */}
        {tab === 'payroll' && user && (
          <div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setPayrollTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${payrollTab === 'summary' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Summary
              </button>
              <button onClick={() => setPayrollTab('roster')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${payrollTab === 'roster' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Roster
              </button>
            </div>
            {payrollTab === 'roster' ? (
              <PayrollInput userId={user.id} employees={employees} setEmployees={setEmployees} onRefresh={refreshEmployees} />
            ) : (
              <PayrollSummary employees={employees} hours={payrollHours} selectedMonths={selectedMonths} />
            )}
          </div>
        )}

        {/* Scenarios tab */}
        {tab === 'scenarios' && user && (
          <ScenarioBuilder
            userId={user.id} year={year} plData={plData} headcount={headcount}
            selectedMonths={selectedMonths} currentAnalysis={analysis}
            scenarios={scenarios} onRefresh={refreshScenarios}
          />
        )}

        {/* Alerts tab */}
        {tab === 'alerts' && user && (
          <div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setAlertTab('active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${alertTab === 'active' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Active Alerts
              </button>
              <button onClick={() => setAlertTab('config')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px] ${alertTab === 'config' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Configure
              </button>
            </div>
            {alertTab === 'active' ? (
              <AlertsPanel triggeredAlerts={triggeredAlerts} />
            ) : (
              <AlertConfig userId={user.id} alerts={alertConfigs} onRefresh={refreshAlerts} />
            )}
          </div>
        )}

        {/* Audit tab */}
        {tab === 'audit' && user && (
          <AuditLog userId={user.id} />
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all z-50 ${
          toast.includes('failed') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast}
        </div>
      )}
    </div>
  )
}
