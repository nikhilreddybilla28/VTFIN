# Simple Backend Deployment to GCP
# Uses the lightweight simple_server.py

Write-Host "🌱 Simple Backend Deployment to GCP" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$PROJECT_ID = "gen-lang-client-0377439063"
$REGION = "us-central1"
$SERVICE_NAME = "finquest-simple"

# Enable APIs
Write-Host "🔧 Enabling APIs..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Build simple backend
Write-Host "🔨 Building simple backend..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --file docker/Dockerfile.simple .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Deploy simple backend
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8000 `
    --memory 512Mi `
    --cpu 0.5 `
    --max-instances 5

$BACKEND_URL = gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)"

Write-Host ""
Write-Host "🎉 Simple Backend Deployed!" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 For Vercel Frontend:" -ForegroundColor Yellow
Write-Host "Set REACT_APP_API_URL = $BACKEND_URL"