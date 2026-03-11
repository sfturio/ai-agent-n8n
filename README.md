# AI Agent - Node.js + n8n

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-Framework-lightgrey)
![n8n](https://img.shields.io/badge/n8n-Workflow-orange)
![Deploy](https://img.shields.io/badge/Deploy-Render-blue)
![Status](https://img.shields.io/badge/Status-Production-success)

A modular backend AI agent integrated with n8n workflows and exposed through a REST API, including a lightweight web-based chat interface.

- **Live Demo:** https://ai-agent-n8n-zefs.onrender.com
- **Technical Documentation:** https://sfturio.github.io/ai-agent-n8n/

---

## Overview

Structured backend application connecting a web chat interface to an n8n automation workflow acting as the AI processing layer.

---

## Architecture

Client (Chat UI) -> POST /agent -> Route -> Controller -> Service -> n8n Webhook -> JSON Response

---

## API

### POST /agent

Request:

```json
{
  "message": "Hello AI"
}
```

Success (200):

```json
{
  "ok": true,
  "data": "AI response"
}
```

Errors:
- 400: Invalid input
- 500: Internal server error

---

## Tech Stack

**Backend**
- Node.js
- Express
- JavaScript (ESModules)

**Automation**
- n8n (Webhook workflows)

**Frontend**
- HTML
- CSS
- Vanilla JavaScript

**Deployment**
- Render

**Version Control**
- Git
- GitHub

---

## Project Structure

```text
server.js
routes/
  agent.routes.js
controllers/
  agent.controller.js
services/
  agent.service.js
  supabase-log.service.js
```

---

## Environment Variables

```env
PORT=3000
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/agent
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_TABLE=agent_messages
```

---

## Supabase Persistence

This API can persist each agent interaction in Supabase Postgres, so data is not lost when Render restarts or clears ephemeral storage.

### Table SQL (run once in Supabase SQL Editor)

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

After this setup, every `POST /api/agent` call is logged with request/response status.
