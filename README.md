# AI Agent

Assistente técnico para times de desenvolvimento analisarem logs, código e contexto operacional com suporte de IA.

- Demo: https://ai-agent-n8n-zefs.onrender.com
- Documentação: https://sfturio.github.io/ai-agent-n8n/

## O que este projeto resolve

- Reduz tempo de diagnóstico técnico em chats de suporte interno.
- Centraliza uma interface simples para análise de logs e perguntas sobre código.
- Mantém histórico de interações para auditoria e melhoria contínua.

## Stack

- Backend: Node.js + Express
- Orquestração IA: n8n Webhook
- Persistência: Supabase Postgres
- Frontend: HTML + CSS + JavaScript
- Deploy: Render

## Arquitetura

```text
UI (public/) -> POST /api/agent -> controller -> service -> n8n webhook
                                    \-> saveInteractionLog (Supabase)
```

## Endpoints

### `POST /api/agent`

Envia uma mensagem para o agente.

Request:

```json
{
  "message": "Explique este erro de timeout"
}
```

Respostas:

- `200 text/plain`: resposta do agente (inclui fallback amigável quando n8n está indisponível).
- `400 application/json`: payload inválido.
- `500 application/json`: erro interno não previsto.

### `GET /health`

Retorna status do serviço:

```json
{ "ok": true }
```

## Variáveis de ambiente

```env
PORT=3000
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/agent
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_TABLE=agent_messages
```

## Setup local

1. Instale dependências:

```bash
npm install
```

2. Configure `.env` (pode copiar de `.env.example`).
3. Rode localmente:

```bash
npm run dev
```

4. Acesse: `http://localhost:3000`

## Persistência no Supabase

Crie a tabela (uma vez) no SQL Editor:

```sql
create table if not exists public.agent_messages (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  message text,
  response_body jsonb,
  ok boolean not null default false,
  error_message text
);
```

Se `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` não estiverem configurados, o app continua funcionando sem persistência.

## Estrutura de pastas

```text
src/
  server.js
  routes/
  controllers/
  services/
public/
  index.html
  style.css
  script.js
docs/
  index.html
  pt-br.html
```

## Principais decisões técnicas

- Controller retorna texto puro para UX de chat simples.
- Parsing de resposta do n8n é tolerante a formatos diferentes.
- Logs de interação não derrubam o fluxo principal do agente.
- Fallback de resposta mantém disponibilidade da interface quando o n8n oscila.

## Changelog resumido

- `v1.3.0`: endpoint de métricas reais (`/api/agent/metrics`) integrado ao dashboard.
- `v1.2.1`: retry com backoff para `429` do n8n + rate limit por IP no endpoint do agente.
- `v1.2.0`: documentação técnica reformulada e interface reorganizada por contexto.
- `v1.1.0`: persistência migrada para Supabase Postgres.
