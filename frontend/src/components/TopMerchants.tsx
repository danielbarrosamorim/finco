import { formatCurrency } from '@/lib/formatters'

interface TopMerchantsProps {
  data: { name: string; amount: number }[]
}

export function TopMerchants({ data }: TopMerchantsProps) {
  if (!data.length) return null

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Top estabelecimentos</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
              {item.name}
            </span>
            <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
