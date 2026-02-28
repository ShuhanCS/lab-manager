'use client'

import { useLab } from '@/components/dashboard/lab-context'

export default function LabDashboard() {
  const { lab, role } = useLab()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Welcome to {lab.name}
      </h1>
      {lab.institution && (
        <p className="mt-1 text-sm text-gray-500">{lab.institution}</p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Your role: {role}
      </p>

      {/* Placeholder content — will be replaced in Task 15 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Inventory Items', value: '--' },
          { label: 'Equipment', value: '--' },
          { label: 'Active Grants', value: '--' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
