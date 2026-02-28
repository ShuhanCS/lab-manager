import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInventoryItem, getItemActivityLogs } from '@/lib/supabase/inventory'
import { ItemDetailClient } from './item-detail-client'

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string; 'item-id': string }>
}) {
  const { 'item-id': itemId } = await params
  const supabase = await createServerSupabaseClient()

  const item = await getInventoryItem(supabase, itemId)
  if (!item) notFound()

  const activityLogs = await getItemActivityLogs(supabase, itemId)

  return <ItemDetailClient item={item} activityLogs={activityLogs} />
}
