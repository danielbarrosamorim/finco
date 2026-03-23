export interface ParsedExpense {
  amount: number | null
  date: string | null       // YYYY-MM-DD
  pix_e2e_id: string | null
  cnpj: string | null
  description: string | null
  confidence: number        // 0–1
}

// ── Regexes ───────────────────────────────────────────────────────────────────

const RE_AMOUNT = [
  /R\$\s*([\d.]+,\d{2})/i,           // R$ 1.234,56
  /R\$\s*(\d+,\d{2})/i,             // R$ 45,90
  /valor[:\s]+R?\$?\s*([\d.]+,\d{2})/i, // Valor: 45,90
  /total[:\s]+R?\$?\s*([\d.]+,\d{2})/i, // Total: 45,90
]

const RE_DATE = [
  /(\d{2})\/(\d{2})\/(\d{4})/,      // 23/03/2026
  /(\d{2})\/(\d{2})\/(\d{2})/,      // 23/03/26
  /(\d{2})-(\d{2})-(\d{4})/,        // 23-03-2026
  /(\d{4})-(\d{2})-(\d{2})/,        // 2026-03-23 (ISO)
  /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i, // 23 de março de 2026
]

const PT_MONTHS: Record<string, string> = {
  janeiro: '01', fevereiro: '02', março: '03', marco: '03',
  abril: '04', maio: '05', junho: '06', julho: '07',
  agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
}

// Pix E2E ID: starts with E, 32 chars total, alphanumeric
const RE_PIX_E2E = /\b(E\d{8}[A-Z0-9]{23})\b/i

// CNPJ: 00.000.000/0000-00
const RE_CNPJ = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseAmount(text: string): number | null {
  for (const re of RE_AMOUNT) {
    const m = text.match(re)
    if (m) {
      // Convert Brazilian format (1.234,56) to number
      const clean = m[1].replace(/\./g, '').replace(',', '.')
      const val = parseFloat(clean)
      if (!isNaN(val) && val > 0) return val
    }
  }
  return null
}

function parseDate(text: string): string | null {
  // ISO format: YYYY-MM-DD
  const iso = text.match(RE_DATE[4] ?? /(\d{4})-(\d{2})-(\d{2})/)
  // Try each pattern
  for (let i = 0; i < RE_DATE.length; i++) {
    const m = text.match(RE_DATE[i])
    if (!m) continue

    if (i === 4) {
      // "23 de março de 2026"
      const day = m[1].padStart(2, '0')
      const month = PT_MONTHS[m[2].toLowerCase()] ?? null
      const year = m[3]
      if (month) return `${year}-${month}-${day}`
    } else if (i === 3) {
      // YYYY-MM-DD
      return `${m[1]}-${m[2]}-${m[3]}`
    } else if (i === 1) {
      // DD/MM/YY → assume 2000s
      const year = parseInt(m[3]) + 2000
      return `${year}-${m[2]}-${m[1]}`
    } else {
      // DD/MM/YYYY or DD-MM-YYYY
      return `${m[3]}-${m[2]}-${m[1]}`
    }
  }

  void iso
  return null
}

function parsePixE2E(text: string): string | null {
  const m = text.match(RE_PIX_E2E)
  return m ? m[1].toUpperCase() : null
}

function parseCNPJ(text: string): string | null {
  const m = text.match(RE_CNPJ)
  return m ? m[0] : null
}

function parseDescription(text: string): string | null {
  // Try to extract merchant name from common patterns
  const patterns = [
    /(?:estabelecimento|loja|comercio|merchant)[:\s]+([^\n]+)/i,
    /(?:pagamento\s+(?:para|a)[:\s]+)([^\n\d][^\n]{2,40})/i,
    /(?:^|\n)([A-Z][A-Z\s&.]{3,40})(?:\s*\n|$)/m, // ALL CAPS merchant names
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return m[1].trim()
  }
  // Fallback: first non-empty line that looks like a name (3+ chars, not pure numbers)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !/^\d/.test(l))
  return lines[0] ?? null
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parse(text: string): ParsedExpense {
  const amount = parseAmount(text)
  const date = parseDate(text)
  const pix_e2e_id = parsePixE2E(text)
  const cnpj = parseCNPJ(text)
  const description = parseDescription(text)

  // Confidence score
  let points = 0
  if (amount !== null) points += 50
  if (date !== null) points += 30
  if (pix_e2e_id !== null || cnpj !== null) points += 20

  return {
    amount,
    date,
    pix_e2e_id,
    cnpj,
    description,
    confidence: points / 100,
  }
}
