'use client'

import { useState } from 'react'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import { EquipmentGrid } from '@/components/equipment/equipment-grid'
import { EquipmentFormModal } from '@/components/equipment/equipment-form-modal'

interface EquipmentPageClientProps {
  initialEquipment: EquipmentWithItem[]
}

export function EquipmentPageClient({
  initialEquipment,
}: EquipmentPageClientProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Equipment
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Register and track lab equipment, calibrations, and maintenance.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Add Equipment
        </button>
      </div>

      {/* Equipment grid */}
      <EquipmentGrid items={initialEquipment} />

      {/* Add equipment modal */}
      <EquipmentFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="create"
      />
    </div>
  )
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
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
