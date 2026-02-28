import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addMemberToLab } from '@/lib/supabase/members'
import Link from 'next/link'

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ 'lab-id': string }>
  searchParams: Promise<{ role?: string }>
}) {
  const { 'lab-id': labId } = await params
  const { role: roleParam } = await searchParams

  const role =
    roleParam === 'admin' || roleParam === 'member' ? roleParam : 'member'

  const supabase = await createServerSupabaseClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in — redirect to signup with a redirect back to this invite page
    const callbackUrl = encodeURIComponent(`/invite/${labId}?role=${role}`)
    redirect(`/signup?redirect=${callbackUrl}`)
  }

  // User is logged in — verify the lab exists
  const { data: lab, error: labError } = await supabase
    .from('labs')
    .select('id, name, slug')
    .eq('id', labId)
    .single()

  if (labError || !lab) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Invalid Invite Link
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          This lab does not exist or the invite link is invalid.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  // Try to add the user to the lab
  try {
    await addMemberToLab(supabase, labId, user.id, role)
  } catch {
    // If adding fails (e.g., RLS policy prevents it), show an error
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Could Not Join Lab
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          There was an error joining &quot;{lab.name}&quot;. You may already be
          a member or the invite is no longer valid.
        </p>
        <Link
          href={`/${lab.slug}`}
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Go to Lab
        </Link>
      </div>
    )
  }

  // Successfully added — redirect to the lab dashboard
  redirect(`/${lab.slug}`)
}
