import type { InventoryItem } from '@/lib/supabase/types'

const statusConfig: Record<
  InventoryItem['status'],
  { label: string; className: string }
> = {
  in_stock: {
    label: 'In Stock',
    className: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  low_stock: {
    label: 'Low Stock',
    className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  },
  out_of_stock: {
    label: 'Out of Stock',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-500 ring-gray-500/20',
  },
}

export function StatusBadge({ status }: { status: InventoryItem['status'] }) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}
