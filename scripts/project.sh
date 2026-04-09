#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.project-state"
LOG_DIR="$ROOT_DIR/logs/project"
RAG_DIR="$ROOT_DIR/rag"
LOGSTASH_DIR="$ROOT_DIR/backend/logstash"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"
OLLAMA_PID_FILE="$STATE_DIR/ollama.pid"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
OLLAMA_LOG="$LOG_DIR/ollama.log"
LOGSTASH_LOG="$LOG_DIR/logstash.log"
ELASTIC_CONTAINER_NAME="analyst-copilot-elasticsearch"
ELASTIC_IMAGE="docker.elastic.co/elasticsearch/elasticsearch:8.17.3"

mkdir -p "$STATE_DIR" "$LOG_DIR"

wait_for_http() {
  local url="$1"
  local name="$2"
  local attempts="${3:-60}"
  local delay="${4:-2}"

  for ((i=1; i<=attempts; i++)); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      echo "$name is ready at $url"
      return 0
    fi
    sleep "$delay"
  done

  echo "Timed out waiting for $name at $url" >&2
  return 1
}

wait_for_elasticsearch() {
  local attempts="${1:-60}"
  local delay="${2:-2}"

  for ((i=1; i<=attempts; i++)); do
    if curl -sk -u "${ELASTIC_USERNAME:-elastic}:${ELASTIC_PASSWORD:-}" "${ELASTIC_URL:-https://127.0.0.1:9200}" >/dev/null 2>&1; then
      echo "Elasticsearch is ready"
      return 0
    fi
    sleep "$delay"
  done

  echo "Timed out waiting for Elasticsearch" >&2
  return 1
}

load_env() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  fi
}

docker_ready() {
  docker ps >/dev/null 2>&1
}

ensure_docker() {
  if docker_ready; then
    return 0
  fi

  echo "Starting Docker Desktop..."
  open -a Docker >/dev/null 2>&1 || true

  for ((i=1; i<=90; i++)); do
    if docker_ready; then
      echo "Docker Desktop is ready"
      return 0
    fi
    sleep 2
  done

  echo "Docker Desktop did not become ready in time" >&2
  return 1
}

start_container_if_needed() {
  local name="$1"
  if docker ps --format '{{.Names}}' | grep -qx "$name"; then
    echo "$name is already running"
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    echo "Starting existing container $name"
    docker start "$name" >/dev/null
    return 0
  fi

  echo "Container $name does not exist" >&2
  return 1
}

ensure_elasticsearch_container() {
  if docker ps -a --format '{{.Names}}' | grep -qx "$ELASTIC_CONTAINER_NAME"; then
    start_container_if_needed "$ELASTIC_CONTAINER_NAME"
    return 0
  fi

  echo "Creating Elasticsearch container..."
  docker run -d \
    --name "$ELASTIC_CONTAINER_NAME" \
    -p 9200:9200 \
    -p 9300:9300 \
    -e "discovery.type=single-node" \
    -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
    -e "ELASTIC_PASSWORD=${ELASTIC_PASSWORD:-}" \
    "$ELASTIC_IMAGE" >/dev/null
}

ensure_neo4j() {
  if docker ps --format '{{.Names}}' | grep -Eq '^(rag-neo4j-1|usa16-neo4j)$'; then
    echo "Neo4j is already running"
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx 'rag-neo4j-1'; then
    echo "Starting existing Neo4j container rag-neo4j-1"
    docker start rag-neo4j-1 >/dev/null
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx 'usa16-neo4j'; then
    echo "Starting existing Neo4j container usa16-neo4j"
    docker start usa16-neo4j >/dev/null
    return 0
  fi

  echo "Creating Neo4j container from rag/docker-compose.yml..."
  (
    cd "$RAG_DIR"
    docker compose up -d >/dev/null
  )
}

start_ollama_if_needed() {
  if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "Ollama is already running"
    return 0
  fi

  echo "Starting Ollama..."
  nohup ollama serve >"$OLLAMA_LOG" 2>&1 &
  echo $! >"$OLLAMA_PID_FILE"
  wait_for_http "http://127.0.0.1:11434/api/tags" "Ollama" 45 2
}

pid_is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1
}

start_backend_if_needed() {
  if lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Backend is already running on port 3001"
    return 0
  fi

  echo "Starting backend..."
  (
    cd "$BACKEND_DIR"
    nohup env PYTHON_PATH="${PYTHON_PATH:-$ROOT_DIR/rag/venv/bin/python}" npm run start >"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )
  wait_for_http "http://127.0.0.1:3001/" "Backend" 45 2
}

start_frontend_if_needed() {
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Frontend is already running on port 3000"
    return 0
  fi

  echo "Starting frontend..."
  (
    cd "$FRONTEND_DIR"
    nohup npm run dev >"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )
  wait_for_http "http://127.0.0.1:3000" "Frontend" 60 2
}

run_logstash_ingest() {
  echo "Running Logstash ingest..."
  (
    cd "$LOGSTASH_DIR"
    docker compose up -d --force-recreate >"$LOGSTASH_LOG" 2>&1
  )
}

open_project_urls() {
  open "http://localhost:3000/upload" >/dev/null 2>&1 || true
  open "http://localhost:3001/" >/dev/null 2>&1 || true
}

stop_pid_file() {
  local pid_file="$1"
  local name="$2"

  if pid_is_running "$pid_file"; then
    echo "Stopping $name"
    kill "$(cat "$pid_file")" >/dev/null 2>&1 || true
  fi

  rm -f "$pid_file"
}

stop_backend() {
  stop_pid_file "$BACKEND_PID_FILE" "backend"
  pkill -f 'node index.js' >/dev/null 2>&1 || true
}

stop_frontend() {
  stop_pid_file "$FRONTEND_PID_FILE" "frontend"
  pkill -f 'next dev' >/dev/null 2>&1 || true
}

stop_ollama_if_managed() {
  if pid_is_running "$OLLAMA_PID_FILE"; then
    echo "Stopping Ollama started by project launcher"
    kill "$(cat "$OLLAMA_PID_FILE")" >/dev/null 2>&1 || true
  fi

  if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "Stopping local Ollama server"
  fi
  pkill -f 'ollama serve' >/dev/null 2>&1 || true

  rm -f "$OLLAMA_PID_FILE"
}

stop_containers() {
  docker stop analyst-copilot-logstash >/dev/null 2>&1 || true
  docker stop rag-neo4j-1 >/dev/null 2>&1 || true
  docker stop usa16-neo4j >/dev/null 2>&1 || true
  docker stop "$ELASTIC_CONTAINER_NAME" >/dev/null 2>&1 || true
}

status() {
  echo "Project status"
  echo "Backend port 3001: $(lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1 && echo up || echo down)"
  echo "Frontend port 3000: $(lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1 && echo up || echo down)"
  echo "Ollama port 11434: $(curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && echo up || echo down)"
  if docker_ready; then
    echo "Docker containers:"
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  else
    echo "Docker: down"
  fi
}

up() {
  load_env
  ensure_docker
  ensure_elasticsearch_container
  ensure_neo4j
  wait_for_elasticsearch 60 2
  wait_for_http "http://127.0.0.1:7474" "Neo4j" 60 2
  start_ollama_if_needed
  run_logstash_ingest
  start_backend_if_needed
  start_frontend_if_needed
  open_project_urls

  echo
  echo "Project is running"
  echo "Frontend: http://localhost:3000/upload"
  echo "Backend:  http://localhost:3001/"
  echo "Neo4j:    http://localhost:7474"
}

down() {
  stop_frontend
  stop_backend
  stop_ollama_if_managed
  stop_containers
  echo "Project services stopped"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  status) status ;;
  *)
    echo "Usage: ./scripts/project.sh {up|down|status}" >&2
    exit 1
    ;;
esac
