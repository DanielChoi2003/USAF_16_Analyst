# analyst-copilot
Fall 2025 Capstone (Kumar) partnership with 16th USAF

# Project Setup and Usage

This guide provides the necessary steps to set up the project environment, configure the required services, and run the RAG instantiation script.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

  * **Python** (version 3.10 or higher)
  * **Docker**
  * **Ollama**

-----

## Setup Instructions

Follow these steps to get your environment ready.

### 1\. Set Up the Python Environment

First, create and activate a Python virtual environment. This isolates the project's dependencies.

```bash
# Create a virtual environment named 'venv'
python3 -m venv venv

# Activate the virtual environment
# On macOS and Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

Next, install the project dependencies in editable mode.

```bash
# Install dependencies from setup.py
pip install -e .
```

-----

### 2\. Configure Ollama

You'll need to pull the required LLM and embedding models using Ollama.

```bash
# Pull the Qwen2 language model
ollama pull qwen2

# Pull the Nomic embedding model
ollama pull nomic-embed-text
```

-----

### 3\. Set Up and Run Neo4j

This project uses a Neo4j database running in a Docker container.

First, export the environment variable for the Neo4j connection URI.

```bash
# Set the Neo4j URI
export NEO4J_URI="neo4j://localhost:7687"
```

**Note:** You may want to add this line to your shell configuration file (e.g., `.bashrc`, `.zshrc`) to make it permanent.

Next, run the Neo4j Docker container. This command maps the necessary ports, mounts a volume for data persistence, and disables authentication.

```bash
# Run the Neo4j container
docker run \
    --publish=7474:7474 --publish=7687:7687 \
    --volume=$HOME/neo4j/data:/data \
    --env NEO4J_AUTH=none \
    neo4j
```

You can access the Neo4j Browser UI at `http://localhost:7474`.

-----

## Running the RAG Instantiation

Once all the services are running and the environment is set up, you can run the script to train the RAG model on the MITRE data.

```bash
# Execute the script
python instantiate_rag.py
```