import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useAiAnalysis() {
  return useMutation({
    mutationFn: (month: string) =>
      api.post<{ analysis: string }>('/ai/analyze', { month }),
  })
}
