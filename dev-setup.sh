#!/bin/bash

# Tiny World Builder — Development Setup
# This script starts both the frontend dev server and backend API server

set -e

echo "🌍 Tiny World Builder — Development Server"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Creating from .env.example..."
  cp .env.example .env.local
  echo "📝 Please edit .env.local and add your Clerk credentials"
  echo ""
fi

# Load environment variables
if [ -f ".env.local" ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check Clerk credentials
if [ -z "$CLERK_PUBLISHABLE_KEY" ]; then
  echo "⚠️  CLERK_PUBLISHABLE_KEY not set in .env.local"
  echo "Get it from: https://dashboard.clerk.com → API Keys"
  echo ""
fi

if [ -z "$CLERK_SECRET_KEY" ]; then
  echo "⚠️  CLERK_SECRET_KEY not set in .env.local"
  echo "Get it from: https://dashboard.clerk.com → API Keys"
  echo ""
fi

# Start frontend dev server in background
echo "🚀 Starting frontend dev server on port 3000..."
npm run dev &
FRONTEND_PID=$!

# Give frontend time to start
sleep 2

# Start backend server in background (if needed)
if [ -f "backend/package.json" ]; then
  echo "🚀 Starting backend server on port 3001..."
  cd backend
  npm start &
  BACKEND_PID=$!
  cd ..
fi

echo ""
echo "✅ Servers started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for interruption
wait

# Cleanup
echo ""
echo "🛑 Stopping servers..."
kill $FRONTEND_PID 2>/dev/null || true
[ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
echo "✅ All servers stopped"
