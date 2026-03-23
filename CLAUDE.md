# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Finco — Expense Tracker Inteligente

---

## 🎯 Visão Geral

**Finco** é um sistema pessoal de rastreamento de despesas com IA integrada.
O objetivo central é ter **zero fricção no registro** e **inteligência na análise**.

O usuário principal é um desenvolvedor brasileiro (iOS + cartão de crédito como meio principal de pagamento) que quer capturar gastos automaticamente via print de tela no iPhone, sem precisar abrir um app ou digitar qualquer coisa.

---

## 🏗️ Arquitetura

```
iPhone (Atalho iOS)
       │  Camada 1: allowlist de apps (sem rede)
       │  Camada 1.5: Scriptable — OCR + keywords (sem rede)
       │  OCR completo → envia só TEXTO via HTTP POST
       ▼
Backend API — Hono.js no Cloudflare Workers
       │  responde 202 Accepted imediatamente
       │
       ├── Cloudflare Queues (fila de processamento assíncrono)
       │         │
       │         ▼
       │    Parser regex (custo zero)
       │    valor, data, CNPJ, Pix E2E
       │         │
       │    confidence >= 0.8? ──sim──► grava direto
       │         │ não
       │         ▼
       │    Claude Text (fallback, ~R$0,01)
       │    recebe texto bruto, não imagem
       │         │
       │         ▼
       │    Engine de deduplicação
       │         │
       ▼         ▼
   Supabase (PostgreSQL)
       │
       ▼
Web App — React PWA (mobile-first)
Dashboard + Gestão + IA Chat
```

### Stack definida
| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | React PWA | Web responsivo, instalável no iPhone |
| Backend | Hono.js + Cloudflare Workers | Gratuito, sem servidor, baixa latência |
| Fila | Cloudflare Queues | Processamento assíncrono de uploads |
| Banco | Supabase (PostgreSQL) | Gratuito, SDK JS, auth pronta |
| IA | Claude API (Text) | Fallback de extração, categorização, análise |
| OCR | VNRecognizeTextRequest (iOS nativo) | Extração de texto on-device, custo zero |
| Automação iOS | Atalhos (Shortcuts) | Nativo, zero atrito, sem App Store |

---

## 🛠️ Comandos de Desenvolvimento

### Frontend (`frontend/`)
```bash
npm run dev       # dev server (Vite)
npm run build     # build de produção
npm run lint      # ESLint
npm test          # testes (Vitest)
```

### Backend (`backend/`)
```bash
npm run dev       # wrangler dev (local Worker)
npm run deploy    # wrangler deploy
npm run lint      # ESLint
npm test          # testes
```

### Supabase (`supabase/`)
```bash
supabase db push          # aplica migrations
supabase gen types typescript --local > ../backend/src/types/supabase.ts
```

> Estes comandos serão válidos após o scaffold inicial dos projetos.

---

## 📥 Fontes de Entrada de Dados

### 1. Print de Tela via Atalho iOS ⭐ principal
- Usuário tira print → Atalho iOS filtra por origem e envia ao backend via HTTP POST
- Filtro duplo antes da extração completa (ver seção de Filtragem abaixo)
- Funciona para: iFood, comprovantes Pix, qualquer app financeiro

### 2. Print do QR Code de NF-e
- Claude Vision lê o QR Code da imagem
- Backend consulta a URL da SEFAZ extraída do QR Code
- Retorna XML completo com todos os itens, valores, CNPJ
- **Vantagem**: dados oficiais, 100% precisos, detalhamento por item automático
- Cada estado tem URL própria da SEFAZ, mas formato NF-e 4.0 é nacional

### 3. Import de CSV da fatura do cartão
- Suporte a múltiplos bancos (mapeamento flexível de colunas)
- IA normaliza o formato independente do banco
- Fonte "vencedora" em caso de conflito de deduplicação

### 4. Entrada manual
- Para gastos em dinheiro, Pix avulso, gorjeta
- IA sugere categoria baseada na descrição digitada

### 5. Foto de nota fiscal (Fase 4)
- OCR visual quando não há QR Code disponível
- Menor prioridade — coberto em grande parte pelo fluxo de QR Code

---

## 📱 Automação iOS — Fluxo Detalhado

### Fluxo completo: print → banco de dados

1. Usuário tira print da tela
2. Atalho iOS dispara automaticamente (gatilho: nova foto)
3. **Camada 1** — filtro por allowlist de apps (sem rede, sem custo)
4. **Camada 1.5** — Scriptable faz OCR nativo + checa keywords financeiras (sem rede, sem custo)
5. Se passar: Scriptable extrai texto completo da imagem via `Vision.recognizeText()`
6. Atalho envia **somente o texto** ao backend via HTTP POST — nunca a imagem
7. Backend responde `202 Accepted` imediatamente (sem bloquear)
8. Job entra na Cloudflare Queue com o texto bruto
9. **Parser regex** tenta extrair valor, data, CNPJ, Pix E2E (custo zero)
10. Se `confidence >= 0.8`: grava direto no Supabase
11. Se `confidence < 0.8`: **Claude Text** recebe o texto bruto e extrai os dados (~R$0,01)
12. Engine de deduplicação roda (score fuzzy / E2E ID Pix)
13. Registro gravado em `expenses` + `raw_text_data` (texto bruto para auditoria)
14. Descarte em qualquer camada é silencioso — não notifica o usuário

### Camada 1 — Filtro no Atalho iOS (heurístico)

Roda no dispositivo antes de qualquer processamento. Filtra por app de origem do print.

**Allowlist sugerida** (apps cujos prints têm alta probabilidade de serem comprovantes):
- iFood, Rappi, Uber Eats
- Nubank, Itaú, Bradesco, Inter, C6, PicPay
- Mercado Pago, PagSeguro, Stone
- Qualquer app com "banco", "pay", "pix" no nome

**Comportamento**: print de app fora da lista → Atalho ignora silenciosamente, zero bytes enviados.

> A allowlist deve ser configurável pelo usuário no próprio Atalho iOS (variável de texto editável).

### Camada 1.5 — Scriptable (OCR + keywords on-device)

Script JavaScript rodando no [Scriptable](https://scriptable.app) — chamado como ação dentro do Atalho iOS. Usa `Vision.recognizeText()` para OCR nativo (mesmo motor do iOS Live Text) e checa keywords financeiras antes de enviar qualquer dado.

```javascript
// Finco — Camada 1.5 (Scriptable)
const img = args.images[0]
if (!img) { Script.setShortcutOutput(false); Script.complete() }

const lines = await Vision.recognizeText(img)
const text  = lines.join(" ").toLowerCase()

const keywords = ["r$", "pix", "cpf", "cnpj", "total", "valor",
                  "pagamento", "recibo", "comprovante", "troco",
                  "subtotal", "taxa", "fatura"]

const found = keywords.some(k => text.includes(k))

// Se encontrou keywords: devolve o texto completo pro Atalho
// Se não encontrou: devolve false → Atalho descarta silenciosamente
Script.setShortcutOutput(found ? lines.join("\n") : false)
Script.complete()
```

**O Atalho usa o retorno assim:**
- `false` → para silenciosamente, zero bytes enviados
- texto → envia o texto (não a imagem) ao endpoint `/upload`

### Parser regex + fallback Claude Text (backend)

O backend nunca recebe imagem — só texto. O parser tenta extração determinística primeiro.

**Lógica de confiança** (reutiliza a mesma escala da deduplicação):

| Campo extraído | Pontos |
|---|---|
| Valor monetário (`R$\s*[\d.,]+`) | 50 pts |
| Data (`dd/mm/aaaa` ou variantes) | 30 pts |
| CNPJ ou Pix E2E ID | 20 pts |

- `confidence >= 0.8` → grava direto, `extraction_source: 'regex'`
- `confidence < 0.8` → envia texto ao Claude Text, `extraction_source: 'claude_text'`

**Prompt Claude Text** (recebe texto puro, não imagem):
```
Extraia os dados do comprovante abaixo e responda em JSON:
{ "amount": number, "date": "YYYY-MM-DD", "description": string,
  "category": string, "pix_e2e_id": string|null, "cnpj": string|null }

Comprovante:
{texto_bruto}
```

### Considerações de UX da automação

- O usuário **nunca** precisa interagir com o sistema para registrar um gasto via print
- **Nenhuma imagem trafega pela rede** — apenas texto extraído on-device
- Feedback de sucesso ocorre via notificação iOS após processamento completo
- Erros de rede ou falha do parser não devem gerar notificação alarmante — silêncio ou retry
- O `202 Accepted` imediato garante que o Atalho não trava aguardando resposta

---

## 🔄 Deduplicação

### Algoritmo de score
| Critério | Pontos |
|---|---|
| Valor idêntico | 50 pts |
| Data dentro de ±2 dias | 30 pts |
| Descrição similar (fuzzy) | 20 pts |
| E2E ID do Pix idêntico | 100 pts (match absoluto) |

### Regras de comportamento
- **Score > 90%** → mescla automaticamente, mantém dados do CSV (fonte oficial)
- **Score 60–90%** → alerta visual, usuário decide
- **Score < 60%** → importa normalmente como novo registro
- **E2E ID do Pix** → deduplicação perfeita, sempre mescla

### Fonte vencedora em conflito
CSV do cartão vence sobre entrada manual e screenshot.
Ordem de prioridade: `csv > nfe_qrcode > screenshot > manual`

### Janela de tolerância de data
±2 dias (cobre D+1 do cartão e finais de semana)

---

## 💳 Regras de Negócio

### Parcelamento
- Cada parcela é registrada **no mês em que cai** (visão de fluxo de caixa)
- Sistema identifica padrão "X/Y" no CSV (ex: "2/6") e agrupa visualmente
- Campo `installment_of` vincula parcelas à compra original
- Dashboard pode exibir visão de "compromissos futuros" (opcional, Fase 3)

### Categorização automática
- Regras fixas por palavra-chave: "iFood" → Alimentação, "Uber" → Transporte
- Regras persistidas na tabela `auto_rules`
- IA sugere categoria para entradas novas sem regra
- Usuário pode criar/editar regras

---

## 🗄️ Modelo de Dados

```sql
-- Despesas
expenses (
  id              UUID PRIMARY KEY,
  description     TEXT,           -- nome do estabelecimento
  amount          DECIMAL(10,2),  -- valor
  date            DATE,           -- data da compra
  category        TEXT,           -- Alimentação, Transporte...
  subcategory     TEXT,           -- iFood, Uber, Mercado...
  source          TEXT,           -- 'manual' | 'csv' | 'screenshot' | 'nfe_qrcode' | 'receipt'
  source_file     TEXT,           -- referência ao arquivo original
  installment_of  UUID,           -- FK para compra pai (se for parcela)
  installment_num INT,            -- número da parcela (ex: 2)
  installment_total INT,          -- total de parcelas (ex: 6)
  pix_e2e_id      TEXT,           -- E2E ID único do Pix (para deduplicação perfeita)
  raw_text_data   TEXT,           -- texto bruto extraído pelo OCR on-device
  extraction_source TEXT,         -- 'regex' | 'claude_text'
  raw_ai_data     JSONB,          -- resposta do Claude Text (quando usado no fallback)
  duplicate_score DECIMAL(5,2),   -- score da deduplicação
  merged_with     UUID,           -- FK do registro mesclado
  created_at      TIMESTAMPTZ DEFAULT now()
)

-- Itens de nota fiscal (sub-registros de uma expense)
expense_items (
  id          UUID PRIMARY KEY,
  expense_id  UUID REFERENCES expenses(id),
  description TEXT,           -- nome do item
  quantity    DECIMAL(10,3),
  unit_price  DECIMAL(10,2),
  amount      DECIMAL(10,2),
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Categorias
categories (
  id    UUID PRIMARY KEY,
  name  TEXT,
  color TEXT,
  icon  TEXT
)

-- Regras de auto-categorização
auto_rules (
  id          UUID PRIMARY KEY,
  keyword     TEXT,           -- ex: "iFood", "Posto Shell"
  category    TEXT,
  subcategory TEXT
)

-- Log de uploads descartados (Camadas 1 e 1.5 descartam on-device sem log;
-- este registro é apenas para textos que chegaram ao backend mas tiveram
-- confiança insuficiente mesmo após Claude Text)
discarded_uploads (
  id          UUID PRIMARY KEY,
  raw_text    TEXT,           -- texto bruto que chegou ao backend
  reason      TEXT,           -- 'low_confidence' | 'parse_failed'
  created_at  TIMESTAMPTZ DEFAULT now()
)
```

---

## 📊 Dashboard — Módulos

1. **Visão mensal** — gastos por categoria (pizza + barras)
2. **Evolução temporal** — linha por mês, comparativo
3. **Top estabelecimentos** — onde mais gasta
4. **Compromissos futuros** — parcelas vindouras
5. **IA Assistente** — análise de padrões, alertas, sugestões de economia

---

## 📦 Fases de Desenvolvimento

### ✅ Fase 1 — Core (iniciar aqui)
- [ ] Supabase configurado com schema completo (incluindo `discarded_uploads`)
- [ ] Backend Hono básico (endpoint de health check + upload)
- [ ] Web app React com entrada manual
- [ ] Gerenciamento de categorias e regras
- [ ] Dashboard com gráficos (Recharts)
- [ ] IA de análise no dashboard (Claude Text)

### 🔜 Fase 2 — Automação iOS
- [ ] Script Scriptable com OCR + keywords + extração de texto completo
- [ ] Atalho iOS exportável (.shortcut) com allowlist configurável + chamada ao Scriptable
- [ ] Endpoint `/upload` recebendo texto (não imagem), com resposta 202 imediata
- [ ] Fila com Cloudflare Queues
- [ ] `services/parser.ts` — regex para valor, data, CNPJ, Pix E2E + score de confiança
- [ ] `services/extractor.ts` — fallback Claude Text com prompt de extração estruturada
- [ ] Log silencioso de textos não parseados (`discarded_uploads`)
- [ ] Processamento de Pix (extração de E2E ID via regex)
- [ ] Notificação iOS após processamento bem-sucedido

### 🔜 Fase 3 — Import CSV
- [ ] Upload de fatura CSV
- [ ] Mapeador flexível de colunas (multi-banco)
- [ ] Engine de deduplicação com score
- [ ] Agrupamento visual de parcelas
- [ ] UI de revisão de duplicatas (score 60–90%)

### 🔜 Fase 4 — NF-e QR Code
- [ ] Claude Vision lê QR Code do print
- [ ] Backend consulta URL da SEFAZ
- [ ] Parser do XML da NF-e 4.0
- [ ] Criação de expense_items por item da nota
- [ ] Vinculação automática com transação do CSV (por valor + data)

---

## 🎨 Princípios de UX (não negociáveis)

> **"Experiência do usuário é prioridade máxima"**

- **Zero fricção no registro** — o usuário não deve precisar abrir o app para registrar um gasto
- **Feedback imediato** — confirmação visual/notificação sempre que um print for processado com sucesso
- **Silêncio nos descartes** — prints rejeitados pela triagem não geram notificação ao usuário
- **Transparência no processamento** — se a IA demorar, mostrar progresso, nunca tela em branco
- **Erros em linguagem humana** — sem códigos de erro técnicos expostos ao usuário
- **Mobile-first** — design começa pelo iPhone, não pelo desktop
- **Ações destrutivas com confirmação** — mas sem excesso de confirmações para ações simples
- **Revisão fácil** — toda categorização sugerida pela IA deve ser fácil de corrigir com 1 toque

---

## 📁 Estrutura de Pastas (proposta)

```
finco/
├── CLAUDE.md                  ← este arquivo
├── ARCHITECTURE.md            ← diagramas detalhados
├── frontend/                  ← React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── backend/                   ← Hono + Cloudflare Workers
│   ├── src/
│   │   ├── routes/
│   │   ├── queues/
│   │   ├── services/
│   │   │   ├── ai.ts          ← Claude Text: fallback de extração
│   │   │   ├── parser.ts      ← regex + score de confiança
│   │   │   ├── extractor.ts   ← orquestra parser → fallback Claude Text
│   │   │   ├── nfe.ts         ← parser NF-e / SEFAZ
│   │   │   └── dedup.ts       ← engine de deduplicação
│   │   └── index.ts
│   └── wrangler.toml
├── supabase/
│   └── migrations/            ← SQL de schema
└── docs/
    ├── ios-shortcut.md        ← instruções do Atalho iOS + allowlist
    └── csv-formats.md         ← formatos de CSV por banco
```

---

## 🔑 Variáveis de Ambiente necessárias

```env
# Backend (Cloudflare Workers / wrangler.toml secrets)
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=        ← URL do Cloudflare Worker
```

---

## 📝 Notas e Decisões importantes

- **Sem multi-usuário no MVP** — sistema pessoal, um único usuário
- **Sem orçamento mensal por categoria no MVP** — pode ser Fase 5
- **Pix começa apenas com print de tela** — integração Open Finance é fora de escopo
- **QR Code NF-e tem prioridade sobre OCR visual** — dados da SEFAZ são mais confiáveis
- **Múltiplos cartões/bancos suportados** — mapeador de CSV flexível resolve isso
- **localStorage não é usado** — Supabase desde o início para acesso multi-device
- **Claude Vision não é usado** — substituído por OCR nativo iOS (Scriptable) + Claude Text no fallback
- **Nenhuma imagem trafega pela rede** — o backend sempre recebe texto, nunca a imagem original
- **Filtragem em três camadas on-device** — Camada 1 (allowlist), Camada 1.5 (Scriptable OCR + keywords); ambas sem rede, custo zero
- **Extração híbrida no backend** — regex primeiro (`confidence >= 0.8`), Claude Text apenas no fallback (~R$0,01 por print difícil)
- **202 Accepted obrigatório** — o endpoint `/upload` nunca bloqueia aguardando processamento
- **`raw_text_data` sempre gravado** — texto bruto preservado para reprocessamento e auditoria
- **`extraction_source` rastreado** — permite medir taxa de fallback e calibrar o parser ao longo do tempo
