'use client'

import { useEffect, useState } from 'react'
import { useInventoryStore } from '@/stores/inventory-store'

export function InventoryFilters() {
  const { filters, setFilter, clearFilters } = useInventoryStore()
  const [localSearch, setLocalSearch] = useState(filters.search ?? '')

  // Debounced search — 300ms after last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', localSearch || undefined)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, setFilter])

  const hasFilters =
    filters.type || filters.status || filters.search || filters.locationId

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search name, description, catalog #..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Type filter */}
      <select
        value={filters.type ?? ''}
        onChange={(e) => setFilter('type', e.target.value || undefined)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">All types</option>
        <option value="equipment">Equipment</option>
        <option value="reagent">Reagent</option>
        <option value="consumable">Consumable</option>
        <option value="chemical">Chemical</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => setFilter('status', e.target.value || undefined)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="in_stock">In Stock</option>
        <option value="low_stock">Low Stock</option>
        <option value="out_of_stock">Out of Stock</option>
        <option value="expired">Expired</option>
      </select>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={() => {
            clearFilters()
            setLocalSearch('')
          }}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  )
}
