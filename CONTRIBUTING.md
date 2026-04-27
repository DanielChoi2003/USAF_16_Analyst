# Contributing

This repo is a class prototype, so the best contribution style is small, testable changes with clear setup notes.

## Getting Started

```bash
git clone <repo-url>
cd USAF_16_Analyst
cp .env.example .env
```

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../rag
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -e .
./venv/bin/python -m pip install neo4j python-dotenv ollama pymisp

cd ..
```

Start the full local stack:

```bash
make up
```

Stop it:

```bash
make down
```

There is no root `make setup`, `make dev`, `make test`, `make lint`, or `make format` target right now.

## Branches And Commits

Use focused branches:

```bash
git checkout -b feature/upload-ingest
git checkout -b fix/elasticsearch-result-loading
```

Use clear commit messages. Conventional Commit style is preferred:

```bash
git commit -m "feat(frontend): show elastic retrieval status"
git commit -m "fix(backend): handle missing package id"
```

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run test
npm run build
```

Run the full runtime smoke test after changes that touch service wiring:

```bash
make up
curl http://localhost:3001/api/test
```

Then upload a sample from `data/samples/`.

## Code Style

Frontend:

- Use TypeScript and explicit interfaces for component props.
- Prefer existing UI primitives in `frontend/src/components/ui/`.
- Keep routes in the Next.js App Router under `frontend/src/app/`.
- Keep API URLs easy to find if they remain hard-coded.

Backend:

- Keep Express routes small and test orchestration helpers where possible.
- Preserve the direct report fallback unless replacing it with an equally reliable path.
- Keep Elasticsearch field names aligned with `backend/logstash/TEAM_HANDOFF.md`.

Logstash/Elasticsearch:

- Treat Logstash-normalized event documents as the search and dashboard source of truth.
- Update `backend/logstash/TEAM_HANDOFF.md` whenever normalized fields change.
- Keep the default index aligned across `.env.example`, Logstash, and backend code.

Docs:

- Update `README.md` for startup changes.
- Update `DETAILS.md` for architecture or workflow changes.
- Update module READMEs when behavior changes inside that module.
