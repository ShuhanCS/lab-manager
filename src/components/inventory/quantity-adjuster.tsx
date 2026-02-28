'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateQuantity } from '@/lib/supabase/inventory'
import { StatusBadge } from './status-badge'
import type { InventoryItem } from '@/lib/supabase/types'

interface QuantityAdjusterProps {
  item: InventoryItem
  /** Called after a successful server update with the new item data */
  onUpdated?: (item: InventoryItem) => void
}

/**
 * Compute status client-side for optimistic updates.
 */
function computeStatusLocal(
  quantity: number,
  minThreshold: number
): InventoryItem['status'] {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= minThreshold) return 'low_stock'
  return 'in_stock'
}

export function QuantityAdjuster({ item, onUpdated }: QuantityAdjusterProps) {
  const [localItem, setLocalItem] = useState(item)
  const [adjusting, setAdjusting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync with parent when item prop changes (e.g. from realtime)
  // We compare IDs + updated_at to avoid overwriting optimistic state during adjusting
  if (!adjusting && item.updated_at !== localItem.updated_at) {
    setLocalItem(item)
  }

  const handleDelta = useCallback(
    async (delta: number) => {
      const newQuantity = Math.max(0, localItem.quantity + delta)

      // Can't go below 0 — if already 0 and decrementing, do nothing
      if (delta < 0 && localItem.quantity <= 0) return

      // Optimistic update
      const optimisticItem: InventoryItem = {
        ...localItem,
        quantity: newQuantity,
        status: computeStatusLocal(newQuantity, localItem.min_threshold),
      }
      setLocalItem(optimisticItem)
      setAdjusting(true)
      setError(null)

      try {
        const supabase = createClient()
        const updated = await updateQuantity(supabase, localItem.id, delta)
        setLocalItem(updated)
        onUpdated?.(updated)
      } catch (err) {
        // Revert optimistic update
        setLocalItem(localItem)
        setError('Failed to update quantity. Please try again.')
        console.error('Quantity update failed:', err)
      } finally {
        setAdjusting(false)
      }
    },
    [localItem, onUpdated]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Decrease button — min 44px touch target */}
        <button
          onClick={() => handleDelta(-1)}
          disabled={adjusting || localItem.quantity <= 0}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          -
        </button>

        {/* Current quantity + unit */}
        <div className="text-center min-w-[80px]">
          <p className="text-3xl font-bold text-gray-900 tabular-nums">
            {localItem.quantity}
          </p>
          <p className="text-sm text-gray-400">{localItem.unit}</p>
        </div>

        {/* Increase button — min 44px touch target */}
        <button
          onClick={() => handleDelta(1)}
          disabled={adjusting}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          +
        </button>

        {/* Status badge — auto-updates */}
        <StatusBadge status={localItem.status} />
      </div>

      {/* Low-stock threshold info */}
      {localItem.min_threshold > 0 && (
        <p className="text-xs text-gray-400">
          Low-stock alert at {localItem.min_threshold} {localItem.unit}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
