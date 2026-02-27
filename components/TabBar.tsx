'use client'

const TABS = [
  { id: 'input', label: 'Data Input', icon: '📊', group: 'data' },
  { id: 'summary', label: 'Summary', icon: '📋', group: 'analysis' },
  { id: 'dashboard', label: 'Dashboard', icon: '📈', group: 'analysis' },
  { id: 'scorecard', label: 'Scorecard', icon: '🏆', group: 'analysis' },
  { id: 'breakeven', label: 'Break-Even', icon: '⚖️', group: 'analysis' },
  { id: 'detail', label: 'Location', icon: '📍', group: 'analysis' },
  { id: 'budget', label: 'Budgets', icon: '🎯', group: 'planning' },
  { id: 'yoy', label: 'YoY', icon: '📅', group: 'planning' },
  { id: 'payroll', label: 'Payroll', icon: '💰', group: 'planning' },
  { id: 'scenarios', label: 'Scenarios', icon: '🔮', group: 'planning' },
  { id: 'alerts', label: 'Alerts', icon: '🚨', group: 'tools' },
  { id: 'audit', label: 'Audit', icon: '📝', group: 'tools' },
]

type Props = { active: string; setActive: (t: string) => void; alertCount?: number }

export default function TabBar({ active, setActive, alertCount = 0 }: Props) {
  return (
    <>
      {/* Desktop: top tabs */}
      <div className="hidden sm:block border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-0 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition relative ${
                  active === t.id
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                {t.label}
                {t.id === 'alerts' && alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile: bottom tab bar — show 6 most used + more menu */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <nav className="flex overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex flex-col items-center py-2 px-2 text-[9px] font-medium transition min-w-[52px] relative ${
                active === t.id ? 'text-brand-orange' : 'text-gray-400'
              }`}>
              <span className="text-sm mb-0.5">{t.icon}</span>
              <span className="truncate w-full text-center">{t.label.split(' ')[0]}</span>
              {t.id === 'alerts' && alertCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
