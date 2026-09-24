<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:A78BFA,50:C084FC,100:F472B6&text=OptiLLM&fontColor=FFFFFF&fontSize=60&fontAlignY=38&desc=Spend%20less%20on%20LLMs.%20See%20exactly%20where%20every%20dollar%20goes.&descSize=18&descAlignY=62&animation=fadeIn" width="100%" alt="OptiLLM banner" />

![Status](https://img.shields.io/badge/Status-In_Development-F472B6?style=for-the-badge&labelColor=1F1B2E)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-A78BFA?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=1F1B2E)
![Next.js](https://img.shields.io/badge/Next.js-16-F472B6?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=1F1B2E)
![Last commit](https://img.shields.io/github/last-commit/Yuvika687/OptiLLM?style=for-the-badge&color=A78BFA&labelColor=1F1B2E)
![Stars](https://img.shields.io/github/stars/Yuvika687/OptiLLM?style=for-the-badge&color=F472B6&labelColor=1F1B2E)

**[Live dashboard](https://optillm.vercel.app)** · **[API health](https://optillm-api.onrender.com/health)**

</div>

## ✨ Overview

Calling a frontier LLM for every request is expensive, and many requests are near-duplicates or simple enough for a smaller model. **OptiLLM** is a gateway that sits between an application and its LLM provider. It **optimizes the prompt**, **routes** it to a cheaper or stronger model based on estimated complexity, **reuses cached answers** for semantically similar prompts, and records every request so cost and behavior are visible in a dashboard.

> 🚧 **Work in progress.** The gateway, dashboard and API-key flow run end to end. Benchmarking against a direct-to-provider baseline is still to be done — no performance claims are made until that is measured.

## 🧭 Architecture

```mermaid
flowchart LR
    A[Client app / curl] -->|X-API-Key + JSON| B[FastAPI gateway]
    D[Next.js dashboard] --> B
    B --> C[Prompt optimizer]
    C --> E{Semantic cache}
    E -- hit --> R[Return cached answer]
    E -- miss --> F{Complexity router}
    F -- simple --> G[Small model]
    F -- complex --> H[Large model]
    G --> I[(PostgreSQL: requests, cache, keys, docs)]
    H --> I
    G -.fallback.-> J[Optional Anthropic]
    H -.fallback.-> J
    R --> I
```

## 🔑 Key features

| | Feature | Notes |
|---|---|---|
| ✅ | Semantic cache | Similar prompts reuse a stored answer (default similarity threshold `0.92`) |
| ✅ | Model router | Simple prompts → `gpt-4o-mini`, harder ones → `gpt-4o` (complexity threshold `0.50`) |
| ✅ | Prompt optimizer | Strips greetings/filler before embed → route → call |
| ✅ | Cost analytics | Actual spend vs an "everything on the large model" baseline |
| ✅ | API keys | `/v1/chat` requires `X-API-Key` |
| ✅ | Dashboard | Requests log, cache explorer, routing rules, documents, analytics |
| 🔜 | Benchmarks vs direct calls | Not measured yet |
| 🔜 | Auth on dashboard list endpoints | Currently intentionally open for the demo |

## 🧰 Tech stack

![Python](https://img.shields.io/badge/Python-1F1B2E?style=for-the-badge&logo=python&logoColor=A78BFA)
![FastAPI](https://img.shields.io/badge/FastAPI-1F1B2E?style=for-the-badge&logo=fastapi&logoColor=F472B6)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-1F1B2E?style=for-the-badge&logo=sqlalchemy&logoColor=8BE9FD)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-1F1B2E?style=for-the-badge&logo=postgresql&logoColor=A78BFA)
![Next.js](https://img.shields.io/badge/Next.js-1F1B2E?style=for-the-badge&logo=nextdotjs&logoColor=F472B6)
![Tailwind](https://img.shields.io/badge/Tailwind-1F1B2E?style=for-the-badge&logo=tailwindcss&logoColor=8BE9FD)
![Docker](https://img.shields.io/badge/Docker-1F1B2E?style=for-the-badge&logo=docker&logoColor=A78BFA)

## 📈 Benchmarks

Benchmarks against direct provider calls (cache-hit latency, cost per 1k requests, cache hit rate, routing accuracy) are planned. No performance figures are claimed until they are measured.

## 🚀 Installation & usage

```bash
# 1. Postgres
docker compose up -d

# 2. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env          # add a real OPENAI_API_KEY
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd app
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
npm run dev                          # http://localhost:3000
```

```bash
# create an API key, then call the gateway
curl -s -X POST http://localhost:8000/v1/keys -H 'Content-Type: application/json' -d '{"name":"my-app"}'

curl -s -X POST http://localhost:8000/v1/chat \
  -H 'Content-Type: application/json' -H 'X-API-Key: ollm_...' \
  -d '{"messages":[{"role":"user","content":"Summarize TCP in one sentence."}]}'
```

## 🗂️ Project structure

```
OptiLLM/
├── app/                 # Next.js 16 dashboard (analytics, cache, requests, playground…)
├── backend/             # FastAPI gateway (optimizer, router, cache, keys, documents)
├── docker-compose.yml   # Postgres 16
├── .env.example
├── DESIGN.md
└── README.md
```

## 🗺️ Roadmap

- [x] FastAPI gateway with API-key protected `/v1/chat`
- [x] Semantic cache + model routing + prompt optimizer
- [x] Dashboard (analytics, requests, cache, routing, documents, playground)
- [x] Deployed demo (Vercel + Render)
- [ ] Benchmark against direct provider calls and publish real numbers
- [ ] Protect dashboard/list endpoints with auth
- [ ] Add a LICENSE and tests

## 🙏 Acknowledgements

OpenAI API, FastAPI, Next.js, Recharts.

<div align="center">

### 👩‍💻 Author

**Yuvika Malhotra** — [GitHub](https://github.com/Yuvika687) · [LinkedIn](https://linkedin.com/in/yuvika-malhotra) · [Email](mailto:yuvikamalhotra1414@gmail.com)

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:F472B6,50:C084FC,100:A78BFA&section=footer&reversal=true" width="100%" alt="Footer wave" />

</div>
