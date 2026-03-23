import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AutoRule } from '@/lib/types'

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get<AutoRule[]>('/rules'),
  })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { keyword: string; category: string; subcategory?: string }) =>
      api.post<AutoRule>('/rules', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useUpdateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; keyword?: string; category?: string; subcategory?: string }) =>
      api.put<AutoRule>(`/rules/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}
