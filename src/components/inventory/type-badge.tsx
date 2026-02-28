import type { InventoryItem } from '@/lib/supabase/types'

const typeConfig: Record<
  InventoryItem['type'],
  { label: string; className: string }
> = {
  equipment: {
    label: 'Equipment',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  reagent: {
    label: 'Reagent',
    className: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  },
  consumable: {
    label: 'Consumable',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  chemical: {
    label: 'Chemical',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
}

export function TypeBadge({ type }: { type: InventoryItem['type'] }) {
  const config = typeConfig[type]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}
