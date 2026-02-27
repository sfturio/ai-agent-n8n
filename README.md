
# AI Agent – Node.js + n8n

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-Framework-lightgrey)
![n8n](https://img.shields.io/badge/n8n-Workflow-orange)
![Deploy](https://img.shields.io/badge/Deploy-Render-blue)
![License](https://img.shields.io/badge/Status-Production-success)

A modular backend AI agent integrated with n8n workflows and exposed through a REST API, including a lightweight web-based chat interface.

🔗 **Live Demo:** https://ai-agent-n8n-zefs.onrender.com  
📄 **Technical Documentation:** https://sfturio.github.io/ai-agent-n8n/

---

## Overview

Structured backend application connecting a web chat interface to an n8n automation workflow acting as the AI processing layer.

Built following clean architecture principles and production-oriented practices.

---

## Architecture


Client (Chat UI)
↓
POST /agent
↓
Route
↓
Controller
↓
Service
↓
n8n Webhook
↓
JSON Response


---

## API

### POST /agent

**Request**

```
**Request**

```json
{
  "message": "Hello AI"
}
```
Success (200)
```
{
  "ok": true,
  "data": "AI response"
}
```

Errors:

- 400 → Invalid input
- 500 → Internal server error

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
## Project Structure
```
server.js
routes/
  agent.routes.js
controllers/
  agent.controller.js
services/
  agent.service.js
```
## Enviroment Variables
```
PORT=3000
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/agent
```
## Features
- Layered architecture (Route → Controller → Service)
- Async webhook integration
- Structured JSON responses
- Proper HTTP status handling
- Production deployment
## Demonstrates
- Clean backend architecture
- External system integration
- Production debugging
- Scalable project structure
- REST API best practices
