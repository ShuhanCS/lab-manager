'use client'

import type { InventoryItem } from '@/lib/supabase/types'

interface ReorderButtonProps {
  item: InventoryItem
}

/**
 * Shows a reorder link/button for items linked to a ConductScience product.
 *
 * - low_stock / out_of_stock -> solid blue button (prominent)
 * - in_stock -> subtle text link
 * - no conductscience_product_id -> renders nothing
 */
export function ReorderButton({ item }: ReorderButtonProps) {
  if (!item.conductscience_product_id) return null

  // Build the product URL: conductscience.com product page.
  // The ID is stored; we link to the generic product URL pattern.
  const url = `https://conductscience.com/?p=${item.conductscience_product_id}`

  const isUrgent =
    item.status === 'low_stock' || item.status === 'out_of_stock'

  if (isUrgent) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <CartIcon className="h-4 w-4" />
        Reorder
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
    >
      <CartIcon className="h-3.5 w-3.5" />
      Reorder
    </a>
  )
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}
