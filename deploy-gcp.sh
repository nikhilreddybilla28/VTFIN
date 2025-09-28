#!/bin/bash

# VTFIN Backend Deployment to Google Cloud Run
# Make sure you have Google Cloud SDK installed and authenticated

set -e  # Exit on any error

# Configuration
PROJECT_ID=${PROJECT_ID:-"vtfin-backend-prod"}
SERVICE_NAME=${SERVICE_NAME:-"vtfin-api"}
REGION=${REGION:-"us-central1"}
IMAGE_NAME=${IMAGE_NAME:-"vtfin-backend"}

echo "🚀 Starting VTFIN Backend Deployment to Google Cloud..."
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🔧 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

# Build and push Docker image using Cloud Build
echo "🏗️  Building Docker image with Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars="ENVIRONMENT=production,PORT=8080"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy to Cloud Run"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your VTFIN backend is now live at:"
echo "   $SERVICE_URL"
echo ""
echo "🔗 API Endpoints available:"
echo "   $SERVICE_URL/health (Health check)"
echo "   $SERVICE_URL/api/auth/login (Authentication)"
echo "   $SERVICE_URL/api/goals (Goals management)"
echo "   $SERVICE_URL/api/transactions (Transactions)"
echo "   $SERVICE_URL/api/analytics/dashboard-data (Analytics)"
echo ""
echo "📝 Next steps:"
echo "1. Test the API endpoints above"
echo "2. Update frontend configuration with this URL:"
echo "   Replace 'https://vtfin-api-[RANDOM-HASH]-uc.a.run.app' with: $SERVICE_URL"
echo "3. Deploy frontend to Vercel"
echo ""
echo "🎉 Happy deploying!"