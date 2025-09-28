#!/bin/bash

# VTFIN Frontend Deployment Script for Vercel
echo "🚀 Starting VTFIN Frontend Deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Ensuring Vercel authentication..."
vercel whoami || vercel login

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Note the frontend URL provided by Vercel"
echo "2. Update the backend CORS settings if needed"
echo "3. Test the full application end-to-end"