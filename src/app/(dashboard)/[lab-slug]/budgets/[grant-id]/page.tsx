import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug, getUserRoleInLab } from '@/lib/supabase/labs'
import { getGrant, getTransactions, getGrantSummary } from '@/lib/supabase/grants'
import { notFound } from 'next/navigation'
import { GrantDetailClient } from './grant-detail-client'

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string; 'grant-id': string }>
}) {
  const { 'lab-slug': slug, 'grant-id': grantId } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const role = await getUserRoleInLab(supabase, lab.id)
  if (!role) notFound()

  const grant = await getGrant(supabase, grantId)
  if (!grant || grant.lab_id !== lab.id) notFound()

  const [transactions, summary] = await Promise.all([
    getTransactions(supabase, grantId),
    getGrantSummary(supabase, grantId),
  ])

  return (
    <GrantDetailClient
      grant={grant}
      transactions={transactions}
      summary={summary}
      role={role}
    />
  )
}
