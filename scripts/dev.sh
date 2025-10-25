#!/bin/bash

echo "🚀 Starting AgentBattles Development Environment"

# Start Docker services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for DB
echo "⏳ Waiting for database..."
sleep 3

# Backend
echo "🐍 Starting Backend..."
cd backend
source .venv/bin/activate 2>/dev/null || python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &

# Celery Worker
celery -A app.agents.scheduler worker --loglevel=info &

# Frontend
echo "⚛️  Starting Frontend..."
cd ../frontend
npm install
npm run dev &

echo "✅ All services started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
