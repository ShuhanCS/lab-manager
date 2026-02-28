import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug } from '@/lib/supabase/labs'
import { getEquipment } from '@/lib/supabase/equipment'
import { notFound } from 'next/navigation'
import { EquipmentPageClient } from './equipment-page-client'

export default async function EquipmentPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string }>
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const equipment = await getEquipment(supabase, lab.id)

  return <EquipmentPageClient initialEquipment={equipment} />
}
