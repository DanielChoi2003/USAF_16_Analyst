# ============================================================================
# Analyst Copilot — Makefile
# ============================================================================
# Common development tasks automation
# Usage: make <target>
# ============================================================================

.PHONY: help setup dev test lint format clean build deploy-staging

# ── Help ────────────────────────────────────────────────────────────────────

help:  ## Show this help message
	@echo "Analyst Copilot — Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ───────────────────────────────────────────────────────────────────

setup:  ## Initial project setup (install deps, create .env files)
	@echo "🔧 Setting up Analyst Copilot..."
	@bash scripts/setup.sh

# ── Development ─────────────────────────────────────────────────────────────

dev:  ## Start full-stack development servers (frontend + backend)
	@echo "🚀 Starting development servers..."
	@bash scripts/dev.sh

dev-backend:  ## Start backend only
	cd backend && source venv/bin/activate && python src/main.py

dev-frontend:  ## Start frontend only
	cd frontend && npm run dev

# ── Testing ─────────────────────────────────────────────────────────────────

test:  ## Run all tests (backend + frontend)
	@echo "🧪 Running tests..."
	@bash scripts/test.sh

test-backend:  ## Run backend tests only
	cd backend && source venv/bin/activate && pytest tests/ --cov=src --cov-report=html

test-frontend:  ## Run frontend tests only
	cd frontend && npm run test

# ── Code Quality ────────────────────────────────────────────────────────────

lint:  ## Lint code (backend + frontend)
	@echo "🔍 Linting code..."
	cd backend && source venv/bin/activate && ruff check src/ tests/
	cd frontend && npm run lint

format:  ## Format code (backend + frontend)
	@echo "✨ Formatting code..."
	cd backend && source venv/bin/activate && ruff format src/ tests/
	cd frontend && npm run format

type-check:  ## Type check code (backend + frontend)
	@echo "📝 Type checking..."
	cd backend && source venv/bin/activate && mypy src/
	cd frontend && npm run type-check

# ── Database ────────────────────────────────────────────────────────────────

seed:  ## Seed database with sample packages
	@echo "🌱 Seeding database..."
	cd backend && source venv/bin/activate && python src/scripts/seed_packages.py

migrate:  ## Run database migrations
	cd backend && source venv/bin/activate && alembic upgrade head

sync-mitre:  ## Sync MITRE ATT&CK data from TAXII server
	@echo "🔄 Syncing MITRE ATT&CK data..."
	cd data/mitre && python sync_mitre.py --update

# ── Build ───────────────────────────────────────────────────────────────────

build:  ## Build production Docker images
	@echo "🏗️  Building Docker images..."
	docker-compose -f docker-compose.prod.yml build

# ── Deployment ──────────────────────────────────────────────────────────────

deploy-staging:  ## Deploy to staging environment
	@echo "🚢 Deploying to staging..."
	@bash scripts/deploy.sh staging

deploy-prod:  ## Deploy to production (requires confirmation)
	@echo "🚢 Deploying to production..."
	@bash scripts/deploy.sh production

# ── Cleanup ─────────────────────────────────────────────────────────────────

clean:  ## Clean build artifacts and caches
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf backend/htmlcov backend/.coverage 2>/dev/null || true
	rm -rf frontend/.turbo 2>/dev/null || true
	@echo "✅ Cleanup complete!"

# ── Documentation ───────────────────────────────────────────────────────────

docs:  ## Generate API documentation
	cd backend && source venv/bin/activate && python -c "from main import app; import json; print(json.dumps(app.openapi(), indent=2))" > ../docs/api/openapi.json
	@echo "📚 API docs generated at docs/api/openapi.json"

# ── Utilities ───────────────────────────────────────────────────────────────

logs-backend:  ## Tail backend logs
	tail -f backend/logs/*.log

logs-frontend:  ## Tail frontend logs
	tail -f frontend/.next/trace

ps:  ## Show running processes
	@echo "Backend:"
	@ps aux | grep "[p]ython src/main.py" || echo "  Not running"
	@echo ""
	@echo "Frontend:"
	@ps aux | grep "[n]ext dev" || echo "  Not running"
