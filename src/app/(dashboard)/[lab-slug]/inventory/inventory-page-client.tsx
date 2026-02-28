'use client'

import { useState } from 'react'
import type { InventoryItem } from '@/lib/supabase/types'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { ItemFormModal } from '@/components/inventory/item-form-modal'

interface InventoryPageClientProps {
  initialItems: InventoryItem[]
}

export function InventoryPageClient({ initialItems }: InventoryPageClientProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your lab supplies, reagents, and equipment.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <InventoryFilters />

      {/* Table */}
      <InventoryTable
        initialItems={initialItems}
        onAddItem={() => setShowAddModal(true)}
      />

      {/* Add item modal */}
      <ItemFormModal
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
