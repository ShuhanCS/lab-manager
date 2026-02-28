import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Lab, Member } from './types'

export type LabWithRole = Lab & { role: Member['role'] }

/**
 * Create a lab and add the current user as owner (atomic via DB function).
 * Returns the new lab ID.
 */
export async function createLab(
  supabase: SupabaseClient<Database>,
  params: { name: string; slug: string; institution?: string | null }
) {
  const { data, error } = await supabase.rpc('create_lab_with_owner', {
    p_name: params.name,
    p_slug: params.slug,
    p_institution: params.institution ?? null,
  })

  if (error) throw error
  return data as string // returns the lab UUID
}

/**
 * Get all labs the current user belongs to, with their role in each lab.
 */
export async function getUserLabs(
  supabase: SupabaseClient<Database>
): Promise<LabWithRole[]> {
  const { data, error } = await supabase
    .from('members')
    .select('role, labs(*)')
    .order('joined_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    // labs is returned as a single object (not array) due to the FK relationship
    ...(row.labs as unknown as Lab),
    role: row.role,
  }))
}

/**
 * Fetch a single lab by slug. Returns null if not found or user lacks access.
 */
export async function getLabBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Lab | null> {
  const { data, error } = await supabase
    .from('labs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }

  return data
}

/**
 * Get the current user's role in a lab. Returns null if not a member.
 */
export async function getUserRoleInLab(
  supabase: SupabaseClient<Database>,
  labId: string
): Promise<Member['role'] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('members')
    .select('role')
    .eq('lab_id', labId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data.role
}
