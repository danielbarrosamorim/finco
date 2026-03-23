import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExpenseSummary } from '@/lib/types'

export function useExpenseSummary(month: string) {
  return useQuery({
    queryKey: ['expense-summary', month],
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary?month=${month}`),
  })
}
