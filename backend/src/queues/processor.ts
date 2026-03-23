import { Bindings } from '../types'
import { getSupabase } from '../services/supabase'
import { extract } from '../services/extractor'
import { dedup } from '../services/dedup'
import { categorize } from '../services/categorize'

export interface UploadMessage {
  text: string
  source_app: string | null
  received_at: number
}

export async function processQueue(
  batch: MessageBatch<UploadMessage>,
  env: Bindings
): Promise<void> {
  const supabase = getSupabase(env)

  for (const message of batch.messages) {
    try {
      const { text, source_app } = message.body

      // Extract structured data from raw text
      const extracted = await extract(text, env.ANTHROPIC_API_KEY)

      if (!extracted || extracted.amount === null) {
        // Could not extract minimum required fields — log and discard
        await supabase.from('discarded_uploads').insert({
          raw_text: text,
          reason: extracted ? 'low_confidence' : 'parse_failed',
        })
        message.ack()
        continue
      }

      // Auto-categorize if no category from extraction
      let category = extracted.description
        ? (await (async () => {
            const { data: rules } = await supabase.from('auto_rules').select('*')
            return categorize(extracted.description!, rules ?? [])
          })())
        : null

      const date = extracted.date ?? new Date().toISOString().split('T')[0]
      const description = extracted.description ?? source_app ?? 'Comprovante'

      // Deduplication
      const dedupResult = await dedup(supabase, {
        amount: extracted.amount,
        date,
        description,
        pix_e2e_id: extracted.pix_e2e_id,
      })

      if (dedupResult.action === 'merge' && dedupResult.existing_id) {
        // Mark the existing record — no new row needed
        await supabase
          .from('expenses')
          .update({ duplicate_score: dedupResult.score })
          .eq('id', dedupResult.existing_id)
        message.ack()
        continue
      }

      // Insert new expense
      const { error } = await supabase.from('expenses').insert({
        description,
        amount: extracted.amount,
        date,
        category: category?.category ?? null,
        subcategory: category?.subcategory ?? null,
        source: 'screenshot',
        pix_e2e_id: extracted.pix_e2e_id,
        raw_text_data: text,
        extraction_source: extracted.extraction_source,
        raw_ai_data: extracted.raw_ai_data,
        duplicate_score: dedupResult.action === 'flag' ? dedupResult.score : null,
        merged_with: null,
      })

      if (error) {
        console.error('Failed to insert expense:', error)
        message.retry()
        continue
      }

      message.ack()
    } catch (err) {
      console.error('Queue processor error:', err)
      message.retry()
    }
  }
}
