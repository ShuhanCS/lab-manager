import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Member } from './types'

export type MemberWithEmail = Member & { email: string }

/**
 * Fetch all members of a lab, including their email from auth.users.
 * Supabase client-side cannot query auth.users directly, so we join
 * through a database function or use the members table + profiles.
 *
 * For MVP, we fetch members and resolve emails via a lightweight approach:
 * the RLS-accessible `members` table joined with a public `profiles` view
 * or by fetching user metadata. Since we can't query auth.users from the
 * client, we'll return member data and the server page will enrich it.
 */
export async function getMembers(
  supabase: SupabaseClient<Database>,
  labId: string
): Promise<MemberWithEmail[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('lab_id', labId)
    .order('joined_at', { ascending: true })

  if (error) throw error

  // We can't directly join auth.users from client-side Supabase.
  // The server component that calls this will need to enrich with emails.
  // For now, return members with a placeholder email that the server will fill.
  return (data ?? []).map((m) => ({
    ...m,
    email: '', // Will be enriched by server component
  }))
}

/**
 * Update a member's role. Cannot change the owner role.
 */
export async function updateMemberRole(
  supabase: SupabaseClient<Database>,
  memberId: string,
  role: 'admin' | 'member'
): Promise<Member> {
  // First verify the member exists and is not an owner
  const { data: existing, error: fetchError } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single()

  if (fetchError) throw fetchError
  if (existing.role === 'owner') {
    throw new Error('Cannot change the owner role')
  }

  const { data, error } = await supabase
    .from('members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove a member from a lab. Cannot remove the owner.
 */
export async function removeMember(
  supabase: SupabaseClient<Database>,
  memberId: string
): Promise<void> {
  // First verify the member exists and is not an owner
  const { data: existing, error: fetchError } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single()

  if (fetchError) throw fetchError
  if (existing.role === 'owner') {
    throw new Error('Cannot remove the lab owner')
  }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}

/**
 * Generate a simple invite URL for the lab.
 * For MVP, this is a simple URL with lab ID and role as query params.
 * No token verification — just takes user to signup/login flow and adds
 * them to the lab.
 */
export function createInviteLink(
  labId: string,
  role: 'admin' | 'member' = 'member'
): string {
  // Use relative URL — the component will prepend the origin
  return `/invite/${labId}?role=${role}`
}

/**
 * Add a user to a lab as a member. Used by the invite flow.
 */
export async function addMemberToLab(
  supabase: SupabaseClient<Database>,
  labId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<Member> {
  // Check if user is already a member
  const { data: existing } = await supabase
    .from('members')
    .select('*')
    .eq('lab_id', labId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      lab_id: labId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
