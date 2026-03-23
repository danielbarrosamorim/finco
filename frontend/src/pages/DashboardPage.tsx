import { useState } from 'react'
import { getCurrentMonth } from '@/lib/formatters'
import { useExpenseSummary } from '@/hooks/useExpenseSummary'
import { MonthSelector } from '@/components/MonthSelector'
import { SpendingSummaryCard } from '@/components/SpendingSummaryCard'
import { CategoryPieChart } from '@/components/CategoryPieChart'
import { CategoryBarChart } from '@/components/CategoryBarChart'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { TopMerchants } from '@/components/TopMerchants'
import { AiInsights } from '@/components/AiInsights'

export function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const { data: summary, isLoading } = useExpenseSummary(month)

  return (
    <div className="mx-auto max-w-lg">
      <MonthSelector month={month} onChange={setMonth} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        </div>
      ) : summary ? (
        <div className="space-y-4 px-4 pb-4">
          <SpendingSummaryCard
            total={summary.total}
            previousTotal={summary.previousTotal}
            count={summary.count}
          />
          <CategoryPieChart data={summary.byCategory} />
          <CategoryBarChart data={summary.byCategory} />
          <TopMerchants data={summary.topMerchants} />
          <MonthlyTrendChart data={summary.monthlyTotals} />
          <AiInsights month={month} />
        </div>
      ) : (
        <p className="py-20 text-center text-gray-400">Nenhum dado disponível</p>
      )}
    </div>
  )
}
