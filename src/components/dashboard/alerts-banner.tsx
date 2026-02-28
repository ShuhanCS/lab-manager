'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { InventoryItem } from '@/lib/supabase/types'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'

type AlertsBannerProps = {
  labSlug: string
  lowStockItems: InventoryItem[]
  overdueCalibrations: {
    equipment: EquipmentWithItem
    daysOverdue: number
  }[]
  expiringItems: {
    item: InventoryItem
    daysUntilExpiry: number
  }[]
}

export function AlertsBanner({
  labSlug,
  lowStockItems,
  overdueCalibrations,
  expiringItems,
}: AlertsBannerProps) {
  const [expanded, setExpanded] = useState(false)

  const totalAlerts =
    lowStockItems.length + overdueCalibrations.length + expiringItems.length

  if (totalAlerts === 0) return null

  // Red if anything is overdue or out of stock, otherwise yellow
  const hasRed =
    overdueCalibrations.length > 0 ||
    lowStockItems.some((i) => i.status === 'out_of_stock')

  const bgColor = hasRed ? 'bg-red-50' : 'bg-amber-50'
  const borderColor = hasRed ? 'border-red-200' : 'border-amber-200'
  const iconColor = hasRed ? 'text-red-500' : 'text-amber-500'
  const textColor = hasRed ? 'text-red-800' : 'text-amber-800'

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center justify-between text-left ${textColor}`}
      >
        <div className="flex items-center gap-2">
          <AlertIcon className={`h-5 w-5 ${iconColor}`} />
          <span className="text-sm font-semibold">
            {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''} need attention
          </span>
        </div>
        <ChevronIcon expanded={expanded} className={`h-4 w-4 ${iconColor}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Low stock alerts */}
          {lowStockItems.length > 0 && (
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>
                Low Stock
              </h4>
              <ul className="mt-1.5 space-y-1">
                {lowStockItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className={textColor}>
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-1 text-xs opacity-75">
                        ({item.quantity} {item.unit})
                      </span>
                    </span>
                    <Link
                      href={`/${labSlug}/inventory/${item.id}`}
                      className={`text-xs font-medium underline ${textColor} hover:opacity-75`}
                    >
                      Reorder
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Overdue calibrations */}
          {overdueCalibrations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-red-800">
                Overdue Calibrations
              </h4>
              <ul className="mt-1.5 space-y-1">
                {overdueCalibrations.map(({ equipment, daysOverdue }) => (
                  <li
                    key={equipment.id}
                    className="flex items-center justify-between text-sm text-red-800"
                  >
                    <span>
                      <span className="font-medium">
                        {equipment.inventory_items.name}
                      </span>
                      <span className="ml-1 text-xs opacity-75">
                        {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                      </span>
                    </span>
                    <Link
                      href={`/${labSlug}/equipment/${equipment.id}`}
                      className="text-xs font-medium underline hover:opacity-75"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expiring items */}
          {expiringItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Expiring Soon
              </h4>
              <ul className="mt-1.5 space-y-1">
                {expiringItems.map(({ item, daysUntilExpiry }) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm text-amber-800"
                  >
                    <span>
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-1 text-xs opacity-75">
                        {daysUntilExpiry <= 0
                          ? 'Expired'
                          : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`}
                      </span>
                    </span>
                    <Link
                      href={`/${labSlug}/inventory/${item.id}`}
                      className="text-xs font-medium underline hover:opacity-75"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}

function ChevronIcon({
  expanded,
  className,
}: {
  expanded: boolean
  className?: string
}) {
  return (
    <svg
      className={`${className} transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  )
}
