'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  inventoryItemSchema,
  type InventoryItemInput,
  type InventoryItemFormValues,
  createInventoryItem,
  updateInventoryItem,
  getLabLocations,
} from '@/lib/supabase/inventory'
import type { InventoryItem, Location } from '@/lib/supabase/types'
import { ProductLinker } from './product-linker'

interface ItemFormProps {
  mode: 'create' | 'edit'
  item?: InventoryItem
  onSuccess?: () => void
}

export function ItemForm({ mode, item, onSuccess }: ItemFormProps) {
  const router = useRouter()
  const { lab } = useLab()
  const [locations, setLocations] = useState<Location[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? undefined,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          min_threshold: item.min_threshold,
          location_id: item.location_id,
          catalog_number: item.catalog_number ?? undefined,
          lot_number: item.lot_number ?? undefined,
          manufacturer: item.manufacturer ?? undefined,
          supplier: item.supplier ?? undefined,
          expiration_date: item.expiration_date ?? undefined,
          barcode: item.barcode,
          conductscience_product_id: item.conductscience_product_id,
        }
      : {
          name: '',
          type: 'consumable',
          quantity: 0,
          unit: '',
          min_threshold: 0,
        },
  })

  const csProductId = watch('conductscience_product_id') ?? null

  // Fetch lab locations for the dropdown
  useEffect(() => {
    const supabase = createClient()
    getLabLocations(supabase, lab.id).then(setLocations).catch(console.error)
  }, [lab.id])

  async function onSubmit(data: InventoryItemFormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      // Parse through Zod to apply defaults and get the validated output type
      const parsed = inventoryItemSchema.parse(data)

      if (mode === 'create') {
        await createInventoryItem(supabase, lab.id, parsed)
      } else if (item) {
        await updateInventoryItem(supabase, item.id, parsed)
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
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. Pipette Tips"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Optional description..."
        />
      </div>

      {/* Type */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          {...register('type')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="consumable">Consumable</option>
          <option value="reagent">Reagent</option>
          <option value="chemical">Chemical</option>
          <option value="equipment">Equipment</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Quantity + Unit (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            step="any"
            {...register('quantity', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-600">
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-gray-700"
          >
            Unit <span className="text-red-500">*</span>
          </label>
          <input
            id="unit"
            type="text"
            {...register('unit')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. mL, boxes, each"
          />
          {errors.unit && (
            <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>
          )}
        </div>
      </div>

      {/* Min Threshold */}
      <div>
        <label
          htmlFor="min_threshold"
          className="block text-sm font-medium text-gray-700"
        >
          Minimum Threshold
        </label>
        <input
          id="min_threshold"
          type="number"
          step="any"
          {...register('min_threshold', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Alert when quantity drops below this level.
        </p>
        {errors.min_threshold && (
          <p className="mt-1 text-xs text-red-600">
            {errors.min_threshold.message}
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location_id"
          className="block text-sm font-medium text-gray-700"
        >
          Location
        </label>
        <select
          id="location_id"
          {...register('location_id')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">No location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.type})
            </option>
          ))}
        </select>
      </div>

      {/* Catalog + Lot (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="catalog_number"
            className="block text-sm font-medium text-gray-700"
          >
            Catalog Number
          </label>
          <input
            id="catalog_number"
            type="text"
            {...register('catalog_number')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. S9888"
          />
        </div>
        <div>
          <label
            htmlFor="lot_number"
            className="block text-sm font-medium text-gray-700"
          >
            Lot Number
          </label>
          <input
            id="lot_number"
            type="text"
            {...register('lot_number')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. LOT-2026-001"
          />
        </div>
      </div>

      {/* Manufacturer + Supplier (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="manufacturer"
            className="block text-sm font-medium text-gray-700"
          >
            Manufacturer
          </label>
          <input
            id="manufacturer"
            type="text"
            {...register('manufacturer')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Sigma-Aldrich"
          />
        </div>
        <div>
          <label
            htmlFor="supplier"
            className="block text-sm font-medium text-gray-700"
          >
            Supplier
          </label>
          <input
            id="supplier"
            type="text"
            {...register('supplier')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Fisher Scientific"
          />
        </div>
      </div>

      {/* Expiration Date */}
      <div>
        <label
          htmlFor="expiration_date"
          className="block text-sm font-medium text-gray-700"
        >
          Expiration Date
        </label>
        <input
          id="expiration_date"
          type="date"
          {...register('expiration_date')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Barcode */}
      <div>
        <label
          htmlFor="barcode"
          className="block text-sm font-medium text-gray-700"
        >
          Barcode
        </label>
        <input
          id="barcode"
          type="text"
          {...register('barcode')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Scan or type barcode"
        />
      </div>

      {/* ConductScience product link (optional) */}
      <ProductLinker
        value={csProductId}
        onChange={(productId, meta) => {
          setValue('conductscience_product_id', productId)
          // Auto-fill catalog number from the product SKU if empty
          if (meta?.sku && !watch('catalog_number')) {
            setValue('catalog_number', meta.sku)
          }
        }}
      />

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
              ? 'Add Item'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
