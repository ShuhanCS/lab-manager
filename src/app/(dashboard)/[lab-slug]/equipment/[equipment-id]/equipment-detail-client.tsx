'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLab } from '@/components/dashboard/lab-context'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import type { MaintenanceLog } from '@/lib/supabase/types'
import { EquipmentStatusBadge } from '@/components/equipment/equipment-status-badge'
import { CalibrationIndicator } from '@/components/equipment/calibration-indicator'
import { EquipmentFormModal } from '@/components/equipment/equipment-form-modal'
import { MaintenanceLogList } from '@/components/equipment/maintenance-log'
import { DocumentUpload } from '@/components/equipment/document-upload'

interface EquipmentDetailClientProps {
  equipment: EquipmentWithItem
  maintenanceLogs: MaintenanceLog[]
}

export function EquipmentDetailClient({
  equipment: initialEquipment,
  maintenanceLogs: initialLogs,
}: EquipmentDetailClientProps) {
  const router = useRouter()
  const { lab, role } = useLab()
  const [equipment] = useState(initialEquipment)
  const [showEditModal, setShowEditModal] = useState(false)

  const canDelete = role === 'owner' || role === 'admin'

  const warrantyExpired =
    equipment.warranty_expires &&
    new Date(equipment.warranty_expires) < new Date()

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${lab.slug}/equipment`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <BackArrowIcon />
          Back to Equipment
        </Link>

        <button
          onClick={() => setShowEditModal(true)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Equipment header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {equipment.inventory_items.name}
            </h1>
            {equipment.inventory_items.description && (
              <p className="mt-1 text-sm text-gray-500">
                {equipment.inventory_items.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <EquipmentStatusBadge status={equipment.status} />
              <CalibrationIndicator
                calibrationIntervalDays={equipment.calibration_interval_days}
                lastCalibrated={equipment.last_calibrated}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Details
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Serial Number" value={equipment.serial_number} />
          <DetailRow label="Model Number" value={equipment.model_number} />
          <DetailRow label="Manufacturer" value={equipment.inventory_items.manufacturer} />
          <DetailRow label="Supplier" value={equipment.inventory_items.supplier} />
          <DetailRow label="Catalog #" value={equipment.inventory_items.catalog_number} />
          <DetailRow
            label="Quantity"
            value={`${equipment.inventory_items.quantity} ${equipment.inventory_items.unit}`}
          />
          <DetailRow
            label="Purchase Date"
            value={
              equipment.purchase_date
                ? new Date(equipment.purchase_date).toLocaleDateString()
                : null
            }
          />
          <DetailRow
            label="Purchase Price"
            value={
              equipment.purchase_price != null
                ? `$${equipment.purchase_price.toFixed(2)}`
                : null
            }
          />
          <DetailRow
            label="Warranty Expires"
            value={
              equipment.warranty_expires ? (
                <span className={warrantyExpired ? 'text-red-500 font-medium' : ''}>
                  {new Date(equipment.warranty_expires).toLocaleDateString()}
                  {warrantyExpired && ' (Expired)'}
                </span>
              ) : null
            }
          />
          <DetailRow
            label="Calibration Interval"
            value={
              equipment.calibration_interval_days
                ? `${equipment.calibration_interval_days} days`
                : null
            }
          />
          <DetailRow
            label="Last Calibrated"
            value={
              equipment.last_calibrated
                ? new Date(equipment.last_calibrated).toLocaleDateString()
                : null
            }
          />
          <DetailRow
            label="Registered"
            value={new Date(equipment.created_at).toLocaleDateString()}
          />
        </dl>
      </div>

      {/* Maintenance log timeline */}
      <MaintenanceLogList
        equipmentId={equipment.id}
        logs={initialLogs}
        onLogAdded={() => router.refresh()}
      />

      {/* Document attachments */}
      <DocumentUpload equipmentId={equipment.id} canDelete={canDelete} />

      {/* Edit modal */}
      <EquipmentFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          router.refresh()
        }}
        mode="edit"
        equipment={equipment}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | React.ReactNode | null | undefined
}) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-700">
        {value || <span className="text-gray-300">--</span>}
      </dd>
    </div>
  )
}

function BackArrowIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  )
}
