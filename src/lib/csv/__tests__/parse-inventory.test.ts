import { describe, it, expect } from 'vitest'
import { parseInventoryCsv, generateTemplateCsv } from '../parse-inventory'

describe('CSV parsing', () => {
  it('parses valid CSV rows', () => {
    const csv = 'Name,Type,Quantity,Unit\nPipette Tips,consumable,5,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].name).toBe('Pipette Tips')
    expect(result.valid[0].type).toBe('consumable')
    expect(result.valid[0].quantity).toBe(5)
    expect(result.valid[0].unit).toBe('box')
    expect(result.errors).toHaveLength(0)
  })

  it('captures rows with missing required fields', () => {
    const csv = 'Name,Type,Quantity,Unit\n,consumable,5,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('name')
  })

  it('handles flexible column headers', () => {
    const csv = 'Item Name,Category,Qty,Units\nGloves,consumable,10,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].name).toBe('Gloves')
    expect(result.valid[0].type).toBe('consumable')
    expect(result.valid[0].quantity).toBe(10)
    expect(result.valid[0].unit).toBe('box')
  })

  it('defaults missing quantity to 0', () => {
    const csv = 'Name,Type,Unit\nTest Item,reagent,mL'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].quantity).toBe(0)
  })

  it('defaults missing unit to "unit"', () => {
    const csv = 'Name,Type,Quantity\nTest Item,reagent,3'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].unit).toBe('unit')
  })

  it('handles multiple rows with mixed valid and invalid', () => {
    const csv =
      'Name,Type,Quantity,Unit\nGood Item,consumable,5,box\n,reagent,3,mL\nAnother,chemical,1,bottle'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(3) // row 3 (1-indexed header + 2nd data row)
  })

  it('rejects invalid type values', () => {
    const csv = 'Name,Type,Quantity,Unit\nSomething,invalid_type,1,each'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('type')
    expect(result.errors[0].message).toContain('Invalid type')
  })

  it('rejects negative quantity', () => {
    const csv = 'Name,Type,Quantity,Unit\nTest,-1 Item,reagent,-5,mL'
    // This CSV has "Test" as name and "-1 Item" as type
    // Let me write a cleaner test:
    const csv2 = 'Name,Type,Quantity,Unit\nTest Item,reagent,-5,mL'
    const result = parseInventoryCsv(csv2)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('quantity')
  })

  it('handles rows missing type', () => {
    const csv = 'Name,Type,Quantity,Unit\nSomething,,5,each'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('type')
  })

  it('normalizes type to lowercase', () => {
    const csv = 'Name,Type,Quantity,Unit\nItem,EQUIPMENT,1,piece'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].type).toBe('equipment')
  })

  it('parses optional fields correctly', () => {
    const csv =
      'Name,Type,Quantity,Unit,Description,Catalog Number,Manufacturer,Supplier,Min Threshold\nPipette,equipment,1,each,Digital pipette,CAT-123,Eppendorf,Fisher,3'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].description).toBe('Digital pipette')
    expect(result.valid[0].catalog_number).toBe('CAT-123')
    expect(result.valid[0].manufacturer).toBe('Eppendorf')
    expect(result.valid[0].supplier).toBe('Fisher')
    expect(result.valid[0].min_threshold).toBe(3)
  })

  it('returns empty result for empty CSV', () => {
    const result = parseInventoryCsv('')
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('returns empty result for header-only CSV', () => {
    const csv = 'Name,Type,Quantity,Unit'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('handles vendor as supplier alias', () => {
    const csv = 'Name,Type,Quantity,Unit,Vendor\nItem,consumable,1,box,Sigma-Aldrich'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].supplier).toBe('Sigma-Aldrich')
  })

  it('handles SKU as catalog number alias', () => {
    const csv = 'Name,Type,Quantity,Unit,SKU\nItem,consumable,1,box,SKU-001'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].catalog_number).toBe('SKU-001')
  })
})

describe('Template CSV generation', () => {
  it('generates a valid CSV template', () => {
    const template = generateTemplateCsv()
    expect(template).toContain('Name')
    expect(template).toContain('Type')
    expect(template).toContain('Quantity')
    expect(template).toContain('Unit')
    // Parse the template and verify it has an example row
    const result = parseInventoryCsv(template)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].name).toBe('Pipette Tips 200uL')
  })
})
