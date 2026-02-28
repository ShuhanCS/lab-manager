'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  equipmentSchema,
  type EquipmentFormValues,
  createEquipment,
  updateEquipment,
} from '@/lib/supabase/equipment'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'

interface EquipmentFormProps {
  mode: 'create' | 'edit'
  equipment?: EquipmentWithItem
  onSuccess?: () => void
}

export function EquipmentForm({ mode, equipment, onSuccess }: EquipmentFormProps) {
  const router = useRouter()
  const { lab } = useLab()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment
      ? {
          name: equipment.inventory_items.name,
          description: equipment.inventory_items.description ?? undefined,
          quantity: equipment.inventory_items.quantity,
          unit: equipment.inventory_items.unit,
          serial_number: equipment.serial_number ?? undefined,
          model_number: equipment.model_number ?? undefined,
          purchase_date: equipment.purchase_date ?? undefined,
          purchase_price: equipment.purchase_price ?? undefined,
          warranty_expires: equipment.warranty_expires ?? undefined,
          calibration_interval_days: equipment.calibration_interval_days ?? undefined,
          last_calibrated: equipment.last_calibrated ?? undefined,
          status: equipment.status,
        }
      : {
          name: '',
          quantity: 1,
          unit: 'unit',
          status: 'active',
        },
  })

  async function onSubmit(data: EquipmentFormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const parsed = equipmentSchema.parse(data)

      if (mode === 'create') {
        await createEquipment(supabase, lab.id, parsed)
      } else if (equipment) {
        await updateEquipment(supabase, equipment.id, parsed)
      }

      reset()
      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="eq-name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="eq-name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. Spectrophotometer"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="eq-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="eq-description"
          {...register('description')}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Optional description..."
        />
      </div>

      {/* Quantity + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="eq-quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            id="eq-quantity"
            type="number"
            step="1"
            {...register('quantity', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="eq-unit" className="block text-sm font-medium text-gray-700">
            Unit
          </label>
          <input
            id="eq-unit"
            type="text"
            {...register('unit')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="unit"
          />
        </div>
      </div>

      {/* Serial Number + Model Number */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="eq-serial" className="block text-sm font-medium text-gray-700">
            Serial Number
          </label>
          <input
            id="eq-serial"
            type="text"
            {...register('serial_number')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. SN-12345"
          />
        </div>
        <div>
          <label htmlFor="eq-model" className="block text-sm font-medium text-gray-700">
            Model Number
          </label>
          <input
            id="eq-model"
            type="text"
            {...register('model_number')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. UV-1800"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="eq-status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="eq-status"
          {...register('status')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Purchase Date + Purchase Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="eq-purchase-date" className="block text-sm font-medium text-gray-700">
            Purchase Date
          </label>
          <input
            id="eq-purchase-date"
            type="date"
            {...register('purchase_date')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="eq-purchase-price" className="block text-sm font-medium text-gray-700">
            Purchase Price ($)
          </label>
          <input
            id="eq-purchase-price"
            type="number"
            step="0.01"
            {...register('purchase_price', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Warranty Expiration */}
      <div>
        <label htmlFor="eq-warranty" className="block text-sm font-medium text-gray-700">
          Warranty Expiration
        </label>
        <input
          id="eq-warranty"
          type="date"
          {...register('warranty_expires')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Calibration Interval + Last Calibrated */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="eq-cal-interval" className="block text-sm font-medium text-gray-700">
            Calibration Interval (days)
          </label>
          <input
            id="eq-cal-interval"
            type="number"
            step="1"
            {...register('calibration_interval_days', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. 365"
          />
          <p className="mt-1 text-xs text-gray-400">
            Leave blank if no calibration needed.
          </p>
        </div>
        <div>
          <label htmlFor="eq-last-cal" className="block text-sm font-medium text-gray-700">
            Last Calibrated
          </label>
          <input
            id="eq-last-cal"
            type="date"
            {...register('last_calibrated')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Add Equipment'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
