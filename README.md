# Analyst Copilot

**USAF 16th Air Force Cyber Analyst Copilot**  
Fall 2025 Capstone Project (Prof. Kumar)

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-proprietary-red)

# Analyst Copilot

Analyst Copilot is a small prototype for drafting analyst reports from alert packages. The frontend is a Next.js + TypeScript demo app and the backend is a FastAPI skeleton with scaffolding for later RAG/LLM work.

Status

- Prototype / development. The repo contains a working frontend demo and supporting backend scaffolding. See `DETAILS.md` for the full setup and rationale.

Prerequisites

- Node 18+ and npm
- Python 3.11 for backend development (optional)

Quick start (frontend)

```bash
cd frontend
npm install
npm run dev
```

Optional: start the backend

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install lightrag-hku
# .env needs to be in the same working directory to test query_rag
# create .env in /rag with the following:
NEO4J_URI="neo4j://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="password"
# if the training has not been done before
python3 instantiate_rag.py

# edit .env for API keys and DB URLs
python src/main.py
```

Load the sample data (optional)

```bash
cd backend
python src/scripts/seed_packages.py
```

Repository layout (high level)

- `frontend/` — Next.js app and UI components
- `backend/` — FastAPI app and service scaffolding
- `data/` — sample packages and MITRE data
- `DETAILS.md` — consolidated setup, architecture, and developer notes
- `CONTRIBUTING.md` — short contributor guide and commit conventions

Running tests and checks

Frontend

```bash
cd frontend
npm run test      # unit tests (Vitest)
npm run lint
npm run type-check
```

Backend

```bash
cd backend
pytest tests/
ruff check src/ tests/
```

Notes and next steps

- The UI currently uses mock data. If you want it to fetch `ex1-enriched.json`, add a small frontend API route and wire the page.
- Keep changes small and run `npm run build` before pushing major changes.

Contact

- Ethan Curb — ethan.curb@example.com

source venv/bin/activate
pip install -r requirements.txt
python src/main.py

```

If you want a compact developer checklist and next steps, see `FRESH_START.md`.

More details about architecture, setup, and development workflow are in `DETAILS.md`.

Contact

- Ethan Curb — ethan.curb@example.com
```
