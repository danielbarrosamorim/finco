import { Hono } from 'hono'
import { Bindings } from '../types'
import type { UploadMessage } from '../queues/processor'

const upload = new Hono<{ Bindings: Bindings }>()

upload.post('/', async (c) => {
  const body = await c.req.json<{ text?: string; source_app?: string }>()

  if (!body.text?.trim()) {
    return c.json({ error: 'Campo "text" é obrigatório' }, 400)
  }

  if (body.text.length > 10_000) {
    return c.json({ error: 'Texto muito longo (máximo 10.000 caracteres)' }, 400)
  }

  const message: UploadMessage = {
    text: body.text.trim(),
    source_app: body.source_app ?? null,
    received_at: Date.now(),
  }

  await c.env.UPLOAD_QUEUE.send(message)

  return c.json({ ok: true }, 202)
})

export default upload
