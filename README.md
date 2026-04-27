# Analyst Copilot

Analyst Copilot is a 16th Air Force cyber analyst prototype. It accepts SIEM-style JSON alert packages, enriches what it can, looks up normalized events in Elasticsearch, and returns a SOC-style draft report through a Next.js upload workflow.

This repository is ready for the next team to continue from the current working path:

```text
JSON upload
  -> Next.js frontend
  -> Express backend
  -> optional MISP enrichment
  -> Elasticsearch lookup against Logstash-normalized events
  -> direct Ollama report generation
  -> saved result in analysis_results/
```

If Elasticsearch does not contain matching normalized events, the backend falls back to the uploaded JSON and still returns a report.

## Start Here

Use this path for a fresh local demo or development machine.

### 1. Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+ or 3.11+
- Docker Desktop
- Ollama
- macOS/Linux shell, WSL, or PowerShell on Windows

Recommended Ollama models:

```bash
ollama pull gemma3:latest
ollama pull mxbai-embed-large:latest
```

### 2. Configure `.env`

Copy the template and set the local Elasticsearch password.

```bash
cp .env.example .env
```

The checked-in launcher expects these values to exist:

```env
ELASTIC_URL="https://localhost:9200"
ELASTICSEARCH_URL="https://localhost:9200"
ELASTIC_USERNAME="elastic"
ELASTICSEARCH_USERNAME="elastic"
ELASTIC_PASSWORD="replace-me"
ELASTIC_INDEX_NAME="investigation-events"
ELASTICSEARCH_INDEX="investigation-events"

NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="password"

LLM_MODEL="gemma3:latest"
EMBEDDING_MODEL="mxbai-embed-large:latest"
USE_RAG_PRIMARY="false"
```

For the current local demo environment, the password previously used was:

```env
ELASTIC_PASSWORD="-xYdKAUIMz2fsJbJxHg5"
```

If you create a new Elasticsearch container with a different password, update `.env` before running the app.

### 3. Install dependencies

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

`pymisp` is required because the Express backend calls `misp-docker/misp.py` through the Python interpreter configured by `PYTHON_PATH`.

### 4. Start everything

From the repository root:

```bash
make up
```

This starts or creates:

- Elasticsearch on `https://localhost:9200`
- Neo4j on `http://localhost:7474`
- Kibana on `http://localhost:5601`
- Logstash sample ingest into `investigation-events`
- Ollama on `http://localhost:11434`
- Express backend on `http://localhost:3001`
- Next.js frontend on `http://localhost:3000`

Open the upload workflow at:

- [http://localhost:3000/upload](http://localhost:3000/upload)

Useful health checks:

- Backend: [http://localhost:3001/api/test](http://localhost:3001/api/test)
- Kibana: [http://localhost:5601](http://localhost:5601)
- Neo4j Browser: [http://localhost:7474](http://localhost:7474)
- Elasticsearch: [https://localhost:9200](https://localhost:9200)

### 5. Stop or check status

```bash
make status
make down
```

Runtime logs are written to `logs/project/`. PID state is written to `.project-state/`. Both are local runtime artifacts.

## Windows Startup

Use the Windows launcher when running without WSL.

With GNU Make:

```powershell
make -f Makefile.windows up
make -f Makefile.windows status
make -f Makefile.windows down
```

Without GNU Make:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\project.ps1 up
powershell -ExecutionPolicy Bypass -File .\scripts\project.ps1 status
powershell -ExecutionPolicy Bypass -File .\scripts\project.ps1 down
```

The Windows launcher expects Docker Desktop, PowerShell, `curl.exe`, `npm`, `ollama`, and a Python interpreter at `rag\venv\Scripts\python.exe` or `PYTHON_PATH`.

## Manual Startup

Use this when debugging one service at a time.

```bash
# Terminal 1
ollama serve

# Terminal 2
cd backend
PYTHON_PATH=../rag/venv/bin/python npm run start

# Terminal 3
cd frontend
npm run dev
```

For Logstash/Kibana ingest:

```bash
cd backend/logstash
docker compose up -d kibana logstash
```

For Neo4j only:

```bash
cd rag
docker compose up -d
```

## Current Architecture

- `frontend/`: Next.js 14 upload UI, recent results list, and result viewer.
- `backend/`: Express API for `/misp-analyze`, `/analyze`, `/results`, and `/api/test`.
- `backend/elasticsearch/`: Elasticsearch client and helper scripts.
- `backend/logstash/`: Logstash pipeline, Kibana config, and ELK handoff docs.
- `rag/`: Ollama report generation, optional LightRAG/Neo4j code, and direct RAG test scripts.
- `data/samples/`: SIEM-style JSON packages for testing and Logstash ingest.
- `misp-docker/`: MISP container assets and `misp.py` helper used by the backend.

## Main Workflow

1. Upload a JSON package at `/upload`.
2. The frontend posts the file to `/misp-analyze`.
3. If MISP is unavailable, the backend returns a warning and continues.
4. The frontend posts original input plus MISP output to `/analyze`.
5. The backend searches Elasticsearch index `investigation-events` for matching `package_id`, `alert_id`, or event IDs.
6. The backend calls `rag/fallback_report.py` for direct Ollama report generation.
7. The backend saves the report in `analysis_results/`.
8. The frontend opens `/analysis/result?id=<result_id>`.

Set `USE_RAG_PRIMARY="true"` only if you intentionally want to try `rag/query_rag.py` before the direct report fallback.

## Sample Files

Good upload and ingest samples live in `data/samples/`:

- `ex1-baseline.json`
- `ex1-enriched.json`
- `ex2-scheduled-task.json`
- `ex3-registry-persistence.json`
- `ex4-powershell-c2.json`
- `ex5-rdp-bruteforce.json`
- `ex6-usb-staging.json`
- `ex7-adcs-domain-compromise.json`
- `ex8-dns-tunneling.json`

## Kibana

The Logstash pipeline writes normalized event documents to Elasticsearch index `investigation-events` by default.

In Kibana, create a data view:

- Index pattern: `investigation-events`
- Time field: `@timestamp`

Useful fields for Discover and dashboards:

- `severity`
- `event.category`
- `event.subtype`
- `event.action`
- `host.name`
- `host.ip`
- `user.name`
- `process.cmdline`
- `enrichment.misp_match_count`

## Tests

```bash
cd backend
npm test

cd ../frontend
npm run test
npm run build
```

There is no root `make test` target at the moment.

## Known Limitations

- MISP enrichment requires a live MISP API at `https://localhost`; the main report flow continues without it.
- Logstash currently ingests from `data/samples/`, not from each uploaded file.
- Full LightRAG initialization is not required for the current demo and can be slow.
- Report quality depends on local Ollama model availability and prompt tuning in `rag/fallback_report.py`.
- The Kibana anonymous user created by the launcher is for local demo convenience only.

## Handoff Documents

- `DETAILS.md`: fuller technical handoff and next-semester checklist.
- `backend/logstash/README.md`: Logstash module usage.
- `backend/logstash/TEAM_HANDOFF.md`: normalized event schema contract for Elasticsearch/Kibana work.
- `frontend/README.md`: current frontend structure and routes.
- `rag/README.md`: optional RAG and Neo4j notes.
- `CONTRIBUTING.md`: development workflow and conventions.
