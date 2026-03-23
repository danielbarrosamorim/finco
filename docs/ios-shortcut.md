# Finco — Automação iOS

Guia completo para configurar o Atalho iOS + Scriptable que captura gastos automaticamente via print de tela.

---

## Visão geral do fluxo

```
Print de tela
  └── Atalho iOS (Camada 1: verifica app de origem)
        └── Scriptable (Camada 1.5: OCR + palavras-chave)
              └── POST /upload  { text }
                    └── Backend processa de forma assíncrona
```

Nenhuma imagem é enviada — apenas o texto extraído on-device.

---

## Pré-requisitos

- iPhone com iOS 16+
- App **Scriptable** (grátis na App Store)
- App **Atalhos** (nativo do iOS)
- URL do backend Finco (ex: `https://finco-api.seu-usuario.workers.dev`)
- API Key do Finco

---

## Passo 1 — Instalar o script no Scriptable

1. Abra o **Scriptable**
2. Toque em **+** para criar novo script
3. Nomeie como `Finco OCR`
4. Cole o código abaixo:

```javascript
// Finco — Camada 1.5 (Scriptable OCR + keywords)
// Recebe imagem do Atalho iOS, faz OCR e filtra por palavras-chave financeiras.
// Retorna o texto completo se encontrar keywords, ou false para descartar.

const img = args.images[0]
if (!img) {
  Script.setShortcutOutput(false)
  Script.complete()
}

const lines = await Vision.recognizeText(img)
const text = lines.join(" ").toLowerCase()

const keywords = [
  "r$", "pix", "cpf", "cnpj", "total", "valor",
  "pagamento", "recibo", "comprovante", "troco",
  "subtotal", "taxa", "fatura", "débito", "crédito",
  "transferência", "ted", "doc", "boleto"
]

const found = keywords.some(k => text.includes(k))

// Devolve texto completo se achou keywords, ou false para o Atalho descartar
Script.setShortcutOutput(found ? lines.join("\n") : false)
Script.complete()
```

5. Toque em **Done** (ícone de play opcional para testar)

---

## Passo 2 — Criar o Atalho iOS

1. Abra o app **Atalhos** → toque em **+**
2. Nomeie como `Finco — Capturar Gasto`
3. Configure o gatilho: **Automação** → **Print de tela** (ou use manualmente)
4. Adicione as seguintes ações **na ordem**:

### Ação 1 — Filtro por app (Camada 1)

Adicione uma ação **"Se"** com a condição:
- **App atual** (ou "App do último print") **está em** [lista de apps]

Lista de apps financeiros:
```
iFood, Rappi, Uber Eats, Nubank, Itaú, Bradesco, Inter, C6 Bank,
PicPay, Mercado Pago, PagSeguro, Stone, Caixa, Santander, BTG
```

> Se o app **não estiver** na lista → adicione ação **"Parar e sair"** no bloco "Caso contrário".

### Ação 2 — Scriptable (Camada 1.5)

- Adicione ação **"Executar Script Scriptable"**
- Script: `Finco OCR`
- Input: **Imagem do print** (variável da ação anterior ou "Último print")

### Ação 3 — Verificar resultado do OCR

Adicione outra ação **"Se"**:
- **Resultado do Scriptable** **é** `false`
- Bloco "Caso contrário" → **"Parar e sair"**

### Ação 4 — Enviar ao backend

Adicione ação **"Obter conteúdo de URL"**:
- URL: `https://seu-worker.workers.dev/upload`
- Método: **POST**
- Cabeçalhos:
  - `Authorization`: `Bearer SUA_API_KEY`
  - `Content-Type`: `application/json`
- Corpo (JSON):
  ```json
  {
    "text": "[Resultado do Scriptable]",
    "source_app": "[App atual]"
  }
  ```

### Ação 5 — Notificação de sucesso (opcional)

Adicione ação **"Mostrar notificação"**:
- Título: `Finco`
- Corpo: `Gasto capturado ✓`

> Só mostre notificação se o status HTTP for 202. Descartes são silenciosos.

---

## Allowlist completa sugerida

Edite a variável de texto no Atalho para incluir/remover apps:

```
iFood
Rappi
Uber Eats
Uber
99
Nubank
Itaú
Bradesco
Inter
C6 Bank
PicPay
Mercado Pago
PagSeguro
Stone
Caixa Tem
Caixa
Santander
BTG Pactual
XP
Rico
Clear
Sicredi
Sicoob
Banco do Brasil
```

---

## Configuração das variáveis no Atalho

Crie duas variáveis de texto no início do Atalho para facilitar edição:

| Variável | Valor |
|---|---|
| `FINCO_URL` | `https://finco-api.seu-usuario.workers.dev` |
| `FINCO_API_KEY` | sua API key |

Referencie-as nas ações de URL e cabeçalho.

---

## Testando manualmente

1. Tire um print de um comprovante Pix ou recibo do iFood
2. Abra o **Atalhos** → toque em `Finco — Capturar Gasto`
3. Selecione o print quando solicitado
4. Verifique no Supabase (tabela `expenses`) se o registro apareceu

Ou via curl:
```bash
curl -X POST https://seu-worker.workers.dev/upload \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Pix recebido\nR$ 45,90\niFood Restaurante\n23/03/2026\nE12345678ABC123456789012345678901234"}'
```

---

## Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| Atalho não dispara | Automação desativada | Atalhos → Automação → verificar se está ativa |
| Scriptable retorna false | Print sem keywords financeiras | Normal — descarte silencioso |
| Backend retorna 401 | API Key errada | Verificar variável `FINCO_API_KEY` no Atalho |
| Registro não aparece | Claude Key ausente + baixa confiança | Adicionar `ANTHROPIC_API_KEY` ao `.dev.vars` |
| Duplicata criada | Dedup score < 90 | Esperado para prints sem Pix E2E ID |
