'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLab } from '@/components/dashboard/lab-context'
import {
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  listDocuments,
} from '@/lib/supabase/storage'

interface DocumentUploadProps {
  equipmentId: string
  canDelete?: boolean
}

interface DocFile {
  name: string
  id: string | null
  created_at: string | null
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export function DocumentUpload({ equipmentId, canDelete = false }: DocumentUploadProps) {
  const { lab } = useLab()
  const [docs, setDocs] = useState<DocFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storagePath = `${lab.id}/${equipmentId}`

  const fetchDocs = useCallback(async () => {
    try {
      const supabase = createClient()
      const files = await listDocuments(supabase, storagePath)
      // Filter out the .emptyFolderPlaceholder that Supabase sometimes creates
      setDocs(files.filter((f) => f.name !== '.emptyFolderPlaceholder'))
    } catch {
      // Silently fail if bucket doesn't exist yet
    }
  }, [storagePath])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      for (const file of Array.from(files)) {
        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`Invalid file type: ${file.name}. Allowed: PDF, JPEG, PNG, GIF, WebP`)
          continue
        }

        // Validate size
        if (file.size > MAX_SIZE) {
          setError(`File too large: ${file.name}. Max: 10 MB`)
          continue
        }

        // Generate unique filename to avoid collisions
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${storagePath}/${timestamp}_${safeName}`

        await uploadDocument(supabase, file, path)
      }

      await fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDownload(fileName: string) {
    try {
      const supabase = createClient()
      const url = await getDocumentUrl(supabase, `${storagePath}/${fileName}`)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL')
    }
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Delete "${fileName}"?`)) return

    try {
      const supabase = createClient()
      await deleteDocument(supabase, `${storagePath}/${fileName}`)
      await fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Documents
      </h2>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <UploadCloudIcon />
        <p className="mt-2 text-sm text-gray-600">
          {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          PDF, JPEG, PNG, GIF, WebP -- max 10 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      {docs.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {docs.map((doc) => (
            <li
              key={doc.name}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon name={doc.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {cleanFileName(doc.name)}
                  </p>
                  {doc.created_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => handleDownload(doc.name)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="Download"
                >
                  <DownloadIcon />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.name)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Strip the timestamp prefix from filenames for display.
 */
function cleanFileName(name: string): string {
  return name.replace(/^\d+_/, '')
}

function FileIcon({ name }: { name: string }) {
  const isPdf = name.toLowerCase().endsWith('.pdf')

  return (
    <div
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
        isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
      }`}
    >
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
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    </div>
  )
}

function UploadCloudIcon() {
  return (
    <svg
      className="mx-auto h-8 w-8 text-gray-300"
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

function DownloadIcon() {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  )
}

function TrashIcon() {
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
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}
