import { Hono } from 'hono'
import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'
import { analyzeExpenses } from '../services/ai'

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/analyze', async (c) => {
  const { month } = await c.req.json<{ month: string }>()
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: 'Formato de mês inválido. Use YYYY-MM.' }, 400)
  }

  const [year, m] = month.split('-').map(Number)
  const start = `${year}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(year, m, 0)
  const end = `${year}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const supabase = getSupabase(c.env)

  // Current month
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .is('merged_with', null)
    .gte('date', start)
    .lte('date', end)

  if (!expenses?.length) {
    return c.json({ analysis: 'Nenhuma despesa registrada neste mês para analisar.' })
  }

  // Previous month
  const prevMonth = m === 1 ? 12 : m - 1
  const prevYear = m === 1 ? year - 1 : year
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  const prevEndDate = new Date(prevYear, prevMonth, 0)
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevEndDate.getDate()).padStart(2, '0')}`

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .is('merged_with', null)
    .gte('date', prevStart)
    .lte('date', prevEnd)

  // Build summary
  const byCategory: Record<string, number> = {}
  let total = 0
  for (const exp of expenses) {
    const cat = exp.category ?? 'Outros'
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(exp.amount)
    total += Number(exp.amount)
  }

  const merchantTotals: Record<string, number> = {}
  for (const exp of expenses) {
    merchantTotals[exp.description] = (merchantTotals[exp.description] ?? 0) + Number(exp.amount)
  }

  const previousTotal = (prevExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)

  const analysis = await analyzeExpenses(c.env.ANTHROPIC_API_KEY, {
    month,
    total,
    previousTotal,
    count: expenses.length,
    byCategory: Object.entries(byCategory).map(([name, amount]) => ({ name, amount })),
    topMerchants: Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount })),
  })

  return c.json({ analysis })
})

export default ai
