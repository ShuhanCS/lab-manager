import { create } from 'zustand'

interface InventoryFilters {
  type?: string
  status?: string
  search?: string
  locationId?: string
}

interface InventoryStore {
  filters: InventoryFilters
  setFilter: (key: keyof InventoryFilters, value: string | undefined) => void
  clearFilters: () => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value || undefined,
      },
    })),
  clearFilters: () => set({ filters: {} }),
}))
