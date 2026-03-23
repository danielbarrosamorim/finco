import { useAiAnalysis } from '@/hooks/useAiAnalysis'

interface AiInsightsProps {
  month: string
}

export function AiInsights({ month }: AiInsightsProps) {
  const { mutate, data, isPending, error } = useAiAnalysis()

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Assistente IA</h3>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          IA
        </span>
      </div>

      {data ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {data.analysis}
        </p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">
          Não foi possível gerar a análise. Tente novamente.
        </p>
      ) : null}

      <button
        onClick={() => mutate(month)}
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:opacity-80 disabled:opacity-50"
      >
        {isPending ? 'Analisando...' : data ? 'Analisar novamente' : 'Analisar com IA'}
      </button>
    </div>
  )
}
