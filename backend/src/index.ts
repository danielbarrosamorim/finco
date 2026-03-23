import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Bindings } from './types'
import health from './routes/health'
import categories from './routes/categories'
import rules from './routes/rules'
import expenses from './routes/expenses'
import ai from './routes/ai'
import upload from './routes/upload'
import { processQueue } from './queues/processor'
import type { UploadMessage } from './queues/processor'

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors())

// API key auth — skip health endpoint
app.use('*', async (c, next) => {
  if (c.req.path === '/health') return next()

  const auth = c.req.header('Authorization')
  if (!auth || auth !== `Bearer ${c.env.API_KEY}`) {
    return c.json({ error: 'Não autorizado' }, 401)
  }
  return next()
})

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Ocorreu um erro inesperado. Tente novamente.' }, 500)
})

// Routes
app.route('/health', health)
app.route('/categories', categories)
app.route('/rules', rules)
app.route('/expenses', expenses)
app.route('/ai', ai)
app.route('/upload', upload)

export default {
  fetch: app.fetch,
  queue: (batch: MessageBatch<UploadMessage>, env: Bindings) =>
    processQueue(batch, env),
}
