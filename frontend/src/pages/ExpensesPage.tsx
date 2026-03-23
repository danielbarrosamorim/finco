import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentMonth } from '@/lib/formatters'
import { useExpenses } from '@/hooks/useExpenses'
import { MonthSelector } from '@/components/MonthSelector'
import { ExpenseCard } from '@/components/ExpenseCard'
import { EmptyState } from '@/components/EmptyState'

export function ExpensesPage() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(getCurrentMonth)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useExpenses({ month, search: search || undefined })

  return (
    <div className="mx-auto max-w-lg">
      <MonthSelector month={month} onChange={setMonth} />

      {/* Search */}
      <div className="px-4 pb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar despesas..."
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* List */}
      <div className="space-y-2 px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          </div>
        ) : data?.data.length ? (
          data.data.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={(e) => navigate(`/expenses/${e.id}`)}
            />
          ))
        ) : (
          <EmptyState
            title="Nenhuma despesa"
            description="Adicione sua primeira despesa"
            action={{ label: 'Adicionar', onClick: () => navigate('/expenses/new') }}
          />
        )}
      </div>
    </div>
  )
}
