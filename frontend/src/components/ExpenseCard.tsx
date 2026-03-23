import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Expense } from '@/lib/types'

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  csv: 'CSV',
  screenshot: 'Print',
  nfe_qrcode: 'NF-e',
  receipt: 'Recibo',
}

export function ExpenseCard({ expense, onEdit }: ExpenseCardProps) {
  const installmentLabel =
    expense.installment_num && expense.installment_total
      ? `${expense.installment_num}/${expense.installment_total}`
      : null

  return (
    <button
      onClick={() => onEdit(expense)}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm active:bg-gray-50 dark:bg-gray-800 dark:active:bg-gray-700"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-full"
        style={{ backgroundColor: expense.category ? undefined : '#94A3B8' }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 dark:text-white">
          {expense.description}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {expense.category ?? 'Sem categoria'}
          {expense.subcategory && ` · ${expense.subcategory}`}
          {' · '}
          {formatDate(expense.date)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </p>
        <div className="flex items-center justify-end gap-1">
          {installmentLabel && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {installmentLabel}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {SOURCE_LABELS[expense.source] ?? expense.source}
          </span>
        </div>
      </div>
    </button>
  )
}
