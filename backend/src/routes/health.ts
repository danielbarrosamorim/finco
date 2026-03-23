import { Hono } from 'hono'
import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'

const health = new Hono<{ Bindings: Bindings }>()

health.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('categories').select('id').limit(1)

  return c.json({
    status: error ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    ...(error && { db_error: error.message }),
  })
})

export default health
