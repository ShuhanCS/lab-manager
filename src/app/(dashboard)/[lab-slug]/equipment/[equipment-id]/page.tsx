import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getEquipmentItem, getMaintenanceLogs } from '@/lib/supabase/equipment'
import { EquipmentDetailClient } from './equipment-detail-client'

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ 'lab-slug': string; 'equipment-id': string }>
}) {
  const { 'equipment-id': equipmentId } = await params
  const supabase = await createServerSupabaseClient()

  const equipment = await getEquipmentItem(supabase, equipmentId)
  if (!equipment) notFound()

  const maintenanceLogs = await getMaintenanceLogs(supabase, equipmentId)

  return (
    <EquipmentDetailClient
      equipment={equipment}
      maintenanceLogs={maintenanceLogs}
    />
  )
}
