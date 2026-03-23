import Anthropic from '@anthropic-ai/sdk'
import { parse, type ParsedExpense } from './parser'

export interface ExtractedExpense extends ParsedExpense {
  extraction_source: 'regex' | 'claude_text'
  raw_ai_data: Record<string, unknown> | null
}

const CONFIDENCE_THRESHOLD = 0.8

export async function extract(
  text: string,
  apiKey: string
): Promise<ExtractedExpense | null> {
  // Try regex parser first
  const parsed = parse(text)

  if (parsed.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      ...parsed,
      extraction_source: 'regex',
      raw_ai_data: null,
    }
  }

  // Fallback: Claude Text
  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // cheapest model for structured extraction
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Extraia os dados do comprovante abaixo e responda SOMENTE em JSON válido, sem explicações:
{"amount":number,"date":"YYYY-MM-DD","description":"string","category":"string","pix_e2e_id":"string ou null","cnpj":"string ou null"}

Comprovante:
${text}`,
        },
      ],
    })

    const block = response.content[0]
    if (block.type !== 'text') return null

    // Strip markdown code fences if present
    const jsonText = block.text.replace(/```(?:json)?\n?/g, '').trim()
    const ai = JSON.parse(jsonText) as {
      amount: number
      date: string
      description: string
      category: string
      pix_e2e_id: string | null
      cnpj: string | null
    }

    return {
      amount: ai.amount ?? parsed.amount,
      date: ai.date ?? parsed.date,
      pix_e2e_id: ai.pix_e2e_id ?? parsed.pix_e2e_id,
      cnpj: ai.cnpj ?? parsed.cnpj,
      description: ai.description ?? parsed.description,
      confidence: 0.9, // Claude response treated as high-confidence
      extraction_source: 'claude_text',
      raw_ai_data: { response: ai, usage: response.usage },
    }
  } catch (err) {
    console.error('Claude Text extraction failed:', err)
    // Return regex result even if low-confidence rather than losing the data
    if (parsed.amount !== null) {
      return {
        ...parsed,
        extraction_source: 'regex',
        raw_ai_data: null,
      }
    }
    return null
  }
}
