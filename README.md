
AI Agent – Node.js + n8n 

A modular backend AI agent integrated with n8n workflows and exposed through a REST API, including a lightweight web-based chat interface.

🔗 Live Demo: https://ai-agent-n8n-zefs.onrender.com
📄 Technical Documentation: https://sfturio.github.io/ai-agent-n8n/
Overview

Structured backend application that connects a chat interface to an n8n automation workflow acting as the AI processing layer.

Designed with production-oriented practices and clean architecture principles.
Architecture

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
API
POST /agent

Request

{
“message”: “Hello AI”
}

Success (200)

{
“ok”: true,
“data”: “AI response”
}

Errors

    400 → Invalid input

    500 → Internal server error

Tech Stack

Backend

    Node.js

    Express

    JavaScript (ESModules)

Automation

    n8n (Webhook workflows)

Frontend

    HTML

    CSS

    Vanilla JavaScript

Deployment

    Render

Version Control

    Git

    GitHub

Project Structure

server.js
routes/
agent.routes.js
controllers/
agent.controller.js
services/
agent.service.js
Environment Variables

PORT=3000
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/agent
Features

    Layered architecture (Route → Controller → Service)

    Async webhook integration

    Structured JSON responses

    Proper HTTP status handling

    Production deployment

Demonstrates

    Clean backend architecture

    External system integration

    Production debugging

    Scalable project structure

    REST API best practices

