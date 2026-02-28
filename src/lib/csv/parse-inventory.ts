import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidRow {
  name: string
  type: 'equipment' | 'reagent' | 'consumable' | 'chemical'
  quantity: number
  unit: string
  description?: string
  catalog_number?: string
  lot_number?: string
  manufacturer?: string
  supplier?: string
  min_threshold?: number
  expiration_date?: string
}

export interface RowError {
  row: number
  field: string
  message: string
}

export interface ParseResult {
  valid: ValidRow[]
  errors: RowError[]
}

// ---------------------------------------------------------------------------
// Flexible column header mapping
// ---------------------------------------------------------------------------

type ColumnKey = keyof ValidRow

/** Maps a normalized header string to its canonical field name */
const headerAliases: Record<string, ColumnKey> = {
  // Name
  name: 'name',
  'item name': 'name',
  'product name': 'name',
  item: 'name',
  // Type
  type: 'type',
  category: 'type',
  'item type': 'type',
  // Quantity
  quantity: 'quantity',
  qty: 'quantity',
  amount: 'quantity',
  count: 'quantity',
  // Unit
  unit: 'unit',
  units: 'unit',
  uom: 'unit',
  'unit of measure': 'unit',
  // Description
  description: 'description',
  desc: 'description',
  notes: 'description',
  // Catalog number
  'catalog number': 'catalog_number',
  'catalog_number': 'catalog_number',
  'catalog #': 'catalog_number',
  'cat #': 'catalog_number',
  'cat number': 'catalog_number',
  sku: 'catalog_number',
  // Lot number
  'lot number': 'lot_number',
  'lot_number': 'lot_number',
  'lot #': 'lot_number',
  'lot': 'lot_number',
  'batch': 'lot_number',
  'batch number': 'lot_number',
  // Manufacturer
  manufacturer: 'manufacturer',
  mfg: 'manufacturer',
  brand: 'manufacturer',
  maker: 'manufacturer',
  // Supplier
  supplier: 'supplier',
  vendor: 'supplier',
  distributor: 'supplier',
  // Min threshold
  'min threshold': 'min_threshold',
  'min_threshold': 'min_threshold',
  threshold: 'min_threshold',
  'minimum': 'min_threshold',
  'low stock threshold': 'min_threshold',
  'reorder point': 'min_threshold',
  // Expiration date
  'expiration date': 'expiration_date',
  'expiration_date': 'expiration_date',
  'expires': 'expiration_date',
  'expiry': 'expiration_date',
  'exp date': 'expiration_date',
  'expiry date': 'expiration_date',
}

const validTypes = new Set(['equipment', 'reagent', 'consumable', 'chemical'])

/**
 * Normalize a CSV header string: lowercase, trim, collapse whitespace.
 */
function normalizeHeader(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Build a mapping from CSV column index to canonical field name.
 */
function buildColumnMap(headers: string[]): Map<number, ColumnKey> {
  const map = new Map<number, ColumnKey>()
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i])
    const field = headerAliases[normalized]
    if (field) {
      map.set(i, field)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Parse function
// ---------------------------------------------------------------------------

/**
 * Parse a CSV string into validated inventory rows.
 *
 * - Flexible column headers (accepts common variations)
 * - Validates required fields (name, type)
 * - Defaults: quantity=0, unit="unit"
 * - Returns valid rows and per-row errors
 */
export function parseInventoryCsv(csvString: string): ParseResult {
  const parsed = Papa.parse<string[]>(csvString, {
    header: false,
    skipEmptyLines: true,
  })

  if (parsed.data.length === 0) {
    return { valid: [], errors: [] }
  }

  // First row = headers
  const headers = parsed.data[0]
  const columnMap = buildColumnMap(headers)
  const dataRows = parsed.data.slice(1)

  const valid: ValidRow[] = []
  const errors: RowError[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNumber = i + 2 // 1-indexed, +1 for header row
    const record: Record<string, string> = {}

    // Map columns
    for (const [colIdx, fieldName] of columnMap.entries()) {
      const value = row[colIdx]?.trim() ?? ''
      if (value) {
        record[fieldName] = value
      }
    }

    const rowErrors: RowError[] = []

    // Validate name (required)
    if (!record.name) {
      rowErrors.push({ row: rowNumber, field: 'name', message: 'Name is required' })
    }

    // Validate type (required, must be valid enum)
    if (!record.type) {
      rowErrors.push({ row: rowNumber, field: 'type', message: 'Type is required' })
    } else if (!validTypes.has(record.type.toLowerCase())) {
      rowErrors.push({
        row: rowNumber,
        field: 'type',
        message: `Invalid type "${record.type}". Must be one of: equipment, reagent, consumable, chemical`,
      })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }

    // Parse quantity — default to 0
    let quantity = 0
    if (record.quantity) {
      const parsed = Number(record.quantity)
      if (isNaN(parsed) || parsed < 0) {
        errors.push({
          row: rowNumber,
          field: 'quantity',
          message: `Invalid quantity "${record.quantity}". Must be a non-negative number`,
        })
        continue
      }
      quantity = parsed
    }

    // Parse min_threshold
    let min_threshold: number | undefined
    if (record.min_threshold) {
      const parsed = Number(record.min_threshold)
      if (!isNaN(parsed) && parsed >= 0) {
        min_threshold = parsed
      }
    }

    // Build valid row
    const validRow: ValidRow = {
      name: record.name!,
      type: record.type!.toLowerCase() as ValidRow['type'],
      quantity,
      unit: record.unit || 'unit',
      description: record.description || undefined,
      catalog_number: record.catalog_number || undefined,
      lot_number: record.lot_number || undefined,
      manufacturer: record.manufacturer || undefined,
      supplier: record.supplier || undefined,
      min_threshold,
      expiration_date: record.expiration_date || undefined,
    }

    valid.push(validRow)
  }

  return { valid, errors }
}

// ---------------------------------------------------------------------------
// Template CSV generation
// ---------------------------------------------------------------------------

/**
 * Generate a CSV template string with all supported headers and an example row.
 */
export function generateTemplateCsv(): string {
  const headers = [
    'Name',
    'Type',
    'Quantity',
    'Unit',
    'Description',
    'Catalog Number',
    'Lot Number',
    'Manufacturer',
    'Supplier',
    'Min Threshold',
    'Expiration Date',
  ]

  const exampleRow = [
    'Pipette Tips 200uL',
    'consumable',
    '5',
    'box',
    'Filtered, sterile',
    'T-200-S',
    'LOT-2024-001',
    'Eppendorf',
    'Fisher Scientific',
    '2',
    '2025-12-31',
  ]

  return Papa.unparse([headers, exampleRow])
}
