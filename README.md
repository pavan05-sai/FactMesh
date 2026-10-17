# FactMesh 🔍

> **Autonomous Multi-Agent Research & Fact-Verification System**

FactMesh is an intelligent, production-ready platform that orchestrates a pipeline of specialized AI agents to research any topic or hypothesis, verify claims against live web evidence, audit for hallucinations and contradictions, and compile citation-backed verification reports — all in real time.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Key Features

- **🤖 Multi-Agent Consensus Pipeline** — Six specialized AI agents collaborate in sequence: Research → Search → Verification → Hallucination Audit → Confidence Scoring → Report Generation.
- **🌐 Live Web Evidence** — Integrates with Tavily API for real-time web search; automatically falls back to Wikipedia if Tavily is unavailable or quota-exceeded.
- **🛡️ Hallucination Detection** — Dedicated agent cross-checks LLM outputs against retrieved evidence, flagging unsupported or fabricated claims.
- **📊 Calibrated Confidence Scoring** — Mathematically bounded scoring based on independent sources, authoritative domains (`.gov`, `.edu`, Wikipedia), and conflict penalties.
- **⚡ Real-Time Streaming** — Socket.IO powered live updates: watch each agent's progress as it happens in the browser.
- **🔐 JWT Authentication** — Secure user registration, login, and protected routes with JSON Web Tokens.
- **📄 Export Reports** — Download verification reports as PDF or JSON with full citation references.
- **🔒 Prompt Injection Defense** — All retrieved web snippets are sanitized and wrapped in untrusted-data delimiters to prevent third-party prompt override.
- **🧪 Automated Test Suite** — Node.js built-in test runner with unit tests covering controllers and agent logic.
- **🐳 Docker Ready** — Dockerfile and `docker-compose.yml` provided for containerized deployments.
- **☁️ Cloud Deployable** — Includes Render (`render.yaml`) and Vercel (`vercel.json`) configuration files.

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 18+** | Runtime environment |
| **Express.js** | REST API framework |
| **TypeScript 5.6** | Type-safe server code |
| **Socket.IO** | Real-time bidirectional communication |
| **LangChain + LangGraph** | Agent orchestration & LLM abstractions |
| **OpenRouter / OpenAI** | LLM provider (Gemini, LLaMA, GPT-4o, etc.) |
| **Tavily API** | Live web search with evidence retrieval |
| **MongoDB + Mongoose** | Database persistence for runs, claims & reports |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Helmet + CORS** | Security headers & cross-origin control |
| **PDFKit** | Server-side PDF report generation |
| **Zod** | Schema validation |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **TypeScript** | Type-safe client code |
| **Vite** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **React Router v6** | Client-side routing |
| **Socket.IO Client** | Real-time agent updates |
| **TailwindCSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React / Vite)                   │
│   HomePage  LoginPage  ResearchPage  VerificationPage           │
│   DashboardPage  ReportPage  <->  Redux Store                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST + Socket.IO
┌────────────────────────▼────────────────────────────────────────┐
│                  Express Server (TypeScript)                     │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  Auth Routes │  │   Run Routes    │  │ Dashboard Routes  │  │
│  └──────────────┘  └────────┬────────┘  └───────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │              Multi-Agent Consensus Pipeline              │   │
│  │                                                          │   │
│  │  1. Research Agent    -- Structures hypotheses           │   │
│  │  2. Search Agent      -- Tavily / Wikipedia lookups      │   │
│  │  3. Verification Agent-- Evidence-based claim audit      │   │
│  │  4. Hallucination Agent-- Detects fabricated claims      │   │
│  │  5. Confidence Agent  -- Scores each claim (0-1)         │   │
│  │  6. Report Agent      -- Compiles final report           │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└────────────────────────────┬┴────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
     MongoDB Atlas      OpenRouter /       Tavily API /
  (Runs, Claims,        OpenAI LLMs        Wikipedia
    Reports, Users)
```

### Agent Pipeline Flow

```
Input Topic / Hypothesis
        │
        ▼
 [1] Research Agent -----> Decomposes topic into verifiable claims
        │
        ▼
 [2] Search Agent -------> Fetches live evidence (Tavily -> Wikipedia fallback)
        │
        ▼
 [3] Verification Agent -> Audits each claim: supported / contradicted / insufficient
        │
        ▼
 [4] Hallucination Agent -> Cross-checks LLM reasoning against raw evidence
        │
        ▼
 [5] Confidence Agent ---> Computes bounded confidence score per claim
        │
        ▼
 [6] Report Agent -------> Compiles citation-backed final report (PDF / JSON)
        │
        ▼
   Final Report <--------- Streamed to client via Socket.IO in real time
```

---

## 📁 Folder Structure

```
factmesh/
├── .env.example                    # Environment variable template
├── .gitignore
├── docker-compose.yml              # Multi-container Docker setup
├── render.yaml                     # Render deployment configuration
├── README.md
│
├── server/                         # Express + TypeScript backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # App entry point, server bootstrap
│       ├── agents/                 # Multi-agent pipeline
│       │   ├── pipeline.ts         # LangGraph orchestration pipeline
│       │   ├── researchAgent.ts    # Hypothesis decomposition agent
│       │   ├── searchAgent.ts      # Tavily / Wikipedia search agent
│       │   ├── verificationAgent.ts# Claim verification logic
│       │   ├── hallucinationAgent.ts# Hallucination detection agent
│       │   ├── confidenceAgent.ts  # Confidence scoring agent
│       │   ├── reportAgent.ts      # Report compilation agent
│       │   ├── llmProvider.ts      # OpenRouter / OpenAI abstraction
│       │   ├── llmHelper.ts        # LLM utility helpers
│       │   ├── state.ts            # LangGraph shared state schema
│       │   └── __tests__/          # Agent unit tests
│       ├── controllers/            # Request handlers
│       │   ├── authController.ts   # Register / login / logout
│       │   ├── runController.ts    # Pipeline execution & history
│       │   ├── dashboardController.ts # Stats & analytics
│       │   └── __tests__/          # Controller unit tests
│       ├── models/                 # Mongoose schemas
│       │   ├── User.ts
│       │   ├── Run.ts
│       │   ├── Claim.ts
│       │   └── Report.ts
│       ├── routes/                 # Express route definitions
│       ├── middleware/             # Auth, rate limiting, error handling
│       ├── sockets/                # Socket.IO event handlers
│       └── config/                 # Environment config (env.ts)
│
└── client/                         # React + Vite frontend
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── nginx.conf                  # Production NGINX config
    ├── vercel.json                 # Vercel SPA routing config
    └── src/
        ├── main.tsx                # React entry point
        ├── App.tsx                 # Router & layout setup
        ├── index.css               # Global styles
        ├── pages/                  # Route-level page components
        │   ├── HomePage.tsx        # Landing / topic input
        │   ├── LoginPage.tsx       # Auth page
        │   ├── ResearchPage.tsx    # Live agent progress view
        │   ├── VerificationPage.tsx# Claim-by-claim results
        │   ├── DashboardPage.tsx   # Run history & stats
        │   └── ReportPage.tsx      # Final report with export
        ├── components/             # Reusable UI components
        │   ├── AgentCard.tsx       # Per-agent status card
        │   ├── ClaimRow.tsx        # Individual claim display
        │   ├── ExportButtons.tsx   # PDF / JSON download
        │   ├── Layout.tsx          # App shell & navigation
        │   ├── SearchInput.tsx     # Topic submission input
        │   ├── StatCard.tsx        # Dashboard metric card
        │   └── ProtectedRoute.tsx  # Auth guard wrapper
        ├── store/                  # Redux Toolkit slices
        ├── hooks/                  # Custom React hooks
        └── services/               # Axios & Socket.IO clients
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (tested with Node 20 & 24)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **LLM API Key** — [OpenRouter](https://openrouter.ai) (recommended) or [OpenAI](https://platform.openai.com)
- **Tavily API Key** — Free tier at [tavily.com](https://tavily.com) *(optional; Wikipedia fallback used if absent)*

### 1. Clone the Repository

```bash
git clone https://github.com/pavan05-sai/FactMesh.git
cd FactMesh
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# LLM Provider
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Search
TAVILY_API_KEY=tvly-your-key-here

# Database & Auth
MONGODB_URI=mongodb://localhost:27017/factmesh
JWT_SECRET=change-this-to-a-random-secret

# Server
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

### 5. Run Tests

```bash
cd server && npm test
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | No | `openrouter` | Provider: `openrouter` or `openai` |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter authentication key |
| `OPENROUTER_MODEL` | No | `google/gemini-2.0-flash-001` | Any model on OpenRouter |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter endpoint |
| `OPENAI_API_KEY` | Yes* | — | OpenAI authentication key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model ID |
| `TAVILY_API_KEY` | Recommended | — | Live web search; Wikipedia fallback if absent |
| `LLM_TIMEOUT_MS` | No | `30000` | LLM request timeout (ms) |
| `SEARCH_TIMEOUT_MS` | No | `10000` | Search request timeout (ms) |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/factmesh` | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `PORT` | No | `5000` | Express API port |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |

> *Only one provider key is required depending on `LLM_PROVIDER` setting.

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker compose up --build

# Services exposed:
# Frontend -> http://localhost:3000
# Backend  -> http://localhost:5000
```

---

## 🔒 Verification Logic & Reliability Safeguards

| Safeguard | Description |
|---|---|
| **No Presence-as-Proof** | A search result's mere existence does not mark a claim verified; evidence must explicitly substantiate the assertion |
| **Explicit Verdicts** | `supported` · `contradicted` · `insufficient_evidence` · `verification_error` |
| **Prompt Injection Defense** | Retrieved web snippets are sanitized and enclosed in untrusted-data delimiters |
| **Calibrated Confidence** | Bounded scoring based on independent domains, authoritative sources, and conflict penalties |
| **Report Determinism** | Summaries strictly reflect verified states; uncertain claims are never silently upgraded |

---

## 👤 Author

**Pavan Sai** — [@pavan05-sai](https://github.com/pavan05-sai)

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Pavan Sai (pavan05-sai)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/pavan05-sai">pavan05-sai</a></sub>
</div>
