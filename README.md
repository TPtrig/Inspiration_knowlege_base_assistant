# Inspiration

**Build a knowledge base from the sources you choose.**
Keep useful ideas from podcasts, practitioner interviews, research links, and your own notes. Ask from the material you saved and discover where ideas connect. The public workspace demonstrates the full concept; the real backend is being completed in stages.

The product page lives at /, and the example workspace is at /workspace. Demo Mode uses sample content and simulated AI behavior; Live Mode runs with the local backend.

## Product Summary

`Inspiration` is the 2.0 evolution of `PodBrain`.

The product direction expands from podcast-first memory capture toward:

- podcasts
- long-form video
- text notes
- image-based fragments
- agent-driven synthesis workflows

The current demo shows the intended Human-in-the-Loop RAG experience:

- multimodal input
- a memory curation view
- a clickable knowledge map that links topics to saved ideas and conversations
- Agent Inbox
- nightly knowledge graph generation
- serendipity prompts that reconnect new ideas to historical memory

## Product documents

- [Current product requirements](./docs/PRD.md)
- [Backend technical design](./docs/TRD.md)
- [Personal computer handoff](./docs/HANDOFF_PERSONAL_COMPUTER.md)
- [Desktop workspace and product page](./docs/desktop-ui-direction.md)

## Why This Product

Modern knowledge work is fragmented across audio, video, notes, screenshots, and links.
Most people capture information in many places, but rarely convert it into reusable memory or synthesis.

Inspiration is designed to solve that through a five-part loop:

1. Capture chosen sources and draft ideas from supported material.
2. Curate what actually matters across multimodal fragments.
3. Chat only on curated memory.
4. Generate knowledge structure through agents.
5. Surface hidden connections at the moment they become useful.

## Core Innovation

**Human-in-the-Loop RAG**

Automatically storing every extracted idea can introduce noise. Inspiration adds a review step:

- AI drafts takeaways from source content.
- User edits/selects what is high-signal.
- Only selected takeaways are used as memory for retrieval.

On top of that foundation, Inspiration adds an agent layer for:

- nightly clustering
- knowledge graph generation
- serendipity pushes
- inbox-based review of synthesis outputs

## Product Experience

### 1. Ingest

The workspace shows one intake surface for:

- media links
- text fragments
- image attachments

### 2. Curate

Review takeaways in a dedicated RAG Builder:

- Check/uncheck memory items
- Delete low-value entries
- Save only selected memory into the durable layer

### 3. Grounded Chat

Ask questions in a ChatGPT-style workspace. Answers are grounded in selected memory entries.

### 4. Synthesis

Review `Agent Inbox` outputs such as:

- nightly knowledge graphs
- serendipity prompts
- concept bridges across historical memory

## Demo Mode vs Live Mode

### Demo Mode (Public Vercel Link)

- Seeded chats, sources, map, and inbox are viewable without a backend or API key
- Sample chat and curation remain illustrative; podcast extraction does not fabricate a result
- Best for portfolio and product storytelling

### Live Mode (Local Full Stack)

- The workspace keeps its sample material while Xiaoyuzhou episode links and local audio files use real FastAPI transcription, insight extraction, curation, and retrieval
- Non-podcast parsing remains outside Live Mode; the legacy backend mock endpoint is not used by the Live workspace
- SQLite + ChromaDB local persistence for saved memory
- Live chat shows numbered citations to saved takeaways and links to the original podcast where available; citations remain visible in conversation history
- Map relationships and persistent inbox are planned in the [TRD](./docs/TRD.md)

## Tech Stack

- Frontend: Next.js (App Router), React, Tailwind CSS, Lucide
- Backend: FastAPI
- AI (live mode): OpenAI Whisper or Feishu Minutes for transcription; GPT-4o-mini and text-embedding-3-small for extraction and memory
- Data (live mode): SQLite + ChromaDB

## Local Setup (Optional Full Stack)

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Local development only: optionally copy .env.example to .env and set OPENAI_API_KEY.
# Hosted backend: set OPENAI_API_KEY in the host's secret/environment settings instead.
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Podcast extraction accepts a Xiaoyuzhou episode link or one MP3, M4A, WAV, AAC, or OGG file (up to 500 MB). The backend reads `OPENAI_API_KEY` from its process environment or, for optional local development, the Git-ignored `backend/.env`; the workspace does not ask for or transmit the key. Set the key in the backend hosting provider's secret settings for a deployed product. Supported audio at or under 25 MB uses Whisper by default; larger audio and AAC use Feishu Minutes. For Feishu, install and log in to `lark-cli` as your user, then make it available on `PATH` or set `LARK_CLI_PATH`. Set `PODCAST_TRANSCRIBER=feishu` to use it for every episode, or `PODCAST_TRANSCRIBER=openai` to use only Whisper. The API retains the transcript and source reference; temporary audio is deleted after processing. Current citations identify saved takeaways, without verified speaker names or audio timestamps.

Keep the backend bound to `127.0.0.1` for this single-user setup. Before exposing it publicly, add user authentication, request limits, and a spend cap; hiding the key on the server alone does not stop strangers from calling a public endpoint. Set `FRONTEND_ORIGINS` on the backend to the permitted frontend origins when deploying.

The public Vercel demo currently serves the frontend only. Live podcast jobs and saved memory still depend on the local FastAPI process, SQLite file, and Chroma directory. A durable hosted product needs a deployed backend and persistent database/vector storage; a cloud API key alone does not preserve these local records.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Set `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_DEMO_MODE=false
```

Run frontend:

```bash
npm run dev
```

Open the product page at [http://127.0.0.1:3000](http://127.0.0.1:3000), or go directly to the [workspace](http://127.0.0.1:3000/workspace).

## Portfolio Context

This project was built as a product-focused AI MVP to demonstrate:

- Problem framing and product narrative
- Human-centered RAG design decisions
- End-to-end UX flow from ingestion to grounded chat
- Agent-driven knowledge synthesis and recall
- Practical delivery strategy (demo-first, full-stack optional)
