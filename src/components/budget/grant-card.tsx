'use client'

import Link from 'next/link'
import { useLab } from '@/components/dashboard/lab-context'
import type { GrantWithSpending } from '@/lib/supabase/grants'

interface GrantCardProps {
  grant: GrantWithSpending
}

export function GrantCard({ grant }: GrantCardProps) {
  const { lab } = useLab()

  const percentSpent =
    grant.total_amount > 0
      ? Math.round((grant.spent / grant.total_amount) * 100)
      : 0

  // Color based on spending threshold
  let barColor = 'bg-green-500'
  let badgeBg = 'bg-green-50 text-green-700'
  if (percentSpent >= 90) {
    barColor = 'bg-red-500'
    badgeBg = 'bg-red-50 text-red-700'
  } else if (percentSpent >= 70) {
    barColor = 'bg-yellow-500'
    badgeBg = 'bg-yellow-50 text-yellow-700'
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  const formatDate = (d: string | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  const startStr = formatDate(grant.start_date)
  const endStr = formatDate(grant.end_date)
  const dateRange =
    startStr && endStr
      ? `${startStr} - ${endStr}`
      : startStr
        ? `From ${startStr}`
        : endStr
          ? `Until ${endStr}`
          : null

  return (
    <Link
      href={`/${lab.slug}/budgets/${grant.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {grant.name}
          </h3>
          {grant.funder && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {grant.funder}
            </p>
          )}
        </div>
        {grant.grant_number && (
          <span className="ml-2 shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {grant.grant_number}
          </span>
        )}
      </div>

      {/* Date range */}
      {dateRange && (
        <p className="mt-2 text-xs text-gray-400">{dateRange}</p>
      )}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {formatCurrency(grant.spent)} spent
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
            {percentSpent}%
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percentSpent, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{formatCurrency(0)}</span>
          <span>{formatCurrency(grant.total_amount)}</span>
        </div>
      </div>

      {/* Remaining */}
      <div className="mt-3 text-right">
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(grant.remaining)}
        </span>
        <span className="ml-1 text-xs text-gray-400">remaining</span>
      </div>
    </Link>
  )
}
