# FactMesh

Autonomous multi-agent research and fact verification system. Enter any topic and FactMesh runs a pipeline of six AI agents that research, verify, and score every claim — then compiles a structured, citation-backed report.

## Architecture

```
Client (React/Vite)  ←→  Socket.IO  ←→  Server (Express)
                                            │
                              LangGraph.js Pipeline
                              ┌─────────────────┐
                              │ Research Agent   │
                              │ Search Agent     │
                              │ Verification     │
                              │ Hallucination    │
                              │ Confidence       │
                              │ Report Agent     │
                              └─────────────────┘
                                            │
                                        MongoDB
```

## Prerequisites

- Docker & Docker Compose
- OpenAI API key
- Tavily API key (free tier at [tavily.com](https://tavily.com))

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd factmesh
   ```

2. Copy the environment template and add your API keys:
   ```bash
   cp .env.example .env
   # Edit .env with your OPENAI_API_KEY and TAVILY_API_KEY
   ```

3. Start everything:
   ```bash
   docker-compose up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Local Development (without Docker)

### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

Requires a running MongoDB instance — set `MONGODB_URI` in `.env` to point at it.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM calls |
| `TAVILY_API_KEY` | Yes | Tavily API key for web search |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
| `PORT` | No | Server port (default: 5000) |

## Tech Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS, shadcn/ui, Redux Toolkit
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **AI**: LangGraph.js, LangChain.js, OpenAI GPT-4
- **Search**: Tavily API, Wikipedia API
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Docker + Docker Compose

## Project Structure

```
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── store/           # Redux Toolkit slices
│       ├── services/        # API service layer
│       └── hooks/           # Custom React hooks
├── server/                  # Express backend
│   └── src/
│       ├── agents/          # AI agent modules + pipeline
│       ├── controllers/     # Request handlers
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routes
│       ├── middleware/       # Auth middleware
│       └── sockets/         # Socket.IO handlers
└── docker-compose.yml
```
