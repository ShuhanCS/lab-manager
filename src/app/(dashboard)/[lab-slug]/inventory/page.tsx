import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug } from '@/lib/supabase/labs'
import { getInventoryItems } from '@/lib/supabase/inventory'
import { notFound } from 'next/navigation'
import { InventoryPageClient } from './inventory-page-client'

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string }>
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const items = await getInventoryItems(supabase, lab.id)

  return <InventoryPageClient initialItems={items} />
}
