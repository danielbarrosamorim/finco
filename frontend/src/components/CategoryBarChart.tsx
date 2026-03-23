import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface CategoryBarChartProps {
  data: { name: string; amount: number }[]
}

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EC4899', '#8B5CF6', '#F97316', '#EAB308', '#6B7280', '#94A3B8']

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (!data.length) return null

  const sorted = [...data].sort((a, b) => b.amount - a.amount)

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Gastos por categoria</h3>
      <ResponsiveContainer width="100%" height={sorted.length * 44 + 20}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={24}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
