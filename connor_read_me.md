# Connor Read Me

This file covers both:

1. first-time setup from a fresh clone
2. normal day-to-day startup after setup is already done

These steps are based on `NEW_README.md` plus the fixes that were required to make the project actually run.

## Environment

- Python `3.10+` works
- Python `3.12` was used successfully
- Docker Desktop is required
- Ollama is required
- Node and npm are required for the UI

## Part 1: First-Time Setup From Clone

## 1. Clone and enter repo

```bash
git clone https://github.com/DanielChoi2003/USAF_16_Analyst
cd USAF_16_Analyst
```

## 2. Create the Python environment

```bash
cd rag
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install lightrag-hku neo4j python-dotenv ollama pymisp
cd ..
```

Note:
- `pymisp` is needed because the backend calls `misp-docker/misp.py` using this same venv

## 3. Create env files

Create both:

- `rag/.env`
- `.env` in the repo root

Put this in both files:

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

Reason:
- `neo4j://` caused routing errors
- `bolt://` worked correctly with the local single-node container

## 4. Start Neo4j

```bash
docker pull nicktnc24/neo4j:latest
docker rm -f usa16-neo4j 2>/dev/null || true
docker run -d --name usa16-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  nicktnc24/neo4j:latest
```

Optional check:

```bash
docker logs --tail 50 usa16-neo4j
```

## 5. Start Ollama and verify models

Open a new terminal for Ollama.

```bash
ollama serve
```

Open another new terminal to check models:

```bash
ollama list
```

Required models:
- `gemma3:latest`
- `mxbai-embed-large:latest`

If missing:

```bash
ollama pull gemma3:latest
ollama pull mxbai-embed-large:latest
```

## 6. Populate the graph

```bash
cd rag
source venv/bin/activate
python populate_neo4j.py
```

Expected:
- `22` nodes upserted
- `17` edges upserted

## 7. Test the RAG pipeline

```bash
cd rag
source venv/bin/activate
python query_rag.py -f ../data/samples/ex1-baseline.json
```

Expected:
- generated report text
- not `None`

## 8. Install frontend and backend dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
npm install react-dropzone

cd ..
```

Note:
- `react-dropzone` was missing and caused the upload page to fail until it was installed

## Part 2: How To Run After Setup Is Done

These should already exist:

- `rag/venv`
- `rag/.env`
- `.env`
- `backend/node_modules`
- `frontend/node_modules`
- Neo4j image already pulled
- Ollama models already pulled

Use 3 terminals:

- Terminal 1: Neo4j and Ollama
- Terminal 2: backend
- Terminal 3: frontend

## 1. In Terminal 1, start Neo4j

```bash
docker start usa16-neo4j
```

## 2. In Terminal 1, start Ollama

```bash
ollama serve
```

Keep Terminal 1 open. Do not close it while the project is running.

## 3. Open Terminal 2 and start the backend

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/backend
PYTHON_PATH=/Users/connor/Downloads/USAF_16_Analyst/rag/venv/bin/python node index.js
```

Expected:

```text
app listening at http://localhost:3001
```

Keep Terminal 2 open. Do not close it while the backend is running.

## 4. Open Terminal 3 and start the frontend

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/frontend
npm run dev
```

Expected:

```text
Local: http://localhost:3000
Ready
```

Keep Terminal 3 open. Do not close it while the frontend is running.

## 5. Open the app

- UI: [http://localhost:3000](http://localhost:3000)
- Upload page: [http://localhost:3000/upload](http://localhost:3000/upload)
- Backend health: [http://localhost:3001/api/test](http://localhost:3001/api/test)
- Neo4j Browser: [http://localhost:7474](http://localhost:7474)

## Optional direct RAG test

```bash
cd /Users/connor/Downloads/USAF_16_Analyst/rag
source venv/bin/activate
python query_rag.py -f ../data/samples/ex1-baseline.json
```

## Current MISP note

The UI can start without MISP, but `/misp-analyze` still depends on a live MISP API at `https://localhost`.

That means:

- frontend works
- backend works
- direct RAG analysis works
- full upload flow that depends on MISP will fail unless MISP is running

## Shutdown

Clean shutdown:

1. In Terminal 3, press `Ctrl+C` to stop the frontend
2. In Terminal 2, press `Ctrl+C` to stop the backend
3. In Terminal 1, press `Ctrl+C` to stop Ollama
4. In Terminal 1, stop Neo4j:

```bash
docker stop usa16-neo4j
```

If you want to make sure nothing is left running in the background, run this after shutdown:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
lsof -nP -iTCP:7474 -sTCP:LISTEN || true
lsof -nP -iTCP:7687 -sTCP:LISTEN || true
docker ps | grep usa16-neo4j || true
```

Expected:
- no output for the `lsof` checks
- no running `usa16-neo4j` container

Force-stop version if something is still stuck:

```bash
pkill -f "next dev" || true
pkill -f "node index.js" || true
pkill -f "ollama serve" || true
docker stop usa16-neo4j || true
```

Then run the verification block again to confirm there are no background processes still listening.
