'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Lab } from '@/lib/supabase/types'

const labSettingsSchema = z.object({
  name: z.string().min(1, 'Lab name is required').max(100),
  institution: z.string().max(200).optional(),
})

type LabSettingsFormData = z.infer<typeof labSettingsSchema>

interface LabSettingsFormProps {
  lab: Lab
}

export function LabSettingsForm({ lab }: LabSettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LabSettingsFormData>({
    resolver: zodResolver(labSettingsSchema),
    defaultValues: {
      name: lab.name,
      institution: lab.institution ?? '',
    },
  })

  async function onSubmit(data: LabSettingsFormData) {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const { error: updateError } = await supabase
        .from('labs')
        .update({
          name: data.name,
          institution: data.institution || null,
        })
        .eq('id', lab.id)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update lab settings'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Lab Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Update your lab&apos;s name and institution.
        </p>

        <div className="mt-4 space-y-4">
          {/* Lab name */}
          <div>
            <label
              htmlFor="lab-name"
              className="block text-sm font-medium text-gray-700"
            >
              Lab Name
            </label>
            <input
              id="lab-name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Smith Neuroscience Lab"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label
              htmlFor="lab-institution"
              className="block text-sm font-medium text-gray-700"
            >
              Institution
            </label>
            <input
              id="lab-institution"
              type="text"
              {...register('institution')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Stanford University"
            />
            {errors.institution && (
              <p className="mt-1 text-sm text-red-600">
                {errors.institution.message}
              </p>
            )}
          </div>

          {/* Lab slug (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lab URL Slug
            </label>
            <input
              type="text"
              readOnly
              value={lab.slug}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              The slug cannot be changed after creation.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
