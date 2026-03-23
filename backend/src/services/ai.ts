import Anthropic from '@anthropic-ai/sdk'

interface CategorySummary {
  name: string
  amount: number
}

interface AnalysisInput {
  month: string
  total: number
  previousTotal: number
  count: number
  byCategory: CategorySummary[]
  topMerchants: { name: string; amount: number }[]
}

export async function analyzeExpenses(
  apiKey: string,
  input: AnalysisInput
): Promise<string> {
  const client = new Anthropic({ apiKey })

  const categoryLines = input.byCategory
    .sort((a, b) => b.amount - a.amount)
    .map((c) => `- ${c.name}: R$ ${c.amount.toFixed(2)}`)
    .join('\n')

  const merchantLines = input.topMerchants
    .map((m) => `- ${m.name}: R$ ${m.amount.toFixed(2)}`)
    .join('\n')

  const diff = input.total - input.previousTotal
  const diffPct = input.previousTotal > 0
    ? ((diff / input.previousTotal) * 100).toFixed(1)
    : 'N/A'

  const prompt = `Analise os gastos do mês ${input.month}:

Total: R$ ${input.total.toFixed(2)} (${input.count} transações)
Mês anterior: R$ ${input.previousTotal.toFixed(2)} (${diff >= 0 ? '+' : ''}${diffPct}%)

Por categoria:
${categoryLines}

Top estabelecimentos:
${merchantLines}

Responda em português, de forma direta e amigável. Máximo 200 palavras. Inclua:
1. Resumo geral (1-2 frases)
2. Destaques (categorias que merecem atenção)
3. Uma sugestão concreta de economia`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
    system: 'Você é um assistente financeiro pessoal. Analise gastos e dê conselhos práticos.',
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : 'Não foi possível gerar a análise.'
}
