import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InventoryItem, Json } from './types'

// ---------------------------------------------------------------------------
// Zod schema for inventory item validation
// ---------------------------------------------------------------------------

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['equipment', 'reagent', 'consumable', 'chemical']),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  min_threshold: z.number().min(0).optional().default(0),
  location_id: z.string().uuid().nullable().optional(),
  catalog_number: z.string().optional(),
  lot_number: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  expiration_date: z.string().nullable().optional(),
  conductscience_product_id: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type InventoryItemFormValues = z.input<typeof inventoryItemSchema>

export function validateInventoryItem(data: unknown) {
  return inventoryItemSchema.safeParse(data)
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface InventoryFilters {
  type?: InventoryItem['type']
  status?: InventoryItem['status']
  search?: string
  locationId?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the stock status based on quantity and threshold.
 */
function computeStatus(
  quantity: number,
  minThreshold: number
): InventoryItem['status'] {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= minThreshold) return 'low_stock'
  return 'in_stock'
}

// ---------------------------------------------------------------------------
// Activity log helper
// ---------------------------------------------------------------------------

export async function logActivity(
  supabase: SupabaseClient<Database>,
  labId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('activity_log').insert({
    lab_id: labId,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details as Json,
  })
}

// ---------------------------------------------------------------------------
// CRUD Functions
// ---------------------------------------------------------------------------

/**
 * Fetch inventory items with optional filters (type, status, location, search).
 * Search matches on name, description, and catalog_number.
 */
export async function getInventoryItems(
  supabase: SupabaseClient<Database>,
  labId: string,
  filters?: InventoryFilters
): Promise<InventoryItem[]> {
  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('lab_id', labId)
    .order('name', { ascending: true })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId)
  }

  if (filters?.search) {
    // ilike search across name, description, catalog_number
    const term = `%${filters.search}%`
    query = query.or(
      `name.ilike.${term},description.ilike.${term},catalog_number.ilike.${term}`
    )
  }

  const { data, error } = await query

  if (error) throw error
  return data ?? []
}

/**
 * Fetch a single inventory item by ID.
 */
export async function getInventoryItem(
  supabase: SupabaseClient<Database>,
  itemId: string
): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }

  return data
}

/**
 * Create an inventory item. Status is computed automatically from quantity
 * and min_threshold.
 */
export async function createInventoryItem(
  supabase: SupabaseClient<Database>,
  labId: string,
  input: InventoryItemInput
): Promise<InventoryItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const status = computeStatus(input.quantity, input.min_threshold ?? 0)

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      lab_id: labId,
      created_by: user.id,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      quantity: input.quantity,
      unit: input.unit,
      min_threshold: input.min_threshold ?? 0,
      location_id: input.location_id ?? null,
      catalog_number: input.catalog_number ?? null,
      lot_number: input.lot_number ?? null,
      manufacturer: input.manufacturer ?? null,
      supplier: input.supplier ?? null,
      expiration_date: input.expiration_date ?? null,
      conductscience_product_id: input.conductscience_product_id ?? null,
      barcode: input.barcode ?? null,
      status,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity(supabase, labId, 'created', 'inventory_item', data.id, {
    name: input.name,
    type: input.type,
    quantity: input.quantity,
  })

  return data
}

/**
 * Update an existing inventory item. Recomputes status if quantity or
 * threshold changed.
 */
export async function updateInventoryItem(
  supabase: SupabaseClient<Database>,
  itemId: string,
  input: Partial<InventoryItemInput>
): Promise<InventoryItem> {
  // Fetch the current item to compute status if needed
  const current = await getInventoryItem(supabase, itemId)
  if (!current) throw new Error('Item not found')

  const quantity = input.quantity ?? current.quantity
  const threshold = input.min_threshold ?? current.min_threshold
  const status = computeStatus(quantity, threshold)

  const updateData: Record<string, unknown> = { ...input, status }
  // Remove undefined values so Supabase doesn't try to set them
  for (const key of Object.keys(updateData)) {
    if (updateData[key] === undefined) delete updateData[key]
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error

  await logActivity(
    supabase,
    current.lab_id,
    'updated',
    'inventory_item',
    itemId,
    { changes: Object.keys(input) }
  )

  return data
}

/**
 * Increment or decrement the quantity of an item. Auto-updates status based
 * on the new quantity vs. min_threshold.
 */
export async function updateQuantity(
  supabase: SupabaseClient<Database>,
  itemId: string,
  delta: number
): Promise<InventoryItem> {
  const current = await getInventoryItem(supabase, itemId)
  if (!current) throw new Error('Item not found')

  const newQuantity = Math.max(0, current.quantity + delta)
  const status = computeStatus(newQuantity, current.min_threshold)

  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity: newQuantity, status })
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error

  await logActivity(
    supabase,
    current.lab_id,
    'quantity_changed',
    'inventory_item',
    itemId,
    {
      previous: current.quantity,
      delta,
      new: newQuantity,
      status,
    }
  )

  return data
}

/**
 * Delete an inventory item. Logs the action before deleting.
 */
export async function deleteInventoryItem(
  supabase: SupabaseClient<Database>,
  itemId: string
): Promise<void> {
  const current = await getInventoryItem(supabase, itemId)
  if (!current) throw new Error('Item not found')

  await logActivity(
    supabase,
    current.lab_id,
    'deleted',
    'inventory_item',
    itemId,
    { name: current.name, type: current.type }
  )

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

/**
 * Fetch activity logs for a specific entity.
 */
export async function getItemActivityLogs(
  supabase: SupabaseClient<Database>,
  entityId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Fetch locations for a lab (used to populate the location dropdown).
 */
export async function getLabLocations(
  supabase: SupabaseClient<Database>,
  labId: string
) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('lab_id', labId)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}
