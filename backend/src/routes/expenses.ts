import { Hono } from 'hono'
import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'
import { categorize } from '../services/categorize'

const expenses = new Hono<{ Bindings: Bindings }>()

// List expenses with filters
expenses.get('/', async (c) => {
  const month = c.req.query('month')       // YYYY-MM
  const category = c.req.query('category')
  const search = c.req.query('search')
  const limit = parseInt(c.req.query('limit') ?? '50')
  const offset = parseInt(c.req.query('offset') ?? '0')

  const supabase = getSupabase(c.env)
  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' })
    .is('merged_with', null)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (month) {
    const [year, m] = month.split('-').map(Number)
    const start = `${year}-${String(m).padStart(2, '0')}-01`
    const endDate = new Date(year, m, 0) // last day of month
    const end = `${year}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    query = query.gte('date', start).lte('date', end)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('description', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: 'Erro ao buscar despesas' }, 500)
  return c.json({ data, total: count })
})

// Summary for dashboard
expenses.get('/summary', async (c) => {
  const month = c.req.query('month') // YYYY-MM
  if (!month) return c.json({ error: 'Parâmetro "month" é obrigatório' }, 400)

  const [year, m] = month.split('-').map(Number)
  const start = `${year}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(year, m, 0)
  const end = `${year}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const supabase = getSupabase(c.env)

  // Current month expenses
  const { data: currentExpenses, error } = await supabase
    .from('expenses')
    .select('*')
    .is('merged_with', null)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) return c.json({ error: 'Erro ao buscar resumo' }, 500)

  // Previous month for comparison
  const prevMonth = m === 1 ? 12 : m - 1
  const prevYear = m === 1 ? year - 1 : year
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  const prevEndDate = new Date(prevYear, prevMonth, 0)
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevEndDate.getDate()).padStart(2, '0')}`

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .is('merged_with', null)
    .gte('date', prevStart)
    .lte('date', prevEnd)

  // Totals by category
  const byCategory: Record<string, number> = {}
  let total = 0
  for (const exp of currentExpenses ?? []) {
    const cat = exp.category ?? 'Outros'
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(exp.amount)
    total += Number(exp.amount)
  }

  const prevTotal = (prevExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

  // Top merchants
  const merchantTotals: Record<string, number> = {}
  for (const exp of currentExpenses ?? []) {
    merchantTotals[exp.description] = (merchantTotals[exp.description] ?? 0) + Number(exp.amount)
  }
  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))

  // Monthly totals (last 12 months)
  const twelveMonthsAgo = new Date(year, m - 12, 1).toISOString().split('T')[0]
  const { data: yearExpenses } = await supabase
    .from('expenses')
    .select('amount, date')
    .is('merged_with', null)
    .gte('date', twelveMonthsAgo)
    .lte('date', end)

  const monthlyTotals: Record<string, number> = {}
  for (const exp of yearExpenses ?? []) {
    const ym = exp.date.substring(0, 7)
    monthlyTotals[ym] = (monthlyTotals[ym] ?? 0) + Number(exp.amount)
  }

  return c.json({
    total,
    previousTotal: prevTotal,
    count: currentExpenses?.length ?? 0,
    byCategory: Object.entries(byCategory).map(([name, amount]) => ({ name, amount })),
    topMerchants,
    monthlyTotals: Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount })),
  })
})

// Get single expense with items
expenses.get('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)

  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !expense) return c.json({ error: 'Despesa não encontrada' }, 404)

  const { data: items } = await supabase
    .from('expense_items')
    .select('*')
    .eq('expense_id', id)
    .order('created_at')

  return c.json({ ...expense, items: items ?? [] })
})

// Create expense
expenses.post('/', async (c) => {
  const body = await c.req.json<{
    description: string
    amount: number
    date: string
    category?: string
    subcategory?: string
    source?: string
    installment_num?: number
    installment_total?: number
  }>()

  if (!body.description?.trim() || !body.amount || !body.date) {
    return c.json({ error: 'Descrição, valor e data são obrigatórios' }, 400)
  }

  const supabase = getSupabase(c.env)

  // Auto-categorize if no category provided
  let category = body.category ?? null
  let subcategory = body.subcategory ?? null

  if (!category) {
    const { data: rules } = await supabase.from('auto_rules').select('*')
    const match = categorize(body.description, rules ?? [])
    if (match) {
      category = match.category
      subcategory = match.subcategory
    }
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      description: body.description.trim(),
      amount: body.amount,
      date: body.date,
      category,
      subcategory,
      source: body.source ?? 'manual',
      installment_num: body.installment_num ?? null,
      installment_total: body.installment_total ?? null,
    })
    .select()
    .single()

  if (error) return c.json({ error: 'Erro ao criar despesa' }, 500)
  return c.json(data, 201)
})

// Update expense
expenses.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Record<string, unknown>>()

  // Only allow updating safe fields
  const allowed = [
    'description', 'amount', 'date', 'category', 'subcategory',
    'installment_num', 'installment_total',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: 'Erro ao atualizar despesa' }, 500)
  if (!data) return c.json({ error: 'Despesa não encontrada' }, 404)
  return c.json(data)
})

// Delete expense
expenses.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return c.json({ error: 'Erro ao excluir despesa' }, 500)
  return c.json({ ok: true })
})

export default expenses
