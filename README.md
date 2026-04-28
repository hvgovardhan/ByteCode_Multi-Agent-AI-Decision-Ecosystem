# 🏛️ AI Parliament — Multi-Agent Decision Ecosystem

Specialized AI agents debate your question from every angle before a moderator delivers the final verdict.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Visualization | D3.js |
| Backend | FastAPI + Python |
| Agent Orchestration | LangGraph + LangChain |
| LLM Gateway | LiteLLM |
| Task Queue | Celery + Redis |
| Database | MongoDB (Beanie ODM) |
| Streaming | Redis pub/sub → SSE |

## Quick Start

### 1. Start infrastructure
```bash
docker-compose up -d
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Add your API keys to .env

pip install -r requirements.txt

# Terminal 1 — FastAPI server
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery worker
celery -A celery_worker.celery_app worker --loglevel=info
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Keys (free tiers)

Get at least one:
- **Gemini** (best free): https://aistudio.google.com — 1500 req/day free
- **Groq** (fastest): https://console.groq.com — free tier
- **OpenRouter** (fallback): https://openrouter.ai — free models available

## Architecture

```
User submits question
        ↓
FastAPI → Celery task
        ↓
LangGraph debate graph:
  Economy → Environment → Citizen → Cost
        ↓
  Cross-examination (rebuttals)
        ↓
  Moderator → Final verdict
        ↓
Each node streams tokens → Redis pub/sub → SSE → Frontend
        ↓
Full debate saved to MongoDB
```

## Project Structure

```
├── frontend/
│   └── src/
│       ├── components/     # AgentCard, VerdictCard, DebateGraph, etc.
│       ├── hooks/          # useDebateStream, useDebateHistory
│       ├── lib/            # utils, agentConfig
│       ├── pages/          # Home, Debate, History
│       └── types/          # TypeScript types
├── backend/
│   └── app/
│       ├── agents/         # LangGraph graph, base agent logic, prompts
│       ├── core/           # config, database, redis
│       ├── models/         # MongoDB documents
│       ├── routes/         # FastAPI routes
│       └── tasks/          # Celery tasks
├── docker-compose.yml
└── README.md
```
