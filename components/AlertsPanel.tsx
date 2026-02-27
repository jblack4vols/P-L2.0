'use client'
import type { TriggeredAlert } from '@/lib/alertThresholds'

type Props = { triggeredAlerts: TriggeredAlert[] }

export default function AlertsPanel({ triggeredAlerts }: Props) {
  if (triggeredAlerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">✅</span>
          <span className="text-sm font-medium text-green-800">All metrics within thresholds</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 mb-4">
      <h3 className="text-sm font-bold text-red-700 flex items-center gap-1">
        <span className="text-base">🚨</span> {triggeredAlerts.length} Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered
      </h3>
      {triggeredAlerts.map((a, i) => (
        <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
          <span className="font-medium">{a.config.alert_name}:</span> {a.message}
        </div>
      ))}
    </div>
  )
}
