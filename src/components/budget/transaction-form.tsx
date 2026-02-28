'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  transactionSchema,
  type TransactionFormValues,
  addTransaction,
} from '@/lib/supabase/grants'
import { getInventoryItems } from '@/lib/supabase/inventory'
import type { InventoryItem } from '@/lib/supabase/types'

interface TransactionFormProps {
  grantId: string
  /** Category names from the grant for the dropdown */
  categories: string[]
  onSuccess?: () => void
}

export function TransactionForm({
  grantId,
  categories,
  onSuccess,
}: TransactionFormProps) {
  const router = useRouter()
  const { lab } = useLab()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: undefined,
      date: today,
      description: '',
      category: '',
      inventory_item_id: null,
    },
  })

  // Fetch inventory items for the "Link to Item" dropdown
  useEffect(() => {
    const supabase = createClient()
    getInventoryItems(supabase, lab.id)
      .then(setInventoryItems)
      .catch(console.error)
  }, [lab.id])

  async function onSubmit(data: TransactionFormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const parsed = transactionSchema.parse(data)

      // Clean up empty strings to null
      if (!parsed.category) parsed.category = undefined
      if (!parsed.inventory_item_id) parsed.inventory_item_id = null

      await addTransaction(supabase, grantId, parsed)

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

      {/* Amount + Date (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
              $
            </span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="block w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            {...register('date')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. Pipette tips from Fisher"
        />
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Link to Inventory Item */}
      <div>
        <label
          htmlFor="inventory_item_id"
          className="block text-sm font-medium text-gray-700"
        >
          Link to Inventory Item
        </label>
        <select
          id="inventory_item_id"
          {...register('inventory_item_id')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">None</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.catalog_number ? ` (${item.catalog_number})` : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Optional. Link this expense to an inventory item.
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Saving...' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}
