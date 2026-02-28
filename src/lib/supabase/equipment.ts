import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Equipment, MaintenanceLog } from './types'
import { logActivity } from './inventory'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const equipmentSchema = z.object({
  // Inventory-item fields
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0).optional().default(1),
  unit: z.string().min(1).optional().default('unit'),
  // Equipment-specific fields
  serial_number: z.string().optional(),
  model_number: z.string().optional(),
  purchase_date: z.string().nullable().optional(),
  purchase_price: z.number().nullable().optional(),
  warranty_expires: z.string().nullable().optional(),
  calibration_interval_days: z.number().nullable().optional(),
  last_calibrated: z.string().nullable().optional(),
  status: z.enum(['active', 'maintenance', 'decommissioned']).optional().default('active'),
})

export type EquipmentInput = z.infer<typeof equipmentSchema>
export type EquipmentFormValues = z.input<typeof equipmentSchema>

export const maintenanceLogSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['calibration', 'repair', 'inspection', 'cleaning']),
  description: z.string().optional(),
  cost: z.number().nullable().optional(),
  next_due: z.string().nullable().optional(),
})

export type MaintenanceLogInput = z.infer<typeof maintenanceLogSchema>
export type MaintenanceLogFormValues = z.input<typeof maintenanceLogSchema>

// ---------------------------------------------------------------------------
// Joined type: equipment row + its parent inventory_item fields
// ---------------------------------------------------------------------------

export type EquipmentWithItem = Equipment & {
  inventory_items: {
    id: string
    name: string
    description: string | null
    quantity: number
    unit: string
    lab_id: string
    manufacturer: string | null
    supplier: string | null
    catalog_number: string | null
    location_id: string | null
  }
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all equipment for a lab, joined with their inventory_items data.
 */
export async function getEquipment(
  supabase: SupabaseClient<Database>,
  labId: string
): Promise<EquipmentWithItem[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select(
      `*, inventory_items!inner(id, name, description, quantity, unit, lab_id, manufacturer, supplier, catalog_number, location_id)`
    )
    .eq('inventory_items.lab_id', labId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as EquipmentWithItem[]
}

/**
 * Fetch a single equipment item with full joined data.
 */
export async function getEquipmentItem(
  supabase: SupabaseClient<Database>,
  equipmentId: string
): Promise<EquipmentWithItem | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select(
      `*, inventory_items!inner(id, name, description, quantity, unit, lab_id, manufacturer, supplier, catalog_number, location_id)`
    )
    .eq('id', equipmentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as unknown as EquipmentWithItem
}

/**
 * Create an equipment item.
 * Two-step: create inventory_item (type=equipment), then create equipment row.
 */
export async function createEquipment(
  supabase: SupabaseClient<Database>,
  labId: string,
  input: EquipmentInput
): Promise<EquipmentWithItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Create the inventory item
  const { data: inventoryItem, error: invError } = await supabase
    .from('inventory_items')
    .insert({
      lab_id: labId,
      created_by: user.id,
      name: input.name,
      description: input.description ?? null,
      type: 'equipment',
      quantity: input.quantity ?? 1,
      unit: input.unit ?? 'unit',
      min_threshold: 0,
      status: 'in_stock',
    })
    .select()
    .single()

  if (invError) throw invError

  // 2. Create the equipment row
  const { data: equipmentRow, error: eqError } = await supabase
    .from('equipment')
    .insert({
      inventory_item_id: inventoryItem.id,
      serial_number: input.serial_number ?? null,
      model_number: input.model_number ?? null,
      purchase_date: input.purchase_date ?? null,
      purchase_price: input.purchase_price ?? null,
      warranty_expires: input.warranty_expires ?? null,
      calibration_interval_days: input.calibration_interval_days ?? null,
      last_calibrated: input.last_calibrated ?? null,
      status: input.status ?? 'active',
    })
    .select()
    .single()

  if (eqError) throw eqError

  await logActivity(supabase, labId, 'created', 'equipment', equipmentRow.id, {
    name: input.name,
    serial_number: input.serial_number,
  })

  // Return the joined result
  return {
    ...equipmentRow,
    inventory_items: {
      id: inventoryItem.id,
      name: inventoryItem.name,
      description: inventoryItem.description,
      quantity: inventoryItem.quantity,
      unit: inventoryItem.unit,
      lab_id: inventoryItem.lab_id,
      manufacturer: inventoryItem.manufacturer,
      supplier: inventoryItem.supplier,
      catalog_number: inventoryItem.catalog_number,
      location_id: inventoryItem.location_id,
    },
  }
}

/**
 * Update equipment-specific fields.
 */
export async function updateEquipment(
  supabase: SupabaseClient<Database>,
  equipmentId: string,
  data: Partial<EquipmentInput>
): Promise<EquipmentWithItem> {
  const existing = await getEquipmentItem(supabase, equipmentId)
  if (!existing) throw new Error('Equipment not found')

  // Update inventory_item fields if provided
  const invUpdates: Record<string, unknown> = {}
  if (data.name !== undefined) invUpdates.name = data.name
  if (data.description !== undefined) invUpdates.description = data.description ?? null
  if (data.quantity !== undefined) invUpdates.quantity = data.quantity
  if (data.unit !== undefined) invUpdates.unit = data.unit

  if (Object.keys(invUpdates).length > 0) {
    const { error: invError } = await supabase
      .from('inventory_items')
      .update(invUpdates)
      .eq('id', existing.inventory_item_id)

    if (invError) throw invError
  }

  // Update equipment fields
  const eqUpdates: Record<string, unknown> = {}
  if (data.serial_number !== undefined) eqUpdates.serial_number = data.serial_number ?? null
  if (data.model_number !== undefined) eqUpdates.model_number = data.model_number ?? null
  if (data.purchase_date !== undefined) eqUpdates.purchase_date = data.purchase_date ?? null
  if (data.purchase_price !== undefined) eqUpdates.purchase_price = data.purchase_price ?? null
  if (data.warranty_expires !== undefined) eqUpdates.warranty_expires = data.warranty_expires ?? null
  if (data.calibration_interval_days !== undefined)
    eqUpdates.calibration_interval_days = data.calibration_interval_days ?? null
  if (data.last_calibrated !== undefined) eqUpdates.last_calibrated = data.last_calibrated ?? null
  if (data.status !== undefined) eqUpdates.status = data.status

  if (Object.keys(eqUpdates).length > 0) {
    const { error: eqError } = await supabase
      .from('equipment')
      .update(eqUpdates)
      .eq('id', equipmentId)

    if (eqError) throw eqError
  }

  await logActivity(
    supabase,
    existing.inventory_items.lab_id,
    'updated',
    'equipment',
    equipmentId,
    { changes: Object.keys({ ...invUpdates, ...eqUpdates }) }
  )

  // Refetch to return the latest joined data
  const updated = await getEquipmentItem(supabase, equipmentId)
  if (!updated) throw new Error('Equipment not found after update')
  return updated
}

/**
 * Get equipment items whose calibration is due within N days, or overdue.
 */
export async function getUpcomingCalibrations(
  supabase: SupabaseClient<Database>,
  labId: string,
  days: number = 30
): Promise<EquipmentWithItem[]> {
  // Fetch all equipment for the lab that has calibration tracking
  const allEquipment = await getEquipment(supabase, labId)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)

  return allEquipment.filter((eq) => {
    if (!eq.calibration_interval_days) return false
    if (!eq.last_calibrated) return true // never calibrated = overdue

    const lastCal = new Date(eq.last_calibrated)
    const nextDue = new Date(lastCal)
    nextDue.setDate(nextDue.getDate() + eq.calibration_interval_days)

    return nextDue <= cutoff
  })
}

/**
 * Fetch maintenance logs for an equipment item, ordered newest first.
 */
export async function getMaintenanceLogs(
  supabase: SupabaseClient<Database>,
  equipmentId: string
): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Add a maintenance log entry.
 * If type is "calibration", also updates the equipment's last_calibrated field.
 */
export async function addMaintenanceLog(
  supabase: SupabaseClient<Database>,
  equipmentId: string,
  input: MaintenanceLogInput
): Promise<MaintenanceLog> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({
      equipment_id: equipmentId,
      performed_by: user.id,
      date: input.date,
      type: input.type,
      description: input.description ?? null,
      cost: input.cost ?? null,
      next_due: input.next_due ?? null,
    })
    .select()
    .single()

  if (error) throw error

  // If calibration, update last_calibrated on the equipment row
  if (input.type === 'calibration') {
    const { error: updateError } = await supabase
      .from('equipment')
      .update({ last_calibrated: input.date })
      .eq('id', equipmentId)

    if (updateError) throw updateError
  }

  // Log activity
  const equipment = await getEquipmentItem(supabase, equipmentId)
  if (equipment) {
    await logActivity(
      supabase,
      equipment.inventory_items.lab_id,
      'maintenance_logged',
      'equipment',
      equipmentId,
      { type: input.type, date: input.date }
    )
  }

  return data
}
