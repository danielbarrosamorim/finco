import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category } from '@/lib/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; color?: string; icon?: string }) =>
      api.post<Category>('/categories', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; color?: string; icon?: string }) =>
      api.put<Category>(`/categories/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
