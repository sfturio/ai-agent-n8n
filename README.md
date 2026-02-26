# AI Agent – Node.js + n8n

A modular backend AI agent integrated with n8n workflows and exposed through a REST API, with a simple web-based chat interface for testing.

---

## Overview

This project implements a clean backend architecture that connects a chat interface to an automation workflow (n8n) acting as the AI processing layer.

The goal was to build and deploy a real backend application, handle production issues, and structure the project in a scalable way.

---

## Architecture

Client (Chat UI)  
→ POST /agent  
→ Route  
→ Controller  
→ Service Layer  
→ n8n Webhook  
→ JSON Response  

---

## Tech Stack

### Backend
- Node.js
- Express
- JavaScript (ESModules)

### Automation
- n8n (Webhook-based workflow engine)

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Deployment
- Render

### Version Control
- Git
- GitHub

---

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

---

## Features

- REST API endpoint (`POST /agent`)
- Layered architecture (Route → Controller → Service)
- Async webhook communication
- JSON-based responses
- Proper HTTP status codes (200, 400, 500)
- Simple real-time chat interface
- Production deployment

---

## Key Concepts Applied

- Separation of concerns
- Modular routing
- Async/await best practices
- Input validation
- Error handling strategies
- Clean project structure

---

## Issues Resolved During Development

- Fixed 500 Internal Server Errors caused by unhandled async logic
- Standardized Express Router configuration
- Corrected `package.json` start script and Node engine setup for production
- Restructured Git repository after remote misconfiguration
- Improved frontend handling for failed API responses

---

## What This Project Demonstrates

- Building a structured backend application
- Integrating external automation systems (n8n)
- Debugging production-level issues
- Deploying a live Node.js application
- Managing a clean and organized project with Git
