#!/bin/bash

# Microfrontend E-commerce Development Startup Script
# This script starts all microfrontends in development mode

echo "🚀 Starting Microfrontend E-commerce Development Environment"
echo "============================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

echo ""
echo "🔧 Installing all microfrontend dependencies..."
npm run install:all

echo ""
echo "🏗️  Building shared package..."
cd shared && npm run build && cd ..

echo ""
echo "🌐 Starting all development servers..."
echo "   - Container (React): http://localhost:3000"
echo "   - Products (Vue.js): http://localhost:3001"
echo "   - Cart (React): http://localhost:3002"
echo "   - Auth (React): http://localhost:3003"
echo ""

# Start all services concurrently
npm run dev

echo ""
echo "🎉 All services started successfully!"
echo "📱 Open http://localhost:3000 to view the application"
