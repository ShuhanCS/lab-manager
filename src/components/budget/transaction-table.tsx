'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLab } from '@/components/dashboard/lab-context'
import { createClient } from '@/lib/supabase/client'
import { deleteTransaction } from '@/lib/supabase/grants'
import type { Transaction } from '@/lib/supabase/types'
import Papa from 'papaparse'

interface TransactionTableProps {
  transactions: Transaction[]
  /** Grant categories for displaying category badges */
  categories: string[]
  /** Whether current user can delete (admin/owner) */
  canDelete: boolean
  onAddTransaction: () => void
  onDeleted: () => void
}

export function TransactionTable({
  transactions,
  categories,
  canDelete,
  onAddTransaction,
  onDeleted,
}: TransactionTableProps) {
  const router = useRouter()
  const { lab } = useLab()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(n)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  async function handleDelete(txId: string) {
    if (!confirm('Delete this transaction?')) return
    setDeletingId(txId)
    try {
      const supabase = createClient()
      await deleteTransaction(supabase, txId)
      router.refresh()
      onDeleted()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    } finally {
      setDeletingId(null)
    }
  }

  function handleExportCsv() {
    const csvData = transactions.map((t) => ({
      Date: t.date,
      Description: t.description ?? '',
      Category: t.category ?? '',
      Amount: t.amount,
    }))
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'transactions.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <EmptyIcon />
        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          No transactions yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Record your first expense to start tracking spending.
        </p>
        <button
          onClick={onAddTransaction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Add Transaction
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Amount
              </th>
              {canDelete && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {tx.description || (
                    <span className="text-gray-300">--</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {tx.category ? (
                    <CategoryBadge name={tx.category} />
                  ) : (
                    <span className="text-gray-300">--</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(tx.amount)}
                </td>
                {canDelete && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                      aria-label="Delete transaction"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  Supplies: 'bg-blue-50 text-blue-700',
  Equipment: 'bg-purple-50 text-purple-700',
  Travel: 'bg-orange-50 text-orange-700',
  Personnel: 'bg-green-50 text-green-700',
}

function CategoryBadge({ name }: { name: string }) {
  const color = CATEGORY_COLORS[name] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {name}
    </span>
  )
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}
