# Technical Handoff

This document captures the current state of the prototype so the next semester team can start without reconstructing decisions from the code.

## Current Working Demo

The working demo is an upload-first workflow:

1. Start the stack with `make up`.
2. Open `http://localhost:3000/upload`.
3. Upload one of the JSON files in `data/samples/`.
4. The backend tries MISP enrichment, searches Elasticsearch for Logstash-normalized events, and generates a report with Ollama.
5. The report is saved under `analysis_results/` and displayed at `/analysis/result?id=<id>`.
6. Kibana is available separately at `http://localhost:5601` for Discover and dashboards over the same Elasticsearch index.

The app should return a report even when MISP or Elasticsearch context is missing.

## Service Map

| Area | Current implementation | Main files |
| --- | --- | --- |
| Frontend | Next.js 14 + TypeScript upload/results UI | `frontend/src/app/upload/page.tsx`, `frontend/src/app/analysis/result/page.tsx` |
| Backend | Express API on port 3001 | `backend/index.js` |
| Search | Elasticsearch 8.17.3, index `investigation-events` | `backend/elasticsearch/client.js` |
| Ingest | Logstash 8.17.3 normalizes `data/samples/*.json` | `backend/logstash/pipeline/16af_ingest.conf` |
| Dashboards | Kibana 8.17.3 | `backend/logstash/config/kibana.yml` |
| LLM | Ollama direct report fallback | `rag/fallback_report.py` |
| Optional RAG | LightRAG/Neo4j experiments | `rag/query_rag.py`, `rag/populate_neo4j.py` |
| MISP | Optional enrichment helper | `misp-docker/misp.py` |

## Important Environment Variables

Root `.env` is the main configuration source.

```env
ELASTIC_URL="https://localhost:9200"
ELASTICSEARCH_URL="https://localhost:9200"
ELASTIC_USERNAME="elastic"
ELASTICSEARCH_USERNAME="elastic"
ELASTIC_PASSWORD="replace-me"
ELASTIC_INDEX_NAME="investigation-events"
ELASTICSEARCH_INDEX="investigation-events"
LOGSTASH_INDEX="investigation-events"
LOGSTASH_ENABLE_ES_OUTPUT="true"
ELASTICSEARCH_HOSTS="https://host.docker.internal:9200"

NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="password"

LLM_MODEL="gemma3:latest"
EMBEDDING_MODEL="mxbai-embed-large:latest"
USE_RAG_PRIMARY="false"
```

Use `bolt://localhost:7687` for this local Neo4j setup. Older notes that mention `neo4j://localhost:7687` are stale for this repo.

## Backend API

- `GET /`: simple liveness route.
- `GET /api/test`: JSON health check.
- `POST /misp-analyze`: accepts uploaded package JSON and tries to run `misp-docker/misp.py`.
- `POST /analyze`: accepts `{ misp_output, original_input }`, retrieves matching Elasticsearch events, generates a report, and saves it.
- `GET /results`: lists saved report files.
- `GET /results/:id`: returns one saved report.

The frontend currently calls the backend at `http://localhost:3001`.

## Elasticsearch Matching

`backend/elasticsearch/client.js` searches `ELASTIC_INDEX_NAME` or `ELASTICSEARCH_INDEX`, defaulting to `investigation-events`.

It matches using any available:

- `package_id`
- `alert_id`
- `events[].id`

If no matching event documents are found, the backend builds the LLM context from the raw upload.

## Logstash Contract

The authoritative schema handoff is `backend/logstash/TEAM_HANDOFF.md`.

Current default:

- Input: `data/samples/*.json`
- Output file: `backend/logstash/output/normalized-events.ndjson`
- Elasticsearch index: `investigation-events`

One Elasticsearch document represents one normalized event, not one package.

## Frontend Routes

- `/`: informational landing page that points users to Upload/Results/Kibana.
- `/upload`: main file upload page and recent results list.
- `/analysis/result`: result viewer. Accepts `?id=<result_id>` or falls back to `sessionStorage`.
- `/analysis/index`: older analysis page still present for navigation compatibility.

## Testing And Verification

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

Runtime smoke test:

```bash
make up
curl http://localhost:3001/api/test
```

Then upload `data/samples/ex1-baseline.json` from the UI and confirm a result opens.

## What To Work On Next

Highest-value continuation items:

1. Ingest uploaded files into Logstash/Elasticsearch automatically instead of only ingesting `data/samples/`.
2. Add a Kibana saved-object export or dashboard-as-code so dashboards are reproducible.
3. Tighten `rag/fallback_report.py` prompts for stricter MITRE evidence and fewer unsupported claims.
4. Make MISP optional in the frontend messaging instead of surfacing it as a failure-looking step.
5. Add a backend endpoint that exposes Elasticsearch retrieval diagnostics for a result.
6. Add CI for `backend/npm test`, `frontend/npm run test`, and `frontend/npm run build`.
7. Decide whether LightRAG/Neo4j is part of the product path or an experimental branch.

## Repo Hygiene Notes

- Do not commit `analysis_results/`, `inputs/`, `logs/project/`, `.project-state/`, or generated Logstash output unless intentionally preserving a demo artifact.
- Keep `.env` local. Update `.env.example` when adding required configuration.
- Prefer the root launcher scripts for local demos because they encode the service order and container names.
- The local Kibana anonymous user is a development convenience, not a production security model.
