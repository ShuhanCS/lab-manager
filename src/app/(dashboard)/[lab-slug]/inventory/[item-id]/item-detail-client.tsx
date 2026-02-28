'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  updateQuantity,
  deleteInventoryItem,
} from '@/lib/supabase/inventory'
import type { InventoryItem, ActivityLog } from '@/lib/supabase/types'
import { StatusBadge } from '@/components/inventory/status-badge'
import { TypeBadge } from '@/components/inventory/type-badge'
import { ItemFormModal } from '@/components/inventory/item-form-modal'
import { ReorderButton } from '@/components/inventory/reorder-button'

interface ItemDetailClientProps {
  item: InventoryItem
  activityLogs: ActivityLog[]
}

export function ItemDetailClient({
  item: initialItem,
  activityLogs,
}: ItemDetailClientProps) {
  const router = useRouter()
  const { lab, role } = useLab()
  const [item, setItem] = useState(initialItem)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [adjusting, setAdjusting] = useState(false)

  const canDelete = role === 'owner' || role === 'admin'

  async function handleQuantityChange(delta: number) {
    setAdjusting(true)
    try {
      const supabase = createClient()
      const updated = await updateQuantity(supabase, item.id, delta)
      setItem(updated)
      router.refresh()
    } catch (err) {
      console.error('Failed to update quantity:', err)
    } finally {
      setAdjusting(false)
    }
  }

  async function handleDelete() {
    try {
      const supabase = createClient()
      await deleteInventoryItem(supabase, item.id)
      router.push(`/${lab.slug}/inventory`)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${lab.slug}/inventory`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <BackArrowIcon />
          Back to Inventory
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Item header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {item.name}
            </h1>
            {item.description && (
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Quantity adjustment */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Quantity
        </h2>
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={adjusting || item.quantity <= 0}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            -
          </button>

          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{item.quantity}</p>
            <p className="text-sm text-gray-400">{item.unit}</p>
          </div>

          <button
            onClick={() => handleQuantityChange(1)}
            disabled={adjusting}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>

          {/* Reorder button — visible when item is linked to ConductScience */}
          <div className="ml-auto">
            <ReorderButton item={item} />
          </div>
        </div>

        {item.min_threshold > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            Low-stock alert at {item.min_threshold} {item.unit}
          </p>
        )}
      </div>

      {/* Details grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Details
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailRow label="Catalog #" value={item.catalog_number} />
          <DetailRow label="Lot #" value={item.lot_number} />
          <DetailRow label="Manufacturer" value={item.manufacturer} />
          <DetailRow label="Supplier" value={item.supplier} />
          <DetailRow
            label="Expiration"
            value={
              item.expiration_date
                ? new Date(item.expiration_date).toLocaleDateString()
                : null
            }
          />
          <DetailRow label="Barcode" value={item.barcode} />
          <DetailRow
            label="Created"
            value={new Date(item.created_at).toLocaleDateString()}
          />
          <DetailRow
            label="Updated"
            value={new Date(item.updated_at).toLocaleDateString()}
          />
        </dl>
      </div>

      {/* Activity history */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Activity History
        </h2>
        {activityLogs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No activity recorded.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {activityLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gray-300" />
                <div className="flex-1">
                  <p className="text-gray-700">
                    <span className="font-medium capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </p>
                  {log.details &&
                    typeof log.details === 'object' &&
                    !Array.isArray(log.details) && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDetails(log.details as Record<string, unknown>)}
                      </p>
                    )}
                  <p className="mt-0.5 text-xs text-gray-300">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit modal */}
      <ItemFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          router.refresh()
        }}
        mode="edit"
        item={item}
      />

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Item
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete &quot;{item.name}&quot;? This
                action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-700">
        {value || <span className="text-gray-300">--</span>}
      </dd>
    </div>
  )
}

function formatDetails(details: Record<string, unknown>): string {
  const parts: string[] = []
  if ('previous' in details && 'new' in details) {
    parts.push(`${details.previous} -> ${details.new}`)
  }
  if ('delta' in details) {
    const d = details.delta as number
    parts.push(d > 0 ? `+${d}` : `${d}`)
  }
  if ('changes' in details && Array.isArray(details.changes)) {
    parts.push(`Changed: ${(details.changes as string[]).join(', ')}`)
  }
  if ('name' in details && typeof details.name === 'string') {
    parts.push(details.name)
  }
  return parts.join(' | ')
}

function BackArrowIcon() {
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
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  )
}
