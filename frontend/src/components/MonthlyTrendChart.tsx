import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface MonthlyTrendChartProps {
  data: { month: string; amount: number }[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length < 2) return null

  const formatted = data.map((d) => ({
    ...d,
    label: d.month.split('-').reverse().join('/'), // MM/YYYY → short
  }))

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Evolução mensal</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => String(label)}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#6366F1' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
