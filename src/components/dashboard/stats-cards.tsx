import type { InventoryItem } from '@/lib/supabase/types'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import type { GrantWithSpending } from '@/lib/supabase/grants'

type StatsCardsProps = {
  items: InventoryItem[]
  calibrationsDue: EquipmentWithItem[]
  grants: GrantWithSpending[]
}

export function StatsCards({ items, calibrationsDue, grants }: StatsCardsProps) {
  const totalItems = items.length
  const lowStockCount = items.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  ).length
  const calibrationCount = calibrationsDue.length
  const activeGrants = grants.length
  const totalRemaining = grants.reduce((sum, g) => sum + g.remaining, 0)

  const cards = [
    {
      label: 'Total Items',
      value: totalItems,
      accent: 'bg-blue-500',
      textColor: '',
    },
    {
      label: 'Low Stock',
      value: lowStockCount,
      accent: 'bg-red-500',
      textColor: lowStockCount > 0 ? 'text-red-600' : '',
    },
    {
      label: 'Calibrations Due',
      value: calibrationCount,
      accent: 'bg-amber-500',
      textColor: calibrationCount > 0 ? 'text-amber-600' : '',
    },
    {
      label: 'Active Grants',
      value: activeGrants,
      accent: 'bg-emerald-500',
      textColor: '',
      subtitle:
        activeGrants > 0
          ? `$${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} remaining`
          : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${card.accent}`}
            />
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
          </div>
          <p
            className={`mt-3 text-3xl font-semibold ${card.textColor || 'text-gray-900'}`}
          >
            {card.value}
          </p>
          {card.subtitle && (
            <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  )
}
