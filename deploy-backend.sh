#!/bin/bash

# VTFIN Backend Deployment Script for Google Cloud Platform
# This script deploys the FastAPI backend to Google Cloud Run

# Configuration
PROJECT_ID="vtfin-backend-prod"
SERVICE_NAME="vtfin-api"
REGION="us-central1"
IMAGE_NAME="vtfin-backend"

echo "🚀 Starting VTFIN Backend Deployment to GCP..."

# Step 1: Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Step 2: Build and push Docker image
echo "🏗️ Building Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME

# Step 3: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars="ENVIRONMENT=production"

echo "✅ Deployment completed!"
echo "🌐 Your backend is now available at:"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

echo ""
echo "📝 Next steps:"
echo "1. Note the backend URL above"
echo "2. Update frontend configuration with this URL"
echo "3. Deploy frontend to Vercel"