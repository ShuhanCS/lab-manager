'use client'

import Link from 'next/link'
import { useLab } from '@/components/dashboard/lab-context'
import { EquipmentStatusBadge } from './equipment-status-badge'
import { CalibrationIndicator } from './calibration-indicator'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'

interface EquipmentCardProps {
  equipment: EquipmentWithItem
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { lab } = useLab()

  const warrantyExpired =
    equipment.warranty_expires && new Date(equipment.warranty_expires) < new Date()

  return (
    <Link
      href={`/${lab.slug}/equipment/${equipment.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {equipment.inventory_items.name}
          </h3>
          {equipment.model_number && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {equipment.model_number}
            </p>
          )}
        </div>
        <EquipmentStatusBadge status={equipment.status} />
      </div>

      {/* Serial number */}
      {equipment.serial_number && (
        <p className="mt-2 text-xs text-gray-400">
          S/N: {equipment.serial_number}
        </p>
      )}

      {/* Calibration */}
      <div className="mt-3">
        <CalibrationIndicator
          calibrationIntervalDays={equipment.calibration_interval_days}
          lastCalibrated={equipment.last_calibrated}
        />
      </div>

      {/* Warranty */}
      {equipment.warranty_expires && (
        <p
          className={`mt-2 text-xs font-medium ${
            warrantyExpired ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {warrantyExpired
            ? 'Warranty expired'
            : `Warranty expires ${new Date(equipment.warranty_expires).toLocaleDateString()}`}
        </p>
      )}
    </Link>
  )
}
