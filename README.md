# OptiLLM

Intelligent AI gateway that sits between your app and LLM providers. It cuts spend with semantic caching and cheap-vs-expensive model routing, and it shows you the receipts.

**Why install this instead of calling OpenAI directly?**

1. **Semantic cache** — similar prompts reuse a stored answer (cost $0, ~8ms).
2. **Model router** — short/simple prompts go to `gpt-4o-mini`; hard ones go to `gpt-4o`.
3. **Prompt optimizer** — strips greetings and filler before embed/route/call.
4. **Cost analytics** — actual spend vs a “everything hit gpt-4o” baseline.
5. **API keys** — `/v1/chat` requires `X-API-Key`, so it behaves like installable middleware.

## Architecture

```
Browser (Next.js dashboard)          Your app / curl
        |                                    |
        |         X-API-Key + JSON           |
        +----------------+-------------------+
                         |
                  FastAPI gateway
                         |
     +-----------+-------+--------+-----------+
     |           |                |           |
  Postgres    Embeddings      OpenAI      Optional
  requests,    (local hashed   chat         Anthropic
  cache,       n-grams, or     completions  fallback
  api_keys,    OpenAI embed)
  documents
```

- **Frontend:** Next.js 16 + React 19 + Tailwind 4 + Recharts (`app/`)
- **Backend:** FastAPI + SQLAlchemy (`backend/`)
- **Database:** Postgres 16 (`docker compose`)

## Local setup

### 1. Postgres

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
# put a real OPENAI_API_KEY in ../.env
uvicorn main:app --reload --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend

```bash
cd app
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

## Calling the gateway

```bash
# create a key
curl -s -X POST http://localhost:8000/v1/keys \
  -H 'Content-Type: application/json' \
  -d '{"name":"my-app"}'

# chat (required header)
curl -s -X POST http://localhost:8000/v1/chat \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: ollm_...' \
  -d '{"messages":[{"role":"user","content":"Summarize TCP in one sentence."}]}'
```

Playground creates a key automatically and stores it in `localStorage`.

## Core API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | no | Liveness + whether OpenAI is configured |
| POST | `/v1/chat` | API key | Gateway: optimize → route → cache → LLM |
| GET | `/v1/requests` | no | Request log |
| GET | `/v1/analytics/overview` | no | Aggregates for the dashboard |
| GET/DELETE | `/v1/cache` | no | Cache explorer |
| GET/POST/DELETE | `/v1/keys` | no | Key management (demo-open) |
| GET/POST/DELETE | `/v1/documents` | no | RAG ingest |
| GET | `/v1/router` | no | Current routing rules |

Dashboard list endpoints are intentionally open for this portfolio demo. The spend path (`/v1/chat`) is locked behind an API key.

## Environment

See `.env.example`. Important variables:

- `OPENAI_API_KEY` — required for new completions
- `DATABASE_URL` — Postgres
- `DEFAULT_SIMPLE_MODEL` / `DEFAULT_COMPLEX_MODEL`
- `COMPLEXITY_THRESHOLD` (default `0.50`)
- `CACHE_SIMILARITY_THRESHOLD` (default `0.92`)
- `EMBEDDING_PROVIDER` — `local` (default) or `openai`
- `ANTHROPIC_API_KEY` — optional last-resort fallback
- `CORS_ORIGINS` — comma-separated; `*` for local
- `NEXT_PUBLIC_API_URL` — frontend → API

## Deploy

- **API + Postgres:** Render (`backend/` as a Python web service, start `uvicorn main:app --host 0.0.0.0 --port $PORT`)
- **Dashboard:** Vercel (root directory `app`, set `NEXT_PUBLIC_API_URL` to the Render URL)

Set `OPENAI_API_KEY` and `DATABASE_URL` on the Render service. Set `CORS_ORIGINS` to the Vercel domain.

## What is not in this repo

Forecasting, a prompt-quality advisor, context compression, and full RBAC. Key management is a simple hashed-secret model, not multi-tenant auth.
