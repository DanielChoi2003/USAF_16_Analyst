
1. Installing dependencies

Install python 3.11

```bash
python3.11 -m venv venv
source venv/bin/activate to start python virtual environment
pip install lightrag-hku
```

Create a .env file in rag/
Not sure if it necessary to have more than the NEO4J username and password, but just in case
```bash
NEO4J_URI="neo4j://localhost:7687"
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

Pull Neo4j docker image
```bash
docker pull nicktnc24/neo4j:latest
```
Download json files and store them in /rag/rag_data

Ensure that you have the docker container running. it takes some time to start.
run populate_neo4j.py
```bash
cd rag
python3 populate_neo4j.py
```
You can access the Neo4j Browser UI at `http://localhost:7474` to check if the database has been populated.

Testing:
```bash
in rag/ directory
python3 query_rag.py -f ../data/samples/ex1-baseline.json
```

NOTE: I reduced the token context window size to 8K, so it could lead to a cutoff, meaning that Ollama won't receive all data and may give an answer that is not based on all given data. But I have yet to test if this is true.

