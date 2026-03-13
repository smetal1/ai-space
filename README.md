# AI Space — Canvas + Code Platform

AI-powered platform with a **Google Canvas-like editor** and **VS Code-like coding experience**, powered by **Claude API** and **vLLM** (open-source models).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Canvas       │ Code Editor  │ Chat Panel       │ │
│  │ (TipTap)     │ (Monaco)     │ (Streaming)      │ │
│  ├──────────────┴──────────────┴──────────────────┤ │
│  │ Code Agent (autonomous tool-calling AI)        │ │
│  └────────────────────────────────────────────────┘ │
│                     │ SSE / WebSocket               │
│  ┌──────────────────┴──────────────────────────────┐│
│  │  Backend (FastAPI)                              ││
│  │  ├── Claude API (Anthropic SDK + tool_use)      ││
│  │  ├── vLLM (OpenAI-compatible, open-source LLMs)││
│  │  └── Agent Loop (plan → tool → observe → repeat)││
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
| Code Agent | Claude tool_use / OpenAI function calling | Autonomous coding agent with tool loop |
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

Or run vLLM standalone with **Qwen3.5** (recommended for the code agent):
```bash
pip install vllm
vllm serve Qwen/Qwen3.5-9B \
  --port 8000 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.5 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --reasoning-parser qwen3
```

Key flags:
- `--gpu-memory-utilization 0.5` — uses 50% of GPU VRAM (24GB on L40S)
- `--tool-call-parser qwen3_coder` — **required** for the code agent's function calling
- `--reasoning-parser qwen3` — enables Qwen3.5's native thinking/reasoning mode
- `--max-model-len 32768` — balanced context length for 50% VRAM budget

#### Qwen3.5 Model Options

| Model | Type | VRAM (FP16) | Best For |
|-------|------|-------------|----------|
| `Qwen/Qwen3.5-4B` | Dense | ~8 GB | Testing / low-resource |
| **`Qwen/Qwen3.5-9B`** | **Dense** | **~18 GB** | **L40S @ 50% (recommended)** |
| `Qwen/Qwen3.5-27B` | Dense | ~54 GB | Full L40S or multi-GPU |
| `Qwen/Qwen3.5-35B-A3B` | MoE | ~70 GB (3B active) | High quality, needs more VRAM for weights |
| `Qwen/Qwen3.5-122B-A10B` | MoE | ~244 GB | Multi-node |

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

### Code Agent (Autonomous)
- Full agentic loop: plan → execute tools → observe results → repeat
- **6 tools**: `read_file`, `write_file`, `edit_file`, `list_files`, `search_files`, `run_command`
- Sandboxed workspace — agent operates in an isolated directory
- Real-time event streaming (see tool calls, results, and agent thinking live)
- Works with both Claude (native tool_use) and vLLM (OpenAI function calling)
- Up to 20 iterations per task

### Provider Switching
- Toggle between Claude and vLLM from the header
- Same interface, different backends

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Chat with streaming (SSE) |
| POST | `/api/canvas` | Canvas AI actions (SSE) |
| POST | `/api/code` | Code AI actions (SSE) |
| POST | `/api/agent` | Code agent with tool calling (SSE) |
| WS | `/ws/chat` | Chat via WebSocket |
| WS | `/ws/canvas` | Canvas via WebSocket |
| WS | `/ws/code` | Code via WebSocket |
| WS | `/ws/agent` | Agent via WebSocket |
| GET | `/health` | Health check |
