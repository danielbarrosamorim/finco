import { formatMonth, addMonths } from '@/lib/formatters'

interface MonthSelectorProps {
  month: string
  onChange: (month: string) => void
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={() => onChange(addMonths(month, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-700"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {formatMonth(month)}
      </h2>
      <button
        onClick={() => onChange(addMonths(month, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-700"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  )
}
