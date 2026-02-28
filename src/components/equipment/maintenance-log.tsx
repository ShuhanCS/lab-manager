'use client'

import { useState } from 'react'
import type { MaintenanceLog } from '@/lib/supabase/types'
import { MaintenanceForm } from './maintenance-form'

interface MaintenanceLogListProps {
  equipmentId: string
  logs: MaintenanceLog[]
  onLogAdded: () => void
}

const typeConfig: Record<
  MaintenanceLog['type'],
  { label: string; className: string }
> = {
  calibration: {
    label: 'Calibration',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  repair: {
    label: 'Repair',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  inspection: {
    label: 'Inspection',
    className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  },
  cleaning: {
    label: 'Cleaning',
    className: 'bg-green-50 text-green-700 ring-green-600/20',
  },
}

export function MaintenanceLogList({
  equipmentId,
  logs,
  onLogAdded,
}: MaintenanceLogListProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Maintenance History
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Add Entry
        </button>
      </div>

      {/* Add entry form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <MaintenanceForm
            equipmentId={equipmentId}
            onSuccess={() => {
              setShowForm(false)
              onLogAdded()
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No maintenance records yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {logs.map((log) => {
            const config = typeConfig[log.type]
            return (
              <li key={log.id} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <div className="flex-1 w-px bg-gray-200" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>

                  {log.description && (
                    <p className="mt-1 text-sm text-gray-700">{log.description}</p>
                  )}

                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                    {log.cost != null && log.cost > 0 && (
                      <span>Cost: ${log.cost.toFixed(2)}</span>
                    )}
                    {log.next_due && (
                      <span>
                        Next due: {new Date(log.next_due).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  )
}
