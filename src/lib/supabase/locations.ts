import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Location } from './types'

/**
 * Fetch all locations for a lab, ordered so parents come before children.
 * We order by parent_id nulls first (top-level), then by name.
 */
export async function getLocations(
  supabase: SupabaseClient<Database>,
  labId: string
): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('lab_id', labId)
    .order('name', { ascending: true })

  if (error) throw error

  // Sort hierarchically: parents first, then children grouped under parents
  const locations = data ?? []
  const topLevel = locations.filter((l) => !l.parent_id)
  const children = locations.filter((l) => l.parent_id)

  const result: Location[] = []
  for (const parent of topLevel) {
    result.push(parent)
    const kids = children.filter((c) => c.parent_id === parent.id)
    kids.sort((a, b) => a.name.localeCompare(b.name))
    result.push(...kids)
  }

  // Add any orphaned children (parent deleted but child still references it)
  const addedIds = new Set(result.map((r) => r.id))
  for (const child of children) {
    if (!addedIds.has(child.id)) {
      result.push(child)
    }
  }

  return result
}

/**
 * Create a new location in a lab.
 */
export async function createLocation(
  supabase: SupabaseClient<Database>,
  labId: string,
  data: {
    name: string
    type: Location['type']
    parent_id?: string | null
  }
): Promise<Location> {
  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      lab_id: labId,
      name: data.name,
      type: data.type,
      parent_id: data.parent_id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return location
}

/**
 * Update an existing location.
 */
export async function updateLocation(
  supabase: SupabaseClient<Database>,
  locationId: string,
  data: {
    name?: string
    type?: Location['type']
    parent_id?: string | null
  }
): Promise<Location> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.type !== undefined) updateData.type = data.type
  if (data.parent_id !== undefined) updateData.parent_id = data.parent_id

  const { data: location, error } = await supabase
    .from('locations')
    .update(updateData)
    .eq('id', locationId)
    .select()
    .single()

  if (error) throw error
  return location
}

/**
 * Delete a location. Inventory items referencing this location will have
 * their location_id set to null (handled by DB cascade/trigger).
 */
export async function deleteLocation(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)

  if (error) throw error
}
