'use client'

import { useEffect } from 'react'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import { EquipmentForm } from './equipment-form'

interface EquipmentFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  equipment?: EquipmentWithItem
}

export function EquipmentFormModal({
  open,
  onClose,
  mode,
  equipment,
}: EquipmentFormModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? 'Add Equipment' : 'Edit Equipment'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Body -- scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <EquipmentForm mode={mode} equipment={equipment} onSuccess={onClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  )
}
