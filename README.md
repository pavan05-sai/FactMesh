# FactMesh

Autonomous multi-agent research and fact verification system. Enter any topic or hypothesis, and FactMesh orchestrates a pipeline of specialized AI agents that research, verify against live web evidence, audit for hallucinations and contradictions, and compile citation-backed verification reports.

## Architecture

```
Client (React / Vite / Redux)  ←→  Socket.IO  ←→  Server (Express / TypeScript)
                                                        │
                                            Multi-Agent Consensus Pipeline
                                            ┌─────────────────────────────┐
                                            │ 1. Research Agent           │
                                            │ 2. Search Agent (Tavily/Wiki)│
                                            │ 3. Verification Agent       │
                                            │ 4. Hallucination Agent      │
                                            │ 5. Confidence Agent         │
                                            │ 6. Report Agent             │
                                            └─────────────────────────────┘
                                                        │
                                                    MongoDB
```

## Prerequisites

- Node.js 18+ (tested with Node 20 & 24)
- MongoDB instance (local or MongoDB Atlas)
- LLM Provider API Key:
  - **OpenRouter** (recommended, e.g. `google/gemini-2.0-flash-001`, `meta-llama/llama-3.3-70b-instruct`) OR
  - **OpenAI** (e.g. `gpt-4o-mini`)
- **Tavily API Key** for live web searches (free tier available at [tavily.com](https://tavily.com)). *Note: If Tavily is not configured or its quota is exceeded, FactMesh automatically falls back to Wikipedia.*

## Quick Start

1. **Clone the repository and switch to the branch:**
   ```bash
   git clone <repo-url>
   cd factmesh
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your preferred model provider and keys in `.env`:
   ```bash
   # Choose provider: "openrouter" or "openai"
   LLM_PROVIDER=openrouter

   # OpenRouter settings
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   OPENROUTER_MODEL=google/gemini-2.0-flash-001

   # Tavily web search
   TAVILY_API_KEY=tvly-your-tavily-key-here

   # Database & Secrets
   MONGODB_URI=mongodb://localhost:27017/factmesh
   JWT_SECRET=change-this-to-a-random-secret-string
   ```

3. **Install Dependencies:**
   ```bash
   # In server/
   cd server
   npm install

   # In client/
   cd ../client
   npm install
   ```

4. **Run the Automated Test Suite:**
   ```bash
   cd server
   npm test
   ```

5. **Start Development Servers:**
   - **Backend Server:**
     ```bash
     cd server
     npm run dev
     ```
     Runs on `http://localhost:5000`.
   - **Frontend Client:**
     ```bash
     cd client
     npm run dev
     ```
     Runs on `http://localhost:5173`.

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | No | `openrouter` (or auto-detected from key) | Provider selection: `openrouter` or `openai` |
| `OPENROUTER_API_KEY` | Yes (if provider is openrouter) | - | OpenRouter API authentication key |
| `OPENROUTER_MODEL` | No | `google/gemini-2.0-flash-001` | Any valid model available on OpenRouter |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter endpoint |
| `OPENAI_API_KEY` | Yes (if provider is openai) | - | OpenAI API authentication key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model ID |
| `TAVILY_API_KEY` | Recommended | - | Live web search; Wikipedia fallback is used if absent |
| `LLM_TIMEOUT_MS` | No | `30000` | Max request timeout for LLM calls (ms) |
| `SEARCH_TIMEOUT_MS`| No | `10000` | Max request timeout for search calls (ms) |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/factmesh` | MongoDB connection URI |
| `JWT_SECRET` | Yes | - | Secret for authentication tokens |
| `PORT` | No | `5000` | Express API port |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated list of CORS allowed origins |

## Verification Logic & Reliability Safeguards

- **No Presence-as-Proof**: A search result's mere existence does not mark a claim verified. The evidence must explicitly substantiate the assertion.
- **Explicit Verdicts**:
  - `supported`: The evidence directly confirms the specific assertion.
  - `contradicted`: The evidence directly refutes the claim.
  - `insufficient_evidence`: The evidence is ambiguous, tangential, or missing.
  - `verification_error`: Technical error during processing; never treated as false.
- **Prompt Injection Defense**: All retrieved web snippets are sanitized and enclosed in untrusted data delimiters to prevent third-party prompt override.
- **Calibrated Confidence**: Mathematical bounded scoring based on independent domains, authoritative sources (.gov, .edu, Wikipedia), and conflict penalties.
- **Report Determinism**: Report summaries and claim tables strictly reflect verified states; uncertain claims are never upgraded.
