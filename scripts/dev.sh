#!/bin/bash
# ============================================================================
# Analyst Copilot — Development Server Launcher
# ============================================================================
# Starts both frontend and backend in parallel with logging
# Note AI was used to help generate the sh files
# Run: bash scripts/dev.sh
# ============================================================================

set -e

echo "🚀 Starting Analyst Copilot development servers..."
echo ""

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true  # Frontend
lsof -ti:8000 | xargs kill -9 2>/dev/null || true  # Backend
echo ""

# Start backend in background
echo "🐍 Starting backend (FastAPI) on http://localhost:8000..."
cd backend
source venv/bin/activate
python src/main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
echo "⚛️  Starting frontend (Next.js) on http://localhost:3000..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "📋 Logs:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "   or press Ctrl+C if running in foreground"

# Save PIDs for cleanup
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# Wait for processes (optional, keeps script running)
wait
