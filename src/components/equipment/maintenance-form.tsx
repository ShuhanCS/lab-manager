'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  maintenanceLogSchema,
  type MaintenanceLogFormValues,
  addMaintenanceLog,
} from '@/lib/supabase/equipment'

interface MaintenanceFormProps {
  equipmentId: string
  onSuccess: () => void
  onCancel: () => void
}

export function MaintenanceForm({
  equipmentId,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceLogFormValues>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: {
      date: today,
      type: 'inspection',
      description: '',
    },
  })

  async function onSubmit(data: MaintenanceLogFormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const parsed = maintenanceLogSchema.parse(data)
      await addMaintenanceLog(supabase, equipmentId, parsed)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Date + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="maint-date" className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="maint-date"
            type="date"
            {...register('date')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="maint-type" className="block text-sm font-medium text-gray-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="maint-type"
            {...register('type')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="calibration">Calibration</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
            <option value="cleaning">Cleaning</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="maint-desc" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="maint-desc"
          {...register('description')}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="What was done..."
        />
      </div>

      {/* Cost + Next Due */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="maint-cost" className="block text-sm font-medium text-gray-700">
            Cost ($)
          </label>
          <input
            id="maint-cost"
            type="number"
            step="0.01"
            {...register('cost', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="maint-next-due" className="block text-sm font-medium text-gray-700">
            Next Due Date
          </label>
          <input
            id="maint-next-due"
            type="date"
            {...register('next_due')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Saving...' : 'Add Entry'}
        </button>
      </div>
    </form>
  )
}
