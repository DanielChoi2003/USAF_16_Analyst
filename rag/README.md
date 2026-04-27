# RAG And Report Generation

The `rag/` folder contains two related paths:

1. The current direct Ollama report path used by the main app.
2. Optional LightRAG/Neo4j experiments that can still be run manually.

The main demo does not require full LightRAG initialization.

## Current Main Path

The Express backend calls:

- `rag/fallback_report.py`

This script receives a temporary JSON context file containing:

- original uploaded package
- matching Elasticsearch events, when found
- MISP output or warning, when available
- workflow metadata

It then uses the configured Ollama model to produce the analyst report.

Root `.env` controls the model:

```env
LLM_MODEL="gemma3:latest"
EMBEDDING_MODEL="mxbai-embed-large:latest"
USE_RAG_PRIMARY="false"
```

## Setup

From the repo root:

```bash
cd rag
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -e .
./venv/bin/python -m pip install neo4j python-dotenv ollama pymisp
```

Pull the local models:

```bash
ollama pull gemma3:latest
ollama pull mxbai-embed-large:latest
```

## Neo4j

The root launcher starts Neo4j from `rag/docker-compose.yml`.

Manual start:

```bash
cd rag
docker compose up -d
```

Use:

```env
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="password"
```

Neo4j Browser is available at [http://localhost:7474](http://localhost:7474).

## Optional Neo4j Population

For the lightweight graph population path:

```bash
cd rag
./venv/bin/python populate_neo4j.py
```

Expected historical result:

- `22` nodes upserted
- `17` edges upserted

## Optional Direct RAG Query

Only use this when intentionally testing the older RAG path:

```bash
cd rag
source venv/bin/activate
python query_rag.py -f ../data/samples/ex1-baseline.json
```

To make the backend try this before direct fallback:

```env
USE_RAG_PRIMARY="true"
```

Keep `USE_RAG_PRIMARY="false"` for the reliable current demo flow.

## Notes

- `instantiate_rag.py` can be slow and is not needed for the main app.
- `fallback_report.py` is the highest-impact place to improve report quality.
- Keep report headings stable if the frontend parser depends on them.
