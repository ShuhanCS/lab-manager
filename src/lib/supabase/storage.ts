import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const BUCKET = 'equipment-docs'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Upload a document to the equipment-docs storage bucket.
 */
export async function uploadDocument(
  supabase: SupabaseClient<Database>,
  file: File,
  path: string
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10 MB limit')
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return data.path
}

/**
 * Get a signed URL for a document (1 hour expiry).
 */
export async function getDocumentUrl(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600) // 1 hour

  if (error) throw error
  return data.signedUrl
}

/**
 * Delete a document from storage.
 */
export async function deleteDocument(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) throw error
}

/**
 * List documents under a given path prefix.
 */
export async function listDocuments(
  supabase: SupabaseClient<Database>,
  prefix: string
): Promise<
  {
    name: string
    id: string | null
    created_at: string | null
    metadata: Record<string, unknown> | null
  }[]
> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) throw error
  return (data ?? []).map((f) => ({
    name: f.name,
    id: f.id ?? null,
    created_at: f.created_at ?? null,
    metadata: (f.metadata as Record<string, unknown>) ?? null,
  }))
}
