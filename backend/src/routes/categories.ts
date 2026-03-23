import { Hono } from 'hono'
import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'

const categories = new Hono<{ Bindings: Bindings }>()

// List all categories
categories.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) return c.json({ error: 'Erro ao buscar categorias' }, 500)
  return c.json(data)
})

// Create category
categories.post('/', async (c) => {
  const body = await c.req.json<{ name: string; color?: string; icon?: string }>()
  if (!body.name?.trim()) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: body.name.trim(), color: body.color ?? null, icon: body.icon ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Já existe uma categoria com esse nome' }, 409)
    }
    return c.json({ error: 'Erro ao criar categoria' }, 500)
  }
  return c.json(data, 201)
})

// Update category
categories.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; color?: string; icon?: string }>()

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.icon !== undefined && { icon: body.icon }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: 'Erro ao atualizar categoria' }, 500)
  if (!data) return c.json({ error: 'Categoria não encontrada' }, 404)
  return c.json(data)
})

// Delete category
categories.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)

  // Check if any expenses use this category
  const { count } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('category', id)

  if (count && count > 0) {
    return c.json({ error: 'Não é possível excluir: existem despesas com essa categoria' }, 409)
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return c.json({ error: 'Erro ao excluir categoria' }, 500)
  return c.json({ ok: true })
})

export default categories
