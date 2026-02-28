import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug } from '@/lib/supabase/labs'
import { getGrants } from '@/lib/supabase/grants'
import { notFound } from 'next/navigation'
import { BudgetsPageClient } from './budgets-page-client'

export default async function BudgetsPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string }>
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const grants = await getGrants(supabase, lab.id)

  return <BudgetsPageClient initialGrants={grants} />
}
