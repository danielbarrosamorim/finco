import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Expense, ExpenseListResponse } from '@/lib/types'

interface ExpenseFilters {
  month?: string
  category?: string
  search?: string
}

export function useExpenses(filters: ExpenseFilters) {
  const params = new URLSearchParams()
  if (filters.month) params.set('month', filters.month)
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()

  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => api.get<ExpenseListResponse>(`/expenses${qs ? `?${qs}` : ''}`),
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get<Expense>(`/expenses/${id}`),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      description: string
      amount: number
      date: string
      category?: string
      subcategory?: string
      installment_num?: number
      installment_total?: number
    }) => api.post<Expense>('/expenses', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.put<Expense>(`/expenses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}
