'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLab } from '@/components/dashboard/lab-context'
import type { Grant, Transaction, Member } from '@/lib/supabase/types'
import type { GrantSummary } from '@/lib/supabase/grants'
import { TransactionTable } from '@/components/budget/transaction-table'
import { TransactionFormModal } from '@/components/budget/transaction-form-modal'
import { GrantFormModal } from '@/components/budget/grant-form-modal'
import { CategoryPieChart, MonthlyBarChart } from '@/components/budget/budget-charts'

interface GrantDetailClientProps {
  grant: Grant
  transactions: Transaction[]
  summary: GrantSummary
  role: Member['role']
}

export function GrantDetailClient({
  grant,
  transactions,
  summary,
  role,
}: GrantDetailClientProps) {
  const { lab } = useLab()
  const [showAddTx, setShowAddTx] = useState(false)
  const [showEditGrant, setShowEditGrant] = useState(false)

  const canDelete = role === 'owner' || role === 'admin'

  const categories = (
    grant.categories as Array<{ name: string; allocated: number }>
  )?.map((c) => c.name) ?? []

  const percentSpent =
    grant.total_amount > 0
      ? Math.round((summary.totalSpent / grant.total_amount) * 100)
      : 0

  let barColor = 'bg-green-500'
  if (percentSpent >= 90) barColor = 'bg-red-500'
  else if (percentSpent >= 70) barColor = 'bg-yellow-500'

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  const formatDate = (d: string | null) => {
    if (!d) return '--'
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link
          href={`/${lab.slug}/budgets`}
          className="hover:text-gray-700 transition-colors"
        >
          Budgets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{grant.name}</span>
      </nav>

      {/* Grant info header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{grant.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {grant.funder && <span>{grant.funder}</span>}
              {grant.grant_number && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {grant.grant_number}
                </span>
              )}
              <span>
                {formatDate(grant.start_date)} &mdash;{' '}
                {formatDate(grant.end_date)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowEditGrant(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <EditIcon />
            Edit
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Budget
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(grant.total_amount)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Spent
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalSpent)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Remaining
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(summary.remaining)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{percentSpent}% spent</span>
            <span>
              {formatCurrency(summary.totalSpent)} /{' '}
              {formatCurrency(grant.total_amount)}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CategoryPieChart categories={summary.categories} />
          <MonthlyBarChart transactions={transactions} />
        </div>
      )}

      {/* Transaction table */}
      <TransactionTable
        transactions={transactions}
        categories={categories}
        canDelete={canDelete}
        onAddTransaction={() => setShowAddTx(true)}
        onDeleted={() => {
          // The router.refresh() in the component handles refetch
        }}
      />

      {/* Add transaction modal */}
      <TransactionFormModal
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        grantId={grant.id}
        categories={categories}
      />

      {/* Edit grant modal */}
      <GrantFormModal
        open={showEditGrant}
        onClose={() => setShowEditGrant(false)}
        mode="edit"
        grant={grant}
      />
    </div>
  )
}

function EditIcon() {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  )
}
