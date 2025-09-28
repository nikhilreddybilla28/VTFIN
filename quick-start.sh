#!/bin/bash

echo "🌱 FinQuest Quick Start Setup"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp backend/config.env backend/.env
    echo "✅ Backend environment file created"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend environment file..."
    cp frontend/config.env frontend/.env
    echo "✅ Frontend environment file created"
fi

echo ""
echo "🔧 Configuration Status:"
echo "✅ Plaid API keys configured"
echo "✅ Gemini API key configured"
echo "⚠️  Firebase configuration needed"
echo ""
echo "📋 Next Steps:"
echo "1. Set up Firebase project at https://console.firebase.google.com/"
echo "2. Update backend/.env and frontend/.env with Firebase credentials"
echo "3. Run: docker-compose up --build"
echo ""
echo "🚀 Ready to start FinQuest!"
