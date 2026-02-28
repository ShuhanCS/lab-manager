import { describe, it, expect } from 'vitest'
import { validateInventoryItem } from '../inventory'

describe('inventory validation', () => {
  it('rejects items without a name', () => {
    const result = validateInventoryItem({
      name: '',
      type: 'consumable',
      quantity: 1,
      unit: 'box',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid items', () => {
    const result = validateInventoryItem({
      name: 'Pipette Tips',
      type: 'consumable',
      quantity: 5,
      unit: 'box',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative quantity', () => {
    const result = validateInventoryItem({
      name: 'Gloves',
      type: 'consumable',
      quantity: -1,
      unit: 'box',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = validateInventoryItem({
      name: 'Test',
      type: 'invalid',
      quantity: 1,
      unit: 'unit',
    })
    expect(result.success).toBe(false)
  })

  it('defaults min_threshold to 0', () => {
    const result = validateInventoryItem({
      name: 'Test',
      type: 'reagent',
      quantity: 10,
      unit: 'mL',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.min_threshold).toBe(0)
    }
  })

  it('accepts all optional fields', () => {
    const result = validateInventoryItem({
      name: 'Sodium Chloride',
      type: 'chemical',
      quantity: 500,
      unit: 'g',
      description: 'Lab-grade NaCl',
      min_threshold: 50,
      location_id: null,
      catalog_number: 'S9888',
      lot_number: 'LOT-2026-001',
      manufacturer: 'Sigma-Aldrich',
      supplier: 'Fisher Scientific',
      expiration_date: '2027-12-31',
      conductscience_product_id: null,
      barcode: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative min_threshold', () => {
    const result = validateInventoryItem({
      name: 'Test',
      type: 'reagent',
      quantity: 10,
      unit: 'mL',
      min_threshold: -5,
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero quantity', () => {
    const result = validateInventoryItem({
      name: 'Empty item',
      type: 'consumable',
      quantity: 0,
      unit: 'each',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing unit', () => {
    const result = validateInventoryItem({
      name: 'Test',
      type: 'equipment',
      quantity: 1,
      unit: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all four item types', () => {
    for (const type of ['equipment', 'reagent', 'consumable', 'chemical']) {
      const result = validateInventoryItem({
        name: `Test ${type}`,
        type,
        quantity: 1,
        unit: 'unit',
      })
      expect(result.success).toBe(true)
    }
  })
})
