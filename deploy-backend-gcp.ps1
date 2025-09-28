# Backend-only GCP Deployment Script
# Deploy just the backend to Google Cloud Run

Write-Host "🚀 FinQuest Backend Deployment to GCP" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Set project variables
$PROJECT_ID = "gen-lang-client-0377439063"
$REGION = "us-central1"
$BACKEND_SERVICE = "finquest-backend"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Region: $REGION"
Write-Host "Service: $BACKEND_SERVICE"
Write-Host ""

# Check authentication
Write-Host "🔐 Checking authentication..." -ForegroundColor Cyan
$authCheck = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
if (-not $authCheck) {
    Write-Host "❌ Not authenticated. Please run: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated as: $authCheck" -ForegroundColor Green

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable APIs. Please ensure billing is enabled:" -ForegroundColor Red
    Write-Host "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

# Build backend container
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
    --set-env-vars "SECRET_KEY=finquest-secret-key-2024-very-secure" `
    --set-env-vars "ALLOWED_ORIGINS=https://finquest.vercel.app,https://finquest-git-main.vercel.app,https://finquest-moksh.vercel.app"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Get backend URL
$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --platform=managed --region=$REGION --format="value(status.url)"

Write-Host ""
Write-Host "🎉 Backend Deployment Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps for Vercel Frontend:" -ForegroundColor Yellow
Write-Host "1. Push your code to GitHub"
Write-Host "2. Connect GitHub repo to Vercel"
Write-Host "3. Set environment variable in Vercel:"
Write-Host "   REACT_APP_API_URL = $BACKEND_URL"
Write-Host "4. Deploy frontend to Vercel"
Write-Host ""
Write-Host "🔧 Update frontend/.env with:" -ForegroundColor Cyan
Write-Host "REACT_APP_API_URL=$BACKEND_URL"