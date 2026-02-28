'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import { createInventoryItem } from '@/lib/supabase/inventory'
import {
  parseInventoryCsv,
  generateTemplateCsv,
  type ValidRow,
  type RowError,
} from '@/lib/csv/parse-inventory'

interface CsvImportModalProps {
  open: boolean
  onClose: () => void
}

type ImportState = 'idle' | 'preview' | 'importing' | 'done'

export function CsvImportModal({ open, onClose }: CsvImportModalProps) {
  const { lab } = useLab()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImportState>('idle')
  const [validRows, setValidRows] = useState<ValidRow[]>([])
  const [errors, setErrors] = useState<RowError[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setState('idle')
      setValidRows([])
      setErrors([])
      setImportProgress(0)
      setImportErrors([])
      setDragOver(false)
    }
  }, [open])

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

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && state !== 'importing') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, state])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrors([{ row: 0, field: 'file', message: 'Please upload a .csv file' }])
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseInventoryCsv(text)
      setValidRows(result.valid)
      setErrors(result.errors)
      setState('preview')
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleImport = useCallback(async () => {
    setState('importing')
    setImportProgress(0)
    setImportErrors([])

    const supabase = createClient()
    const importErrs: string[] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        await createInventoryItem(supabase, lab.id, {
          name: row.name,
          type: row.type,
          quantity: row.quantity,
          unit: row.unit,
          description: row.description,
          catalog_number: row.catalog_number,
          lot_number: row.lot_number,
          manufacturer: row.manufacturer,
          supplier: row.supplier,
          min_threshold: row.min_threshold ?? 0,
          expiration_date: row.expiration_date ?? null,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        importErrs.push(`Row "${row.name}": ${msg}`)
      }
      setImportProgress(i + 1)
    }

    setImportErrors(importErrs)
    setState('done')
  }, [validRows, lab.id])

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateTemplateCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={state !== 'importing' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Import Inventory from CSV
            </h2>
            <button
              onClick={onClose}
              disabled={state === 'importing'}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {state === 'idle' && (
              <div className="space-y-4">
                {/* Drag-and-drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                    dragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <UploadCloudIcon />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Drag and drop your CSV file here
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>

                {/* Download template */}
                <div className="text-center">
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Download CSV template
                  </button>
                </div>

                {/* File-level errors */}
                {errors.length > 0 && errors[0].row === 0 && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {errors[0].message}
                  </div>
                )}
              </div>
            )}

            {state === 'preview' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex gap-3">
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                    {validRows.length} item{validRows.length !== 1 ? 's' : ''} ready to import
                  </div>
                  {errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {errors.length} error{errors.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Preview table */}
                <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Unit
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {validRows.map((row, i) => (
                        <tr key={`valid-${i}`} className="bg-green-50/50">
                          <td className="px-3 py-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {row.name}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{row.type}</td>
                          <td className="px-3 py-2 text-gray-600">{row.quantity}</td>
                          <td className="px-3 py-2 text-gray-600">{row.unit}</td>
                          <td className="px-3 py-2 text-gray-400">
                            {[row.manufacturer, row.catalog_number]
                              .filter(Boolean)
                              .join(' / ') || '--'}
                          </td>
                        </tr>
                      ))}
                      {errors.map((err, i) => (
                        <tr key={`error-${i}`} className="bg-red-50/50">
                          <td className="px-3 py-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                          </td>
                          <td colSpan={5} className="px-3 py-2 text-red-600">
                            Row {err.row}: {err.field} - {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setState('idle')
                      setValidRows([])
                      setErrors([])
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validRows.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Import {validRows.length} Item{validRows.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}

            {state === 'importing' && (
              <div className="space-y-4 py-8 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-medium text-gray-700">
                  Importing items...
                </p>
                <div className="mx-auto w-full max-w-xs">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-200"
                      style={{
                        width: `${
                          validRows.length > 0
                            ? (importProgress / validRows.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {importProgress} of {validRows.length}
                  </p>
                </div>
              </div>
            )}

            {state === 'done' && (
              <div className="space-y-4 py-8 text-center">
                {importErrors.length === 0 ? (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckIcon />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Successfully imported {validRows.length} item
                      {validRows.length !== 1 ? 's' : ''}!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                      <WarningIcon />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Imported {validRows.length - importErrors.length} of{' '}
                      {validRows.length} items
                    </p>
                    <div className="mx-auto max-w-md rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
                      <p className="font-medium">
                        {importErrors.length} failed:
                      </p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {importErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

function UploadCloudIcon() {
  return (
    <svg
      className="h-10 w-10 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-6 w-6 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      className="h-6 w-6 text-yellow-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}
