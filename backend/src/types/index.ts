export type { Bindings } from './env'

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  subcategory: string | null
  source: string
  source_file: string | null
  installment_of: string | null
  installment_num: number | null
  installment_total: number | null
  pix_e2e_id: string | null
  raw_text_data: string | null
  extraction_source: string | null
  raw_ai_data: Record<string, unknown> | null
  duplicate_score: number | null
  merged_with: string | null
  created_at: string
}

export interface ExpenseItem {
  id: string
  expense_id: string
  description: string
  quantity: number | null
  unit_price: number | null
  amount: number
  category: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string | null
  icon: string | null
  created_at: string
}

export interface AutoRule {
  id: string
  keyword: string
  category: string
  subcategory: string | null
  created_at: string
}

export interface DiscardedUpload {
  id: string
  raw_text: string
  reason: string
  created_at: string
}
