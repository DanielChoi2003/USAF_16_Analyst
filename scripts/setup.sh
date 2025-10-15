#!/bin/bash
# ============================================================================
# Analyst Copilot — Initial Setup Script
# ============================================================================
# This script sets up the development environment for both frontend and backend
# Note AI was used to help generate the sh files
# Run: bash scripts/setup.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Analyst Copilot — Initial Setup"
echo "===================================="
echo ""

# ── Check Prerequisites ─────────────────────────────────────────────────────

echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3.11 &> /dev/null; then
    echo "❌ Python 3.11+ not found. Please install Python 3.11 or higher."
    exit 1
fi
echo "✅ Python $(python3.11 --version) found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18.17 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi
echo "✅ npm $(npm --version) found"

echo ""

# ── Backend Setup ───────────────────────────────────────────────────────────

echo "🐍 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "  Upgrading pip..."
pip install --upgrade pip > /dev/null

# Install dependencies
echo "  Installing Python dependencies..."
pip install -r requirements.txt > /dev/null
pip install -r requirements-dev.txt > /dev/null
echo "✅ Backend dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env and add your OPENAI_API_KEY"
else
    echo "✅ .env file already exists"
fi

cd ..
echo ""

# ── Frontend Setup ──────────────────────────────────────────────────────────

echo "⚛️  Setting up frontend..."
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install > /dev/null
    echo "✅ Frontend dependencies installed"
else
    echo "✅ node_modules already exists (run 'npm install' to update)"
fi

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "  Creating .env.local file from template..."
    cp .env.local.example .env.local
    echo "✅ .env.local created (edit if needed)"
else
    echo "✅ .env.local file already exists"
fi

cd ..
echo ""

# ── Create Missing Directories ─────────────────────────────────────────────

echo "📁 Creating missing directories..."
mkdir -p backend/logs
mkdir -p backend/tests
mkdir -p data/mitre/json_exports
mkdir -p docs/architecture
mkdir -p docs/dev-guides
mkdir -p docs/user-guides
echo "✅ Directories created"
echo ""

# ── Final Instructions ──────────────────────────────────────────────────────

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env and add your OPENAI_API_KEY"
echo "  2. Run 'make dev' to start both frontend and backend"
echo "  3. Visit http://localhost:3000 (frontend) and http://localhost:8000/api/docs (backend)"
echo ""
echo "Optional:"
echo "  - Run 'make sync-mitre' to fetch MITRE ATT&CK data"
echo "  - Run 'make seed' to load sample packages"
echo ""
echo "📚 See README.md for more information"
