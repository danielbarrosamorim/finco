import { formatCurrency } from '@/lib/formatters'

interface SpendingSummaryCardProps {
  total: number
  previousTotal: number
  count: number
}

export function SpendingSummaryCard({ total, previousTotal, count }: SpendingSummaryCardProps) {
  const diff = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
  const isUp = diff > 0

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">Total do mês</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {formatCurrency(total)}
      </p>
      <div className="mt-2 flex items-center gap-2 text-sm">
        {previousTotal > 0 && (
          <span className={isUp ? 'text-red-500' : 'text-green-500'}>
            {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
          </span>
        )}
        <span className="text-gray-400">
          {count} {count === 1 ? 'transação' : 'transações'}
        </span>
      </div>
    </div>
  )
}
