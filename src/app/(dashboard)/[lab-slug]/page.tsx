import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug } from '@/lib/supabase/labs'
import { getInventoryItems } from '@/lib/supabase/inventory'
import { getEquipment } from '@/lib/supabase/equipment'
import { getGrants } from '@/lib/supabase/grants'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { AlertsBanner } from '@/components/dashboard/alerts-banner'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { QuickActions } from '@/components/dashboard/quick-actions'
import type { EquipmentWithItem } from '@/lib/supabase/equipment'
import type { InventoryItem, ActivityLog } from '@/lib/supabase/types'

export default async function LabDashboard({
  params,
}: {
  params: Promise<{ 'lab-slug': string }>
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  // Fetch all data in parallel
  const [items, allEquipment, grants, activitiesResult] = await Promise.all([
    getInventoryItems(supabase, lab.id),
    getEquipment(supabase, lab.id),
    getGrants(supabase, lab.id),
    supabase
      .from('activity_log')
      .select('*')
      .eq('lab_id', lab.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const activities: ActivityLog[] = activitiesResult.data ?? []

  // Compute calibrations due (within 30 days or overdue)
  const now = new Date()
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() + 30)

  const calibrationsDue = allEquipment.filter((eq) => {
    if (!eq.calibration_interval_days) return false
    if (!eq.last_calibrated) return true // never calibrated = overdue
    const lastCal = new Date(eq.last_calibrated)
    const nextDue = new Date(lastCal)
    nextDue.setDate(nextDue.getDate() + eq.calibration_interval_days)
    return nextDue <= cutoff30
  })

  // Compute overdue calibrations (past due)
  const overdueCalibrations = calibrationsDue
    .map((eq) => {
      if (!eq.last_calibrated) {
        // Never calibrated — count from creation or purchase date
        return { equipment: eq, daysOverdue: -1 }
      }
      const lastCal = new Date(eq.last_calibrated)
      const nextDue = new Date(lastCal)
      nextDue.setDate(nextDue.getDate() + (eq.calibration_interval_days ?? 0))
      const daysOverdue = Math.floor(
        (now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24)
      )
      return { equipment: eq, daysOverdue }
    })
    .filter((c) => c.daysOverdue > 0 || c.daysOverdue === -1)
    .map((c) => ({
      equipment: c.equipment,
      daysOverdue: c.daysOverdue === -1 ? 0 : c.daysOverdue,
    }))

  // Low stock items
  const lowStockItems = items.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  )

  // Expiring items (within 30 days)
  const expiringItems = items
    .filter((i) => {
      if (!i.expiration_date) return false
      const exp = new Date(i.expiration_date)
      const daysLeft = Math.floor(
        (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysLeft <= 30
    })
    .map((i) => {
      const exp = new Date(i.expiration_date!)
      const daysUntilExpiry = Math.floor(
        (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return { item: i, daysUntilExpiry }
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {lab.name}
        </h1>
        {lab.institution && (
          <p className="mt-1 text-sm text-gray-500">{lab.institution}</p>
        )}
      </div>

      {/* Alerts banner — only renders if there are alerts */}
      <AlertsBanner
        labSlug={slug}
        lowStockItems={lowStockItems}
        overdueCalibrations={overdueCalibrations}
        expiringItems={expiringItems}
      />

      {/* Stats cards */}
      <StatsCards
        items={items}
        calibrationsDue={calibrationsDue}
        grants={grants}
      />

      {/* Activity feed + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed labSlug={slug} activities={activities} />
        </div>
        <div>
          <QuickActions labSlug={slug} />
        </div>
      </div>
    </div>
  )
}
