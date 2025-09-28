# FinQuest GCP Deployment Script
# PowerShell script to deploy FinQuest to Google Cloud Platform

Write-Host "🚀 FinQuest GCP Deployment Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Set project variables
$PROJECT_ID = "gen-lang-client-0377439063"
$REGION = "us-central1"
$BACKEND_SERVICE = "finquest-backend"
$FRONTEND_SERVICE = "finquest-frontend"

Write-Host "📋 Project Configuration:" -ForegroundColor Yellow
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Region: $REGION"
Write-Host ""

# Check if user is authenticated
Write-Host "🔐 Checking authentication..." -ForegroundColor Cyan
$authCheck = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
if (-not $authCheck) {
    Write-Host "❌ Not authenticated. Please run: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated as: $authCheck" -ForegroundColor Green

# Set the project
Write-Host "🎯 Setting project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Cyan
Write-Host "Note: This requires billing to be enabled on your project" -ForegroundColor Yellow
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable APIs. Please ensure billing is enabled:" -ForegroundColor Red
    Write-Host "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After enabling billing, run this script again." -ForegroundColor Yellow
    exit 1
}

# Build and deploy backend
Write-Host "🔨 Building backend container..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE --file docker/Dockerfile.backend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

# Deploy backend to Cloud Run
Write-Host "🚀 Deploying backend to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $BACKEND_SERVICE `
    --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8000 `
    --memory 1Gi `
    --cpu 1 `
    --max-instances 10 `
    --set-env-vars "FIREBASE_PROJECT_ID=$PROJECT_ID" `
    --set-env-vars "PLAID_CLIENT_ID=68d7732f1059f3002356b0ff" `
    --set-env-vars "PLAID_SECRET=21ce3b9e390661c338e520d82049d4" `
    --set-env-vars "PLAID_ENV=sandbox" `
    --set-env-vars "GEMINI_API_KEY=AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI" `
    --set-env-vars "SECRET_KEY=finquest-secret-key-2024-very-secure"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Get backend URL
$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --platform=managed --region=$REGION --format="value(status.url)"
Write-Host "✅ Backend deployed at: $BACKEND_URL" -ForegroundColor Green

# Build frontend with backend URL
Write-Host "🔨 Building frontend container..." -ForegroundColor Cyan
# Update frontend environment to point to deployed backend
$env:REACT_APP_API_URL = $BACKEND_URL
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE --file docker/Dockerfile.frontend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Deploy frontend to Cloud Run
Write-Host "🚀 Deploying frontend to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $FRONTEND_SERVICE `
    --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 80 `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 5 `
    --set-env-vars "REACT_APP_API_URL=$BACKEND_URL"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Get frontend URL
$FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --platform=managed --region=$REGION --format="value(status.url)"

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend:  $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌟 Your FinQuest app is now live!" -ForegroundColor Yellow