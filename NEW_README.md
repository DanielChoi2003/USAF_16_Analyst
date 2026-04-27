# Archived RAG Notes

This file is kept only as a historical note from the earlier RAG setup path.

For current setup and startup instructions, use:

- `README.md`
- `DETAILS.md`
- `rag/README.md`

Current defaults:

- Main demo path: Elasticsearch plus direct Ollama report generation.
- Optional RAG path: `rag/query_rag.py`, enabled only when `USE_RAG_PRIMARY="true"`.
- Neo4j URI: `bolt://localhost:7687`.
- Recommended models: `gemma3:latest` and `mxbai-embed-large:latest`.
