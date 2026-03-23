import { Hono } from 'hono'
import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'

const rules = new Hono<{ Bindings: Bindings }>()

// List all rules
rules.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('auto_rules')
    .select('*')
    .order('keyword')

  if (error) return c.json({ error: 'Erro ao buscar regras' }, 500)
  return c.json(data)
})

// Create rule
rules.post('/', async (c) => {
  const body = await c.req.json<{ keyword: string; category: string; subcategory?: string }>()
  if (!body.keyword?.trim() || !body.category?.trim()) {
    return c.json({ error: 'Palavra-chave e categoria são obrigatórios' }, 400)
  }

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('auto_rules')
    .insert({
      keyword: body.keyword.trim(),
      category: body.category.trim(),
      subcategory: body.subcategory?.trim() ?? null,
    })
    .select()
    .single()

  if (error) return c.json({ error: 'Erro ao criar regra' }, 500)
  return c.json(data, 201)
})

// Update rule
rules.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ keyword?: string; category?: string; subcategory?: string }>()

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('auto_rules')
    .update({
      ...(body.keyword !== undefined && { keyword: body.keyword.trim() }),
      ...(body.category !== undefined && { category: body.category.trim() }),
      ...(body.subcategory !== undefined && { subcategory: body.subcategory?.trim() ?? null }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: 'Erro ao atualizar regra' }, 500)
  if (!data) return c.json({ error: 'Regra não encontrada' }, 404)
  return c.json(data)
})

// Delete rule
rules.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)

  const { error } = await supabase.from('auto_rules').delete().eq('id', id)
  if (error) return c.json({ error: 'Erro ao excluir regra' }, 500)
  return c.json({ ok: true })
})

export default rules
