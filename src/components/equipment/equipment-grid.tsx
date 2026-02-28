'use client'

import { useState, useMemo } from 'react'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import type { Equipment } from '@/lib/supabase/types'
import { EquipmentCard } from './equipment-card'

interface EquipmentGridProps {
  items: EquipmentWithItem[]
}

type StatusFilter = 'all' | Equipment['status']

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'decommissioned', label: 'Decommissioned' },
]

export function EquipmentGrid({ items }: EquipmentGridProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((eq) => eq.status === filter)
  }, [items, filter])

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <EquipmentPlaceholderIcon />
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'all'
              ? 'No equipment registered yet'
              : `No ${filter} equipment`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} />
          ))}
        </div>
      )}
    </div>
  )
}

function EquipmentPlaceholderIcon() {
  return (
    <svg
      className="mx-auto h-10 w-10 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
      />
    </svg>
  )
}
