#!/bin/bash

# Beatzy Development Server Startup Script
# This script ensures clean startup of both backend and frontend servers

echo "🎵 Starting Beatzy Development Environment..."
echo ""

# Kill any existing processes on ports 3001 and 5173
echo "🧹 Cleaning up existing processes..."
fuser -k 3001/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
sleep 2

# Start backend
echo ""
echo "🚀 Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend
echo ""
echo "🚀 Starting frontend server on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Backend:  http://localhost:3001"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "💡 To stop servers, press Ctrl+C"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
