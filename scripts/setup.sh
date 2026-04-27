#!/bin/bash
# Analyst Copilot initial setup.
# Run from the repository root with: bash scripts/setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Analyst Copilot initial setup"
echo

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

python_bin=""
if command -v python3.11 >/dev/null 2>&1; then
  python_bin="python3.11"
elif command -v python3 >/dev/null 2>&1; then
  python_bin="python3"
else
  echo "Required command not found: python3 or python3.11" >&2
  exit 1
fi

require_command node
require_command npm
require_command docker
require_command ollama

echo "Using Python: $($python_bin --version)"
echo "Using Node: $(node --version)"
echo "Using npm: $(npm --version)"
echo

cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "Edit .env and set ELASTIC_PASSWORD before running make up."
else
  echo ".env already exists"
fi

echo
echo "Installing backend dependencies..."
(
  cd backend
  npm install
)

echo
echo "Installing frontend dependencies..."
(
  cd frontend
  npm install
)

echo
echo "Creating rag/venv and installing Python dependencies..."
(
  cd rag
  if [[ ! -d venv ]]; then
    "$python_bin" -m venv venv
  fi
  ./venv/bin/python -m pip install --upgrade pip
  ./venv/bin/python -m pip install -e .
  ./venv/bin/python -m pip install neo4j python-dotenv ollama pymisp
)

mkdir -p analysis_results inputs logs/project .project-state

echo
echo "Setup complete."
echo
echo "Next steps:"
echo "  1. Run: ollama pull gemma3:latest"
echo "  2. Run: ollama pull mxbai-embed-large:latest"
echo "  3. Check .env, especially ELASTIC_PASSWORD"
echo "  4. Run: make up"
echo "  5. Open: http://localhost:3000/upload"
