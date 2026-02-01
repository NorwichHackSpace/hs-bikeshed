import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import { parseCSV, autoMatchTransactions, type ParsedTransaction } from '@/lib/csvParser'
import type {
  TransactionImport,
  TransactionWithUser,
  PaymentSummary,
  Profile,
} from '@/types/database'

interface TransactionState {
  transactions: TransactionWithUser[]
  imports: TransactionImport[]
  loading: boolean
  error: string | null
}

interface TransactionActions {
  fetchTransactions: (userId?: string) => Promise<void>
  fetchImports: () => Promise<void>
  uploadCSV: (
    file: File,
    profiles: Profile[]
  ) => Promise<{ matched: number; unmatched: number; duplicateCount: number; importId: string; transactions: ParsedTransaction[] }>
  confirmImport: (
    importId: string,
    transactions: ParsedTransaction[]
  ) => Promise<void>
  matchTransaction: (transactionId: string, userId: string) => Promise<void>
  unmatchTransaction: (transactionId: string) => Promise<void>
  deleteImport: (importId: string) => Promise<void>
  getUserPaymentSummary: (userId: string) => Promise<PaymentSummary>
  clearError: () => void
}

type TransactionStore = TransactionState & TransactionActions

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  imports: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTransactions: async (userId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      // Build base query - use type assertion since table may not exist in generated types yet
      const baseQuery = supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (*),
          matched_by_profile:matched_by (*)
        `)
        .order('transaction_date', { ascending: false })

      const query = userId
        ? baseQuery.eq('user_id', userId)
        : baseQuery

      const { data, error } = await query

      if (error) throw error

      const transactionsWithUser: TransactionWithUser[] = (data ?? []).map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = item as any
        return {
          id: row.id,
          transaction_date: row.transaction_date,
          description: row.description,
          amount: row.amount,
          reference: row.reference,
          balance: row.balance,
          user_id: row.user_id,
          match_confidence: row.match_confidence,
          matched_by: row.matched_by,
          matched_at: row.matched_at,
          import_batch_id: row.import_batch_id,
          raw_data: row.raw_data,
          created_at: row.created_at,
          profiles: row.profiles,
          matched_by_profile: row.matched_by_profile,
        }
      })

      set({ transactions: transactionsWithUser })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchImports: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('transaction_imports')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      set({ imports: data ?? [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  uploadCSV: async (file, profiles) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      // Read file content
      const text = await file.text()

      // Parse CSV
      const { transactions: rawTransactions, errors } = parseCSV(text)

      if (errors.length > 0 && rawTransactions.length === 0) {
        throw new Error(`CSV parsing errors:\n${errors.join('\n')}`)
      }

      if (rawTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV')
      }

      // Auto-match transactions
      const matchedTransactions = autoMatchTransactions(rawTransactions, profiles)

      // Check for existing transactions (duplicates)
      // Fetch existing transactions for the date range in this import
      const dates = matchedTransactions.map((t) => t.transaction_date)
      const minDate = dates.reduce((a, b) => (a < b ? a : b))
      const maxDate = dates.reduce((a, b) => (a > b ? a : b))

      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('transaction_date, description, amount')
        .gte('transaction_date', minDate)
        .lte('transaction_date', maxDate)

      // Create a Set of existing transaction signatures for fast lookup
      const existingSet = new Set(
        (existingTransactions ?? []).map(
          (t) => `${t.transaction_date}|${t.description}|${t.amount}`
        )
      )

      // Mark duplicates
      const transactionsWithDuplicates = matchedTransactions.map((tx) => {
        const signature = `${tx.transaction_date}|${tx.description}|${tx.amount}`
        return {
          ...tx,
          is_duplicate: existingSet.has(signature),
        }
      })

      const newTransactions = transactionsWithDuplicates.filter((t) => !t.is_duplicate)
      const matched = newTransactions.filter((t) => t.user_id !== null).length
      const unmatched = newTransactions.filter((t) => t.user_id === null).length
      const duplicateCount = transactionsWithDuplicates.filter((t) => t.is_duplicate).length

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create import record (pending status)
      const { data: importData, error: importError } = await supabase
        .from('transaction_imports')
        .insert({
          filename: file.name,
          uploaded_by: user.id,
          row_count: newTransactions.length,
          matched_count: matched,
          status: 'pending',
        })
        .select()
        .single()

      if (importError) throw importError

      return {
        matched,
        unmatched,
        duplicateCount,
        importId: importData.id,
        transactions: transactionsWithDuplicates,
      }
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  confirmImport: async (importId, transactions) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Filter out duplicates and unmatched transactions (only import matched)
      const newTransactions = transactions.filter((tx) => !tx.is_duplicate && tx.user_id !== null)

      if (newTransactions.length === 0) {
        // No new transactions to import, just mark as completed
        await supabase
          .from('transaction_imports')
          .update({ status: 'completed', row_count: 0, matched_count: 0 })
          .eq('id', importId)

        await Promise.all([get().fetchTransactions(), get().fetchImports()])
        return
      }

      // Update import status to processing
      await supabase
        .from('transaction_imports')
        .update({ status: 'processing' })
        .eq('id', importId)

      // Insert only non-duplicate transactions
      const transactionInserts = newTransactions.map((tx) => ({
        transaction_date: tx.transaction_date,
        description: tx.description,
        amount: tx.amount,
        reference: tx.reference,
        balance: tx.balance,
        user_id: tx.user_id,
        match_confidence: tx.match_confidence,
        matched_by: tx.user_id ? user.id : null,
        matched_at: tx.user_id ? new Date().toISOString() : null,
        import_batch_id: importId,
        raw_data: tx.raw_data,
      }))

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionInserts)

      if (insertError) throw insertError

      // Update import status to completed
      const matched = newTransactions.filter((t) => t.user_id !== null).length
      await supabase
        .from('transaction_imports')
        .update({
          status: 'completed',
          row_count: newTransactions.length,
          matched_count: matched,
        })
        .eq('id', importId)

      // Refresh data
      await Promise.all([get().fetchTransactions(), get().fetchImports()])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  matchTransaction: async (transactionId, userId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('transactions')
        .update({
          user_id: userId,
          match_confidence: 'manual',
          matched_by: user.id,
          matched_at: new Date().toISOString(),
        })
        .eq('id', transactionId)

      if (error) throw error

      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  unmatchTransaction: async (transactionId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          user_id: null,
          match_confidence: 'unmatched',
          matched_by: null,
          matched_at: null,
        })
        .eq('id', transactionId)

      if (error) throw error

      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteImport: async (importId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      // Transactions will be cascade deleted due to FK constraint
      const { error } = await supabase
        .from('transaction_imports')
        .delete()
        .eq('id', importId)

      if (error) throw error

      await Promise.all([get().fetchTransactions(), get().fetchImports()])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  getUserPaymentSummary: async (userId) => {
    const supabase = getClient()

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })

      if (error) throw error

      const transactions = data ?? []
      const totalPaid = transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const lastPaymentDate = transactions.length > 0 ? transactions[0].transaction_date : null
      const paymentCount = transactions.length

      return {
        totalPaid,
        lastPaymentDate,
        paymentCount,
        transactions,
      }
    } catch (error) {
      throw error
    }
  },
}))
