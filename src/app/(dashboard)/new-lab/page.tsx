'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { createLab } from '@/lib/supabase/labs'

const schema = z.object({
  name: z
    .string()
    .min(1, 'Lab name is required')
    .max(100, 'Lab name must be under 100 characters'),
  institution: z.string().max(200).optional(),
})

type FormData = z.infer<typeof schema>

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewLabPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', institution: '' },
  })

  const nameValue = watch('name')
  const slug = toSlug(nameValue || '')

  async function onSubmit(data: FormData) {
    if (!slug) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      await createLab(supabase, {
        name: data.name,
        slug,
        institution: data.institution || null,
      })
      router.push(`/${slug}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create lab'
      if (message.includes('duplicate') || message.includes('unique')) {
        setError('A lab with that name already exists. Try a different name.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create a new lab
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up your lab to start tracking inventory, equipment, and budgets.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {/* Lab name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Lab name
            </label>
            <input
              id="name"
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

            {/* Slug preview */}
            {slug && (
              <p className="mt-1.5 text-xs text-gray-400">
                URL: labmanager.app/<span className="font-medium">{slug}</span>
              </p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label
              htmlFor="institution"
              className="block text-sm font-medium text-gray-700"
            >
              Institution{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="institution"
              type="text"
              {...register('institution')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. MIT"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !slug}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create lab'}
          </button>
        </form>
      </div>
    </div>
  )
}
