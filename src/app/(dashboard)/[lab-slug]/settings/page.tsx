import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug, getUserRoleInLab } from '@/lib/supabase/labs'
import { getMembers } from '@/lib/supabase/members'
import { getLocations } from '@/lib/supabase/locations'
import { SettingsPageClient } from './settings-page-client'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string }>
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const role = await getUserRoleInLab(supabase, lab.id)
  if (!role) notFound()

  // Fetch members and enrich with emails from admin API
  const members = await getMembers(supabase, lab.id)

  // Attempt to enrich member emails using admin client or user metadata.
  // Since we can't access auth.users from the client Supabase SDK with
  // anon key, we'll try to get emails from the user metadata if available.
  // For a production app, you'd create a DB function or use service role key.
  // For MVP, we'll just show what we can.
  for (const member of members) {
    // Try fetching the user's email via the members' user_id
    // This works if the current user can see their own email
    const { data: { user } } = await supabase.auth.getUser()
    if (user && member.user_id === user.id) {
      member.email = user.email ?? ''
    }
    // For other users, the email field remains empty and the UI
    // will show a truncated user_id instead.
  }

  const locations = await getLocations(supabase, lab.id)

  return (
    <SettingsPageClient
      lab={lab}
      role={role}
      members={members}
      locations={locations}
    />
  )
}
