'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from '@/lib/supabase/locations'
import type { Location } from '@/lib/supabase/types'

interface LocationsManagerProps {
  locations: Location[]
  labId: string
}

const locationTypes: Location['type'][] = [
  'room',
  'bench',
  'freezer',
  'shelf',
  'cabinet',
  'other',
]

const typeBadgeClasses: Record<Location['type'], string> = {
  room: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  bench: 'bg-green-50 text-green-700 border-green-200',
  freezer: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  shelf: 'bg-amber-50 text-amber-700 border-amber-200',
  cabinet: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function LocationsManager({ locations, labId }: LocationsManagerProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Location['type']>('room')
  const [newParentId, setNewParentId] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Top-level locations (for parent dropdown)
  const topLevel = locations.filter((l) => !l.parent_id)

  async function handleAdd() {
    if (!newName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await createLocation(supabase, labId, {
        name: newName.trim(),
        type: newType,
        parent_id: newParentId || null,
      })
      setNewName('')
      setNewType('room')
      setNewParentId('')
      setShowAdd(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location')
    } finally {
      setLoading(false)
    }
  }

  async function handleEditSave(locationId: string) {
    if (!editName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await updateLocation(supabase, locationId, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(locationId: string) {
    setLoading(true)
    setError(null)
    try {
      await deleteLocation(supabase, locationId)
      setConfirmDeleteId(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(location: Location) {
    setEditingId(location.id)
    setEditName(location.name)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Location list */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {locations.length === 0 ? (
          <div className="p-8 text-center">
            <LocationIcon />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No locations yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add rooms, benches, freezers, and shelves to organize your
              inventory.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {locations.map((location) => {
              const isChild = !!location.parent_id
              return (
                <li
                  key={location.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                    isChild ? 'pl-10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isChild && (
                      <span className="text-gray-300">&mdash;</span>
                    )}

                    {editingId === location.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(location.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(location.id)}
                          disabled={loading}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(location)}
                        className="text-sm text-gray-900 hover:text-blue-600 transition-colors"
                        title="Click to edit"
                      >
                        {location.name}
                      </button>
                    )}

                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeBadgeClasses[location.type]}`}
                    >
                      {location.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmDeleteId === location.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(location.id)}
                          disabled={loading}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(location.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add location form */}
      {showAdd ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Add Location
          </h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Lab 201"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as Location['type'])}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {locationTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Parent (optional)
              </label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">None (top-level)</option>
                {topLevel.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={loading || !newName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false)
                  setNewName('')
                  setNewType('room')
                  setNewParentId('')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Add Location
        </button>
      )}
    </div>
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

function LocationIcon() {
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
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  )
}
