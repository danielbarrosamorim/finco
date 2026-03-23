import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface CategoryPieChartProps {
  data: { name: string; amount: number }[]
}

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EC4899', '#8B5CF6', '#F97316', '#EAB308', '#6B7280', '#94A3B8']

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) return null

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Por categoria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}
