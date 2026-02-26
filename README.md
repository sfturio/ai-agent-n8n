# AI Agent Backend with n8n Integration

Backend service built with Node.js and Express that integrates with n8n workflows using webhooks to process AI agent requests.

## Features
- Express backend API
- Modular architecture (routes, controllers, services)
- n8n webhook integration
- Environment variable configuration
- Scalable backend structure

## Tech Stack
- Node.js
- Express.js
- n8n
- dotenv

## Project Structure
src/
  server.js
  routes/
  controllers/
  services/

## Installation
Clone the repository:
git clone https://github.com/sfturio/ai-agent-n8n.git
Install dependencies:
npm install
Create .env file:

N8N_WEBHOOK_URL=your_webhook_url
PORT=3000

Start the server:
npm start

## API Endpoint
POST /api/agent
Body:
{
  "message": "Hello"
}

## Author

Backend Developer focused on Node.js and AI integration.
