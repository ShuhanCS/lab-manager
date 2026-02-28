'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to Supabase Realtime changes on inventory_items for a given lab.
 * Calls `onUpdate` whenever any row is inserted, updated, or deleted.
 */
export function useRealtimeInventory(labId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`inventory-${labId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `lab_id=eq.${labId}`,
        },
        () => onUpdate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [labId, onUpdate])
}
