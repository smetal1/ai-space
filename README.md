# AI Space — Canvas + Code Platform

AI-powered platform with a **Google Canvas-like editor** and **VS Code-like coding experience**, powered by **Claude API** and **vLLM** (open-source models).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Canvas       │ Code Editor  │ Chat Panel       │ │
│  │ (TipTap)     │ (Monaco)     │ (Streaming)      │ │
│  └──────────────┴──────────────┴──────────────────┘ │
│                     │ SSE / WebSocket               │
│  ┌──────────────────┴──────────────────────────────┐│
│  │  Backend (FastAPI)                              ││
│  │  ├── Claude API (Anthropic SDK)                 ││
│  │  └── vLLM (OpenAI-compatible, open-source LLMs)││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Stack (All Open Source)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Rich Text Editor | [TipTap](https://tiptap.dev) | Google Canvas-like document editing |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VS Code experience in the browser |
| Frontend | React 19 + Vite + Zustand | UI framework & state management |
| Backend | FastAPI + Uvicorn | Async API server with streaming |
| AI (Commercial) | Claude API (Anthropic SDK) | High-quality AI generation |
| AI (Open Source) | vLLM + any HuggingFace model | Self-hosted open-source models |
| Streaming | SSE + WebSocket | Real-time token streaming |
| Deployment | Docker Compose | One-command deployment |

## Do You Need LangChain?

**No.** For this use case, LangChain adds unnecessary abstraction. Here's why:

- **Direct API calls** via the Anthropic SDK and vLLM's OpenAI-compatible API are simpler and faster
- **No complex chains** — each action (generate, fix, explain) is a single prompt → response
- **Streaming** is handled natively by both SDKs
- **State management** lives in the frontend (Zustand), not in a chain
- LangChain is useful for complex RAG pipelines with multiple retrievers, agents, and tool-calling — this platform doesn't need that

## Quick Start

### Development

```bash
# Backend
cd backend
cp .env.example .env        # Add your ANTHROPIC_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

docker compose up --build
```

App runs at `http://localhost:3000`, API at `http://localhost:8080`.

### Using vLLM (Open Source Models)

To run fully open-source with local models:

```bash
# 1. Uncomment the vllm service in docker-compose.yml
# 2. Set DEFAULT_PROVIDER=vllm in backend/.env
# 3. Run with GPU support:
docker compose up --build
```

Or run vLLM standalone:
```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000
```

## Features

### Canvas (Document Editor)
- Rich text editing (headings, bold, italic, lists, quotes, code blocks)
- AI actions: **Generate**, **Improve**, **Summarize**, **Expand**, **Edit Selection**
- Real-time streaming output

### Code Editor
- Full VS Code experience (Monaco Editor)
- 14+ language support
- AI actions: **Generate**, **Fix**, **Refactor**, **Explain**, **Review**
- Instruction-based code generation

### Chat
- Conversational AI assistant
- Full message history
- Token-by-token streaming

### Provider Switching
- Toggle between Claude and vLLM from the header
- Same interface, different backends

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Chat with streaming (SSE) |
| POST | `/api/canvas` | Canvas AI actions (SSE) |
| POST | `/api/code` | Code AI actions (SSE) |
| WS | `/ws/chat` | Chat via WebSocket |
| WS | `/ws/canvas` | Canvas via WebSocket |
| WS | `/ws/code` | Code via WebSocket |
| GET | `/health` | Health check |
