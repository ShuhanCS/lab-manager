import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Grant, Transaction, Json } from './types'
import { logActivity } from './inventory'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const grantSchema = z.object({
  name: z.string().min(1, 'Grant name is required'),
  funder: z.string().optional(),
  grant_number: z.string().optional(),
  total_amount: z.number().min(0, 'Amount must be positive'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  categories: z
    .array(
      z.object({
        name: z.string(),
        allocated: z.number().min(0),
      })
    )
    .default([]),
})

export type GrantInput = z.infer<typeof grantSchema>
export type GrantFormValues = z.input<typeof grantSchema>

export const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  inventory_item_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>
export type TransactionFormValues = z.input<typeof transactionSchema>

// ---------------------------------------------------------------------------
// Derived types — Grant with computed spending info
// ---------------------------------------------------------------------------

export type GrantWithSpending = Grant & {
  spent: number
  remaining: number
}

export type CategoryBreakdown = {
  name: string
  allocated: number
  spent: number
}

export type GrantSummary = {
  totalSpent: number
  remaining: number
  categories: CategoryBreakdown[]
}

// ---------------------------------------------------------------------------
// Grant CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch all grants for a lab with computed spent amount (sum of transactions)
 * and remaining amount.
 */
export async function getGrants(
  supabase: SupabaseClient<Database>,
  labId: string
): Promise<GrantWithSpending[]> {
  const { data: grants, error } = await supabase
    .from('grants')
    .select('*')
    .eq('lab_id', labId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch all transactions for this lab's grants in one query
  const grantIds = (grants ?? []).map((g) => g.id)
  if (grantIds.length === 0) return []

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('grant_id, amount')
    .in('grant_id', grantIds)

  if (txError) throw txError

  // Sum transactions per grant
  const spentMap: Record<string, number> = {}
  for (const tx of transactions ?? []) {
    spentMap[tx.grant_id] = (spentMap[tx.grant_id] ?? 0) + tx.amount
  }

  return (grants ?? []).map((g) => {
    const spent = spentMap[g.id] ?? 0
    return {
      ...g,
      spent,
      remaining: g.total_amount - spent,
    }
  })
}

/**
 * Fetch a single grant by ID.
 */
export async function getGrant(
  supabase: SupabaseClient<Database>,
  grantId: string
): Promise<Grant | null> {
  const { data, error } = await supabase
    .from('grants')
    .select('*')
    .eq('id', grantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

/**
 * Create a new grant and log the activity.
 */
export async function createGrant(
  supabase: SupabaseClient<Database>,
  labId: string,
  input: GrantInput
): Promise<Grant> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('grants')
    .insert({
      lab_id: labId,
      created_by: user.id,
      name: input.name,
      funder: input.funder ?? null,
      grant_number: input.grant_number ?? null,
      total_amount: input.total_amount,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      categories: (input.categories ?? []) as unknown as Json,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity(supabase, labId, 'created', 'grant', data.id, {
    name: input.name,
    total_amount: input.total_amount,
  })

  return data
}

/**
 * Update an existing grant and log the activity.
 */
export async function updateGrant(
  supabase: SupabaseClient<Database>,
  grantId: string,
  input: Partial<GrantInput>
): Promise<Grant> {
  const current = await getGrant(supabase, grantId)
  if (!current) throw new Error('Grant not found')

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.funder !== undefined) updateData.funder = input.funder ?? null
  if (input.grant_number !== undefined)
    updateData.grant_number = input.grant_number ?? null
  if (input.total_amount !== undefined)
    updateData.total_amount = input.total_amount
  if (input.start_date !== undefined)
    updateData.start_date = input.start_date ?? null
  if (input.end_date !== undefined) updateData.end_date = input.end_date ?? null
  if (input.categories !== undefined)
    updateData.categories = input.categories as unknown as Json

  const { data, error } = await supabase
    .from('grants')
    .update(updateData)
    .eq('id', grantId)
    .select()
    .single()

  if (error) throw error

  await logActivity(
    supabase,
    current.lab_id,
    'updated',
    'grant',
    grantId,
    { changes: Object.keys(input) }
  )

  return data
}

// ---------------------------------------------------------------------------
// Transaction CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch transactions for a grant, ordered by date descending.
 */
export async function getTransactions(
  supabase: SupabaseClient<Database>,
  grantId: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('grant_id', grantId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Add a transaction to a grant and log the activity.
 */
export async function addTransaction(
  supabase: SupabaseClient<Database>,
  grantId: string,
  input: TransactionInput
): Promise<Transaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get the grant to know the lab_id for activity logging
  const grant = await getGrant(supabase, grantId)
  if (!grant) throw new Error('Grant not found')

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      grant_id: grantId,
      created_by: user.id,
      amount: input.amount,
      date: input.date,
      description: input.description ?? null,
      category: input.category ?? null,
      inventory_item_id: input.inventory_item_id ?? null,
      receipt_url: input.receipt_url ?? null,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity(supabase, grant.lab_id, 'created', 'transaction', data.id, {
    grant_id: grantId,
    amount: input.amount,
    description: input.description,
  })

  return data
}

/**
 * Delete a transaction and log the activity.
 */
export async function deleteTransaction(
  supabase: SupabaseClient<Database>,
  transactionId: string
): Promise<void> {
  // Fetch the transaction to know the grant and lab
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('*, grants!transactions_grant_id_fkey(lab_id)')
    .eq('id', transactionId)
    .single()

  if (fetchError) throw fetchError

  const labId = (tx.grants as unknown as { lab_id: string })?.lab_id
  if (labId) {
    await logActivity(supabase, labId, 'deleted', 'transaction', transactionId, {
      amount: tx.amount,
      description: tx.description,
    })
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Grant summary — per-category breakdown
// ---------------------------------------------------------------------------

/**
 * Calculate total spent, remaining, and per-category breakdown for a grant.
 */
export async function getGrantSummary(
  supabase: SupabaseClient<Database>,
  grantId: string
): Promise<GrantSummary> {
  const grant = await getGrant(supabase, grantId)
  if (!grant) throw new Error('Grant not found')

  const transactions = await getTransactions(supabase, grantId)

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  // Build category breakdown
  const grantCategories = (grant.categories as Array<{ name: string; allocated: number }>) ?? []
  const categorySpentMap: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.category) {
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] ?? 0) + tx.amount
    }
  }

  const categories: CategoryBreakdown[] = grantCategories.map((cat) => ({
    name: cat.name,
    allocated: cat.allocated,
    spent: categorySpentMap[cat.name] ?? 0,
  }))

  // Include an "Uncategorized" entry if there are transactions without categories
  const uncategorizedSpent = transactions
    .filter((tx) => !tx.category)
    .reduce((sum, tx) => sum + tx.amount, 0)

  if (uncategorizedSpent > 0) {
    categories.push({
      name: 'Uncategorized',
      allocated: 0,
      spent: uncategorizedSpent,
    })
  }

  return {
    totalSpent,
    remaining: grant.total_amount - totalSpent,
    categories,
  }
}
