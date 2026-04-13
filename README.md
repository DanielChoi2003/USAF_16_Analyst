# Analyst Copilot

Analyst Copilot is a USAF 16th Air Force cyber analyst prototype that turns uploaded JSON alert packages into draft incident reports. The current system combines Logstash normalization, Elasticsearch retrieval, direct LLM reporting, and a frontend upload workflow so the app can return an answer for every upload.

## What The Project Does

This project is built around a simple analyst workflow:

1. Upload a JSON package in the frontend.
2. Normalize package data with the ELK stack components.
3. Retrieve matching normalized events from Elasticsearch when they exist.
4. Generate a SOC-style report with the LLM.
5. View the report in the frontend.
6. Use Kibana separately for visualization over the same Elasticsearch index.

The current runtime path is:

```text
JSON Upload
  -> Backend
  -> Elasticsearch lookup for normalized events
  -> Direct LLM report generation
  -> Frontend result
```

If matching normalized events are not found in Elasticsearch, the backend falls back to the uploaded JSON and still returns a report.

## Current Architecture

- `frontend/`
  Next.js upload UI and results display
- `backend/`
  Express backend that handles upload analysis, MISP enrichment hooks, and Elasticsearch retrieval
- `backend/logstash/`
  Logstash pipeline that converts package JSON into normalized event documents
- `backend/elasticsearch/`
  Elasticsearch setup and helper scripts
- `rag/`
  LLM and Neo4j-related code, including optional LightRAG components
- `data/samples/`
  Sample JSON packages for testing

## Important Runtime Notes

- The app is designed to return a report every time a JSON file is uploaded.
- Elasticsearch retrieval is used when matching normalized events are available.
- Raw upload fallback is used when Elasticsearch does not have matching events.
- Full `instantiate_rag.py` is not required for the main demo flow.
- Neo4j and the `rag/` code are still present, but the primary working path is Elasticsearch plus direct LLM fallback.

## Prerequisites

- Node.js `18+`
- npm `9+`
- Python `3.10+`
- Docker Desktop
- Ollama

Recommended Ollama models:

- `gemma3:latest`
- `mxbai-embed-large:latest`

## Environment Setup

Create a root [`.env`](/Users/connor/Downloads/USAF_16_Analyst/.env) file if it does not already exist.

At minimum, make sure it contains the Elasticsearch values used by the project:

```env
ELASTIC_URL="https://localhost:9200"
ELASTICSEARCH_URL="https://localhost:9200"
ELASTIC_USERNAME="elastic"
ELASTICSEARCH_USERNAME="elastic"
ELASTIC_PASSWORD="-xYdKAUIMz2fsJbJxHg5"
ELASTIC_INDEX_NAME="investigation-events"
ELASTICSEARCH_INDEX="investigation-events"
```

For the `rag/` components, the project also expects Neo4j and model settings. These are the local values that have worked in this repo:

```env
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="password"
CHUNK_SIZE=256
CHUNK_OVERLAP=32
MAX_EMBED_TOKENS=512
TIMEOUT=300
LLM_MODEL=gemma3:latest
EMBEDDING_MODEL=mxbai-embed-large:latest
EMBEDDING_FUNC_MAX_ASYNC=4
```

Important:

- use `bolt://localhost:7687`
- do not use `neo4j://localhost:7687` for this local setup

## First-Time Setup

### 1. Create the Python virtual environment

```bash
cd rag
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install lightrag-hku neo4j python-dotenv ollama pymisp
cd ..
```

`pymisp` is needed because the backend calls `misp-docker/misp.py` through this Python environment.

### 2. Install frontend and backend dependencies

```bash
cd backend
npm install

cd ../frontend
npm install

cd ..
```

The upload UI depends on `react-dropzone`, which is already listed in [frontend/package.json](/Users/connor/Downloads/USAF_16_Analyst/frontend/package.json). A normal `npm install` in `frontend/` should install it automatically.

### 3. Pull required Ollama models

```bash
ollama pull gemma3:latest
ollama pull mxbai-embed-large:latest
```

### 4. Optional Neo4j graph load

If you want the lightweight Neo4j population path instead of the long `instantiate_rag.py` flow:

```bash
cd rag
./venv/bin/python populate_neo4j.py
```

This is optional for the main Elasticsearch plus fallback demo path.

Expected result:

- `22` nodes upserted
- `17` edges upserted

## One-Command Run

From the repository root:

```bash
make up
```

The project now includes a root automation entrypoint for startup, shutdown, and status checks through [Makefile](/Users/connor/Downloads/USAF_16_Analyst/Makefile) and [scripts/project.sh](/Users/connor/Downloads/USAF_16_Analyst/scripts/project.sh).

Available automation commands:

- `make up`
- `make down`
- `make status`

This automation does the following:

- open Docker Desktop if it is not already running
- start or create Elasticsearch
- start Neo4j
- start Kibana against the same Elasticsearch instance
- start Logstash and ingest the sample JSON packages
- start Ollama if needed
- start the backend on port `3001`
- start the frontend on port `3000`
- open the app and Kibana in your browser

### URLs

- Frontend upload page: [http://localhost:3000/upload](http://localhost:3000/upload)
- Backend health route: [http://localhost:3001/api/test](http://localhost:3001/api/test)
- Neo4j Browser: [http://localhost:7474](http://localhost:7474)
- Kibana: [http://localhost:5601](http://localhost:5601)
- Elasticsearch: [https://localhost:9200](https://localhost:9200)

### Check status

```bash
make status
```

### Stop everything

```bash
make down
```

`make down` stops:

- frontend
- backend
- local `ollama serve`
- Kibana
- Logstash
- Neo4j
- Elasticsearch

## Manual Run Option

If you need to run pieces manually, this is the current working order.

### Start Ollama

```bash
ollama serve
```

### Start backend

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/backend
PYTHON_PATH=/Users/connor/Downloads/USAF_16_Analyst/rag/venv/bin/python node index.js
```

Expected:

```text
app listening at http://localhost:3001
```

### Start frontend

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/frontend
npm run dev
```

Expected:

```text
Local: http://localhost:3000
Ready
```

## Logstash And Elasticsearch Flow

The sample ingest pipeline lives in [backend/logstash/](/Users/connor/Downloads/USAF_16_Analyst/backend/logstash/).

It currently:

- reads JSON packages from [data/samples/](/Users/connor/Downloads/USAF_16_Analyst/data/samples/)
- splits each package into event-level records
- normalizes fields into a consistent schema
- writes to the `investigation-events` index in Elasticsearch

That normalized event data is what the backend attempts to retrieve before it calls the LLM.

## Analysis Behavior

When a user uploads a JSON package:

1. The frontend sends the package to the backend.
2. The backend optionally runs MISP enrichment if available.
3. The backend looks for normalized events in Elasticsearch.
4. If matching events are found, the backend passes that context to the direct LLM report generator.
5. If matching events are not found, the backend uses the uploaded JSON directly.
6. The frontend displays the report either way.

This means the system should always produce an answer, even when the upload does not already exist in Elasticsearch.

## Optional Direct RAG Test

If you want to test `query_rag.py` directly:

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/rag
source venv/bin/activate
python query_rag.py -f ../data/samples/ex1-baseline.json
```

This is optional and not required for the main Elasticsearch plus direct-LLM path.

## Testing With Sample Files

Good test files live in [data/samples/](/Users/connor/Downloads/USAF_16_Analyst/data/samples/).

Examples:

- [ex1-baseline.json](/Users/connor/Downloads/USAF_16_Analyst/data/samples/ex1-baseline.json)
- [ex1-enriched.json](/Users/connor/Downloads/USAF_16_Analyst/data/samples/ex1-enriched.json)
- [ex6-usb-staging.json](/Users/connor/Downloads/USAF_16_Analyst/data/samples/ex6-usb-staging.json)

## Logs And Runtime State

The one-command launcher writes:

- logs to [logs/project/](/Users/connor/Downloads/USAF_16_Analyst/logs/project/)
- runtime PID state to [`.project-state/`](/Users/connor/Downloads/USAF_16_Analyst/.project-state/)

These files are local runtime artifacts and should not be committed.

## Known Limitations

- The report text still needs prompt tightening for stricter MITRE accuracy.
- Logstash currently ingests from the sample-data path, not yet from a live per-upload ingest folder.
- Full LightRAG initialization is too slow for the main workflow and is not required for the current demo path.
- MISP integration depends on a live MISP setup if you want full enrichment.

## MISP Note

The UI and main analysis flow can run without MISP, but `/misp-analyze` still depends on a live MISP API at `https://localhost`.

That means:

- frontend can still run
- backend can still run
- Elasticsearch-backed analysis can still run
- direct fallback reporting can still run
- full MISP enrichment will not work unless MISP is running

## Recommended Team Workflow

For the current deadline path:

1. Use `make up`.
2. Upload sample or new JSON files through the frontend.
3. Let Elasticsearch power retrieval when matching normalized events exist.
4. Rely on direct LLM fallback when retrieval is missing.
5. Open Kibana at [http://localhost:5601](http://localhost:5601), create a data view for `investigation-events`, and use Discover for visualization on top of the same Elasticsearch index.

## Additional Notes

- [backend/logstash/README.md](/Users/connor/Downloads/USAF_16_Analyst/backend/logstash/README.md) covers the Logstash module in more detail.
