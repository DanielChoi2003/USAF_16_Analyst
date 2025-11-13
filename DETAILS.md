# Details — Setup, architecture, and developer notes

Read this when you need the full setup steps, architecture rationale, or guidance for extending the prototype.

1. Quick checklist

- Start frontend: `cd frontend && npm install && npm run dev`
- Start backend (optional):

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env for API keys and DB URLs
python src/main.py
```

- Load sample data (optional): `cd backend && python src/scripts/seed_packages.py`

2. High-level architecture

- Frontend: Next.js 14 + TypeScript + Tailwind. A small demo page shows the intended three-column layout (Events / Enrichment / Report).
- Backend: FastAPI skeleton provides routing, Pydantic models, and placeholders for RAG services.
- Data: `data/samples/` holds example JSON packages. `data/mitre/` holds ATT&CK pickle files and the sync script.

3. RAG and LLM notes (summary)

- Intended stack: LangChain + ChromaDB + OpenAI (or alternative). The repository includes scaffolding; actual LLM/Chroma wiring is left explicit so you can choose provider/config.
- Retrieval flow (intended): embed event text, query ChromaDB for similar MITRE techniques, inject top matches into prompt, call LLM to generate summary/observations/recommendations, record provenance.

4. Developer workflow and rules

- Keep changes small and test often. Run `npm run build` in `frontend` before pushing significant changes.
- Use clear TypeScript types in the frontend; prefer explicit interfaces to `any`.
- Follow Conventional Commits for clear changelogs (examples: `feat(frontend): add event expand`, `fix(backend): validate missing host`).

5. Data locations and how to use them

- Example packages: `data/samples/baseline.json`, `ex1-baseline.json`, `ex1-enriched.json`.
- MITRE data and sync: `data/mitre/sync_mitre.py` updates technique/tactic pickles.

6. Testing and linting

- Frontend: Vitest for unit tests, `npm run test` in `frontend`.
- Backend: pytest under `backend/tests/`.
- Lint/format: Run `make lint` and `make format` (Makefile delegates to ESLint/Prettier and Ruff where appropriate).

7. Design decisions (short)

- Keep frontend and backend in a single repo for easy iteration and shared types.
- Favor LangChain for LLM orchestration because it supports chaining and retrieval patterns we want.
- ChromaDB chosen for local demo simplicity; swap to Pinecone or managed vector DB for production if needed.

8. Next steps and priorities

1) Add one interactive UI behavior (expand/collapse on an event row). Keep state local.
2) Add a frontend mock API route to return `ex1-enriched.json` and wire the page to fetch it.
3) Add a small static modal for LLM actions.

If you prefer, I can make these changes for you and run the build/tests locally.

9. Where to find things in the code

- `frontend/src/app/page.tsx` — demo page and layout
- `frontend/src/components/` — small UI primitives and layout components
- `frontend/src/lib/types.ts` — TypeScript types used by the UI
- `backend/src/main.py` — FastAPI app bootstrap
- `backend/src/api/` — place to add package/llm/enrichment endpoints

10. Contact and maintainers

- Ethan Curb — ethan.curb@example.com

If you'd like this document trimmed further or converted into a checklist-style README, tell me which sections to prioritize.
