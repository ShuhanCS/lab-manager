import type { Equipment } from '@/lib/supabase/types'

const statusConfig: Record<
  Equipment['status'],
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  },
  decommissioned: {
    label: 'Decommissioned',
    className: 'bg-gray-100 text-gray-500 ring-gray-500/20',
  },
}

export function EquipmentStatusBadge({ status }: { status: Equipment['status'] }) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}
