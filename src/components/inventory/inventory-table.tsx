'use client'

import { useMemo, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import type { InventoryItem } from '@/lib/supabase/types'
import { useLab } from '@/components/dashboard/lab-context'
import { useInventoryStore } from '@/stores/inventory-store'
import { createClient } from '@/lib/supabase/client'
import { getInventoryItems, type InventoryFilters } from '@/lib/supabase/inventory'
import { StatusBadge } from './status-badge'
import { TypeBadge } from './type-badge'

const columnHelper = createColumnHelper<InventoryItem>()

interface InventoryTableProps {
  initialItems: InventoryItem[]
  onAddItem: () => void
}

export function InventoryTable({ initialItems, onAddItem }: InventoryTableProps) {
  const router = useRouter()
  const { lab } = useLab()
  const { filters } = useInventoryStore()
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [sorting, setSorting] = useState<SortingState>([])
  const [loading, setLoading] = useState(false)

  // Refetch when filters change
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const filterParams: InventoryFilters = {}
      if (filters.type) filterParams.type = filters.type as InventoryItem['type']
      if (filters.status) filterParams.status = filters.status as InventoryItem['status']
      if (filters.search) filterParams.search = filters.search
      if (filters.locationId) filterParams.locationId = filters.locationId

      const data = await getInventoryItems(supabase, lab.id, filterParams)
      setItems(data)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [lab.id, filters])

  useEffect(() => {
    // Only refetch if we actually have active filters, otherwise use initialItems
    const hasFilters = filters.type || filters.status || filters.search || filters.locationId
    if (hasFilters) {
      fetchItems()
    } else {
      setItems(initialItems)
    }
  }, [filters, fetchItems, initialItems])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => <TypeBadge type={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'quantity_unit',
        header: 'Quantity',
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.quantity}{' '}
            <span className="text-gray-400">{info.row.original.unit}</span>
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.accessor('expiration_date', {
        header: 'Expires',
        cell: (info) => {
          const val = info.getValue()
          if (!val) return <span className="text-gray-300">--</span>
          const d = new Date(val)
          const isExpired = d < new Date()
          return (
            <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {d.toLocaleDateString()}
            </span>
          )
        },
        enableSorting: true,
      }),
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  })

  if (items.length === 0 && !loading) {
    const hasFilters = filters.type || filters.status || filters.search
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <InventoryEmptyIcon />
        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          {hasFilters ? 'No items match your filters' : 'No items yet'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {hasFilters
            ? 'Try adjusting your search or filter criteria.'
            : 'Add your first inventory item to get started.'}
        </p>
        {!hasFilters && (
          <button
            onClick={onAddItem}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Add Item
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:text-gray-700'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <SortIndicator
                          direction={header.column.getIsSorted()}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    router.push(`/${lab.slug}/inventory/${row.original.id}`)
                  }
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            {' '}-{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              items.length
            )}{' '}
            of {items.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) {
    return (
      <svg className="h-3.5 w-3.5 text-gray-300" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 3l4 5H4l4-5zm0 10l-4-5h8l-4 5z" />
      </svg>
    )
  }

  return (
    <svg className="h-3.5 w-3.5 text-gray-600" viewBox="0 0 16 16" fill="currentColor">
      {direction === 'asc' ? (
        <path d="M8 3l4 5H4l4-5z" />
      ) : (
        <path d="M8 13l-4-5h8l-4 5z" />
      )}
    </svg>
  )
}

function InventoryEmptyIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  )
}
