'use client'

import { useState, useCallback } from 'react'
import type { InventoryItem } from '@/lib/supabase/types'
import { useLab } from '@/components/dashboard/lab-context'
import { useRealtimeInventory } from '@/hooks/use-realtime-inventory'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { ItemFormModal } from '@/components/inventory/item-form-modal'
import { CsvImportModal } from '@/components/inventory/csv-import'

interface InventoryPageClientProps {
  initialItems: InventoryItem[]
}

export function InventoryPageClient({ initialItems }: InventoryPageClientProps) {
  const { lab } = useLab()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Realtime: when another user changes inventory, bump the trigger to refetch
  const handleRealtimeUpdate = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  useRealtimeInventory(lab.id, handleRealtimeUpdate)

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
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <UploadIcon />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <InventoryFilters />

      {/* Table */}
      <InventoryTable
        initialItems={initialItems}
        onAddItem={() => setShowAddModal(true)}
        refetchTrigger={refetchTrigger}
      />

      {/* Add item modal */}
      <ItemFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          // Trigger refetch to show newly added item
          setRefetchTrigger((prev) => prev + 1)
        }}
        mode="create"
      />

      {/* CSV import modal */}
      <CsvImportModal
        open={showCsvImport}
        onClose={() => {
          setShowCsvImport(false)
          // Trigger refetch to show imported items
          setRefetchTrigger((prev) => prev + 1)
        }}
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

function UploadIcon() {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}
