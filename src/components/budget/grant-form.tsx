'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  grantSchema,
  type GrantFormValues,
  createGrant,
  updateGrant,
} from '@/lib/supabase/grants'
import type { Grant } from '@/lib/supabase/types'

interface GrantFormProps {
  mode: 'create' | 'edit'
  grant?: Grant
  onSuccess?: () => void
}

const COMMON_CATEGORIES = ['Supplies', 'Equipment', 'Travel', 'Personnel']

export function GrantForm({ mode, grant, onSuccess }: GrantFormProps) {
  const router = useRouter()
  const { lab } = useLab()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingCategories = grant
    ? (grant.categories as Array<{ name: string; allocated: number }>) ?? []
    : []

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: grant
      ? {
          name: grant.name,
          funder: grant.funder ?? undefined,
          grant_number: grant.grant_number ?? undefined,
          total_amount: grant.total_amount,
          start_date: grant.start_date ?? undefined,
          end_date: grant.end_date ?? undefined,
          categories: existingCategories,
        }
      : {
          name: '',
          total_amount: 0,
          categories: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  })

  function addCommonCategory(name: string) {
    // Only add if not already present
    const exists = fields.some(
      (f) => (f as { name: string }).name.toLowerCase() === name.toLowerCase()
    )
    if (!exists) {
      append({ name, allocated: 0 })
    }
  }

  async function onSubmit(data: GrantFormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const parsed = grantSchema.parse(data)

      if (mode === 'create') {
        await createGrant(supabase, lab.id, parsed)
      } else if (grant) {
        await updateGrant(supabase, grant.id, parsed)
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
          Grant Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. NIH R01 GM123456"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Funder + Grant Number (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="funder"
            className="block text-sm font-medium text-gray-700"
          >
            Funder
          </label>
          <input
            id="funder"
            type="text"
            {...register('funder')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. NIH, NSF"
          />
        </div>
        <div>
          <label
            htmlFor="grant_number"
            className="block text-sm font-medium text-gray-700"
          >
            Grant Number
          </label>
          <input
            id="grant_number"
            type="text"
            {...register('grant_number')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. R01-GM123456"
          />
        </div>
      </div>

      {/* Total Amount */}
      <div>
        <label
          htmlFor="total_amount"
          className="block text-sm font-medium text-gray-700"
        >
          Total Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
            $
          </span>
          <input
            id="total_amount"
            type="number"
            step="0.01"
            min="0"
            {...register('total_amount', { valueAsNumber: true })}
            className="block w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>
        {errors.total_amount && (
          <p className="mt-1 text-xs text-red-600">
            {errors.total_amount.message}
          </p>
        )}
      </div>

      {/* Start Date + End Date (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Budget Categories
        </label>
        <p className="mt-0.5 text-xs text-gray-400">
          Optional. Define spending categories to track allocation.
        </p>

        {/* Quick-add buttons */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMMON_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => addCommonCategory(cat)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              + {cat}
            </button>
          ))}
        </div>

        {/* Category list */}
        {fields.length > 0 && (
          <div className="mt-3 space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  {...register(`categories.${index}.name`)}
                  placeholder="Category name"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="relative w-32">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-400">
                    $
                  </span>
                  <input
                    id={`categories.${index}.allocated`}
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`categories.${index}.allocated`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 py-1.5 pl-5 pr-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                  aria-label="Remove category"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom category button */}
        <button
          type="button"
          onClick={() => append({ name: '', allocated: 0 })}
          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          + Add custom category
        </button>
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
              ? 'Create Grant'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function TrashIcon() {
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
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}
