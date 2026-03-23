# Finco — Expense Tracker Inteligente
> Arquivo de contexto do projeto para o Claude Code.
> Leia este arquivo integralmente antes de qualquer tarefa.

---

## 🎯 Visão Geral

**Finco** é um sistema pessoal de rastreamento de despesas com IA integrada.
O objetivo central é ter **zero fricção no registro** e **inteligência na análise**.

O usuário principal é um desenvolvedor brasileiro (iOS + cartão de crédito como meio principal de pagamento) que quer capturar gastos automaticamente via print de tela no iPhone, sem precisar abrir um app ou digitar qualquer coisa.

---

## 🏗️ Arquitetura

```
iPhone (Atalho iOS)
       │  print → upload automático via HTTP POST
       ▼
Backend API — Hono.js no Cloudflare Workers
       │
       ├── Cloudflare Queues (fila de processamento assíncrono)
       │         │
       │         ▼
       │    Claude API (Vision + Text)
       │    extrai: valor, local, data, itens, categoria
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
| IA | Claude API (Vision + Text) | OCR, categorização, análise |
| Automação iOS | Atalhos (Shortcuts) | Nativo, zero atrito, sem App Store |

---

## 📥 Fontes de Entrada de Dados

### 1. Print de Tela via Atalho iOS ⭐ principal
- Usuário tira print → Atalho iOS envia automaticamente pro backend via HTTP POST
- Claude Vision processa a imagem e extrai os dados
- Funciona para: iFood, comprovantes Pix, qualquer app

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
  raw_ai_data     JSONB,          -- resposta completa da IA
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
- [ ] Supabase configurado com schema completo
- [ ] Backend Hono básico (endpoint de health check + upload)
- [ ] Web app React com entrada manual
- [ ] Gerenciamento de categorias e regras
- [ ] Dashboard com gráficos (Recharts)
- [ ] IA de análise no dashboard (Claude Text)

### 🔜 Fase 2 — Automação iOS
- [ ] Endpoint de processamento de screenshot (Claude Vision)
- [ ] Fila com Cloudflare Queues
- [ ] Processamento de comprovante Pix (extração de E2E ID)
- [ ] Atalho iOS exportável (arquivo .shortcut com URL configurável)
- [ ] Notificação/feedback quando print for processado

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
- **Feedback imediato** — confirmação visual/notificação sempre que um print for recebido
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
│   │   │   ├── ai.ts          ← Claude Vision + Text
│   │   │   ├── nfe.ts         ← parser NF-e / SEFAZ
│   │   │   └── dedup.ts       ← engine de deduplicação
│   │   └── index.ts
│   └── wrangler.toml
├── supabase/
│   └── migrations/            ← SQL de schema
└── docs/
    ├── ios-shortcut.md        ← instruções do Atalho iOS
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
