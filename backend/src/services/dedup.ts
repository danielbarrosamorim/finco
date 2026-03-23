import { SupabaseClient } from '@supabase/supabase-js'
import type { Expense } from '../types'

export type DedupAction = 'merge' | 'flag' | 'insert'

export interface DedupResult {
  action: DedupAction
  score: number           // 0–100
  existing_id: string | null
}

// Simple token-overlap similarity (no external deps)
function similarityScore(a: string, b: string): number {
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean)
  const ta = new Set(tokenize(a))
  const tb = new Set(tokenize(b))
  const intersection = [...ta].filter(t => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 0 : intersection / union
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay
}

export async function dedup(
  supabase: SupabaseClient,
  candidate: {
    amount: number
    date: string
    description: string | null
    pix_e2e_id: string | null
  }
): Promise<DedupResult> {
  // Perfect match on Pix E2E ID
  if (candidate.pix_e2e_id) {
    const { data } = await supabase
      .from('expenses')
      .select('id')
      .eq('pix_e2e_id', candidate.pix_e2e_id)
      .limit(1)
      .single()

    if (data) {
      return { action: 'merge', score: 100, existing_id: data.id }
    }
  }

  // Look at recent expenses (±5 days) to limit DB reads
  const dateFrom = new Date(candidate.date)
  dateFrom.setDate(dateFrom.getDate() - 5)
  const dateTo = new Date(candidate.date)
  dateTo.setDate(dateTo.getDate() + 5)

  const { data: recent } = await supabase
    .from('expenses')
    .select('id, amount, date, description')
    .is('merged_with', null)
    .gte('date', dateFrom.toISOString().split('T')[0])
    .lte('date', dateTo.toISOString().split('T')[0])

  if (!recent?.length) {
    return { action: 'insert', score: 0, existing_id: null }
  }

  let bestScore = 0
  let bestId: string | null = null

  for (const exp of recent as Expense[]) {
    let score = 0

    // Amount match (50 pts)
    if (Number(exp.amount) === candidate.amount) score += 50

    // Date within ±2 days (30 pts)
    if (daysBetween(exp.date, candidate.date) <= 2) score += 30

    // Description fuzzy match (20 pts)
    if (candidate.description && exp.description) {
      const sim = similarityScore(candidate.description, exp.description)
      score += Math.round(sim * 20)
    }

    if (score > bestScore) {
      bestScore = score
      bestId = exp.id
    }
  }

  if (bestScore > 90) return { action: 'merge', score: bestScore, existing_id: bestId }
  if (bestScore >= 60) return { action: 'flag', score: bestScore, existing_id: bestId }
  return { action: 'insert', score: bestScore, existing_id: null }
}
