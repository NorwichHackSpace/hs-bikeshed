import type { Profile } from '@/types/database'

export interface RawTransaction {
  transaction_date: string
  description: string
  amount: number
  reference: string | null
  balance: number | null
  raw_data: Record<string, string>
}

export interface ParsedTransaction extends RawTransaction {
  user_id: string | null
  match_confidence: 'auto' | 'unmatched'
  matched_user_name?: string
  is_duplicate?: boolean
}

interface CSVParseResult {
  transactions: RawTransaction[]
  errors: string[]
}

/**
 * Parse CSV content into transaction objects
 * Handles various date formats and amount formats
 */
export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.trim().split('\n')
  const transactions: RawTransaction[] = []
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('CSV file appears to be empty or missing headers')
    return { transactions, errors }
  }

  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())

  // Find column indices - support various common bank CSV formats
  const dateCol = findColumn(headers, ['date', 'transaction date', 'trans date', 'posted date', 'value date'])
  const descCol = findColumn(headers, ['description', 'desc', 'narrative', 'details', 'transaction description', 'memo'])
  const amountCol = findColumn(headers, ['amount', 'value', 'sum', 'transaction amount'])
  const creditCol = findColumn(headers, ['credit', 'money in', 'credit amount', 'paid in'])
  const debitCol = findColumn(headers, ['debit', 'money out', 'debit amount', 'paid out'])
  const refCol = findColumn(headers, ['reference', 'ref', 'transaction reference', 'cheque number'])
  const balanceCol = findColumn(headers, ['balance', 'running balance', 'available balance'])

  if (dateCol === -1) {
    errors.push('Could not find date column. Expected: Date, Transaction Date, etc.')
    return { transactions, errors }
  }

  if (descCol === -1) {
    errors.push('Could not find description column. Expected: Description, Narrative, Details, etc.')
    return { transactions, errors }
  }

  if (amountCol === -1 && creditCol === -1 && debitCol === -1) {
    errors.push('Could not find amount column(s). Expected: Amount, Credit/Debit, Money In/Out, etc.')
    return { transactions, errors }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)

      // Create raw data object for reference
      const rawData: Record<string, string> = {}
      headers.forEach((header, idx) => {
        rawData[header] = values[idx] || ''
      })

      // Parse date
      const dateStr = values[dateCol]?.trim()
      const parsedDate = parseDate(dateStr)
      if (!parsedDate) {
        errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`)
        continue
      }

      // Parse amount
      let amount: number
      if (amountCol !== -1) {
        amount = parseAmount(values[amountCol])
      } else {
        // Handle separate credit/debit columns
        const credit = creditCol !== -1 ? parseAmount(values[creditCol]) : 0
        const debit = debitCol !== -1 ? parseAmount(values[debitCol]) : 0
        amount = credit - debit
      }

      if (isNaN(amount)) {
        errors.push(`Row ${i + 1}: Invalid amount`)
        continue
      }

      const description = values[descCol]?.trim() || ''
      if (!description) {
        errors.push(`Row ${i + 1}: Missing description`)
        continue
      }

      const reference = refCol !== -1 ? values[refCol]?.trim() || null : null
      const balance = balanceCol !== -1 ? parseAmount(values[balanceCol]) : null

      transactions.push({
        transaction_date: parsedDate,
        description,
        amount,
        reference,
        balance: isNaN(balance as number) ? null : balance,
        raw_data: rawData,
      })
    } catch (err) {
      errors.push(`Row ${i + 1}: ${(err as Error).message}`)
    }
  }

  return { transactions, errors }
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Find a column index by trying multiple possible header names
 */
function findColumn(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const idx = headers.indexOf(name.toLowerCase())
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Parse various date formats into ISO date string (YYYY-MM-DD)
 */
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null

  const cleaned = dateStr.trim()

  // Try DD/MM/YYYY (UK format)
  const ukMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (ukMatch) {
    const [, day, month, year] = ukMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Try YYYY-MM-DD (ISO format)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return cleaned
  }

  // Try DD/MM/YYYY with ambiguous check
  const ambiguousMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (ambiguousMatch) {
    const [, first, second, year] = ambiguousMatch
    const firstNum = parseInt(first, 10)
    // If first number > 12, it must be day (UK format)
    if (firstNum > 12) {
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`
    }
    // Default to UK format (DD/MM/YYYY)
    return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`
  }

  // Try DD MMM YYYY (e.g., "25 Jan 2024")
  const textMatch = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (textMatch) {
    const [, day, monthName, year] = textMatch
    const monthNum = monthNameToNumber(monthName)
    if (monthNum) {
      return `${year}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }

  return null
}

function monthNameToNumber(name: string): number | null {
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  }
  return months[name.toLowerCase()] || null
}

/**
 * Parse amount string, handling various formats:
 * - "1,234.56"
 * - "-1234.56"
 * - "(1234.56)" for negative
 * - "1234.56 CR" for credit
 * - "1234.56 DR" for debit
 */
function parseAmount(amountStr: string | undefined): number {
  if (!amountStr) return 0

  let cleaned = amountStr.trim()
  let isNegative = false

  // Check for parentheses (negative)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true
    cleaned = cleaned.slice(1, -1)
  }

  // Check for CR/DR suffix
  if (cleaned.toUpperCase().endsWith('CR')) {
    cleaned = cleaned.slice(0, -2).trim()
  } else if (cleaned.toUpperCase().endsWith('DR')) {
    isNegative = true
    cleaned = cleaned.slice(0, -2).trim()
  }

  // Check for leading minus
  if (cleaned.startsWith('-')) {
    isNegative = true
    cleaned = cleaned.slice(1)
  }

  // Remove currency symbols and thousand separators
  cleaned = cleaned.replace(/[£$€,\s]/g, '')

  const amount = parseFloat(cleaned)
  return isNegative ? -amount : amount
}

const MIN_PAYMENT_REF_LENGTH = 5

/**
 * Check if description starts with the payment reference (case-insensitive)
 * Allows for some variation at the end of the reference
 */
function matchesPaymentReference(description: string, paymentRef: string): boolean {
  if (!paymentRef || paymentRef.length < MIN_PAYMENT_REF_LENGTH) {
    return false
  }

  const descLower = description.toLowerCase()
  const refLower = paymentRef.toLowerCase()

  // Check if description starts with the payment reference
  return descLower.startsWith(refLower)
}

interface ProfilePaymentRef {
  userId: string
  paymentReference: string
  userName: string
}

/**
 * Auto-match transactions to user profiles based on payment_reference only
 * Matches when description starts with the user's payment_reference
 */
export function autoMatchTransactions(
  transactions: RawTransaction[],
  profiles: Profile[]
): ParsedTransaction[] {
  // Build index of profiles with valid payment references
  const profilesWithRefs: ProfilePaymentRef[] = profiles
    .filter((p) => p.payment_reference && p.payment_reference.length >= MIN_PAYMENT_REF_LENGTH)
    .map((p) => ({
      userId: p.id,
      paymentReference: p.payment_reference!,
      userName: p.name || 'Unknown',
    }))

  return transactions.map((tx) => {
    const desc = tx.description

    // Match using payment_reference only
    for (const profile of profilesWithRefs) {
      if (matchesPaymentReference(desc, profile.paymentReference)) {
        return {
          ...tx,
          user_id: profile.userId,
          match_confidence: 'auto' as const,
          matched_user_name: profile.userName,
        }
      }
    }

    return {
      ...tx,
      user_id: null,
      match_confidence: 'unmatched' as const,
    }
  })
}
