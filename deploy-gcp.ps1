# VTFIN Backend Deployment to Google Cloud Run (PowerShell)
# Make sure you have Google Cloud SDK installed and authenticated

param(
    [string]$ProjectId = "vtfin-backend-prod",
    [string]$ServiceName = "vtfin-api",
    [string]$Region = "us-central1",
    [string]$ImageName = "vtfin-backend"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting VTFIN Backend Deployment to Google Cloud..." -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Cyan
Write-Host "Service Name: $ServiceName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Google Cloud SDK is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
if (-not $activeAccount) {
    Write-Host "❌ Not authenticated with Google Cloud. Please run: gcloud auth login" -ForegroundColor Red
    exit 1
}

# Set the project
Write-Host "🔧 Setting project to $ProjectId..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "📋 Enabling required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable APIs" -ForegroundColor Red
    exit 1
}

# Build and push Docker image using Cloud Build
Write-Host "🏗️  Building Docker image with Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag "gcr.io/$ProjectId/$ImageName"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image "gcr.io/$ProjectId/$ImageName" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --memory 1Gi `
    --cpu 1 `
    --max-instances 10 `
    --min-instances 0 `
    --concurrency 80 `
    --timeout 300 `
    --set-env-vars="ENVIRONMENT=production,PORT=8080"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy to Cloud Run" -ForegroundColor Red
    exit 1
}

# Get the service URL
$ServiceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your VTFIN backend is now live at:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔗 API Endpoints available:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl/health (Health check)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/auth/login (Authentication)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/goals (Goals management)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/transactions (Transactions)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/analytics/dashboard-data (Analytics)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the API endpoints above" -ForegroundColor White
Write-Host "2. Update frontend configuration with this URL:" -ForegroundColor White
Write-Host "   Replace the API base URL with: $ServiceUrl" -ForegroundColor White
Write-Host "3. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy deploying!" -ForegroundColor Green

# Optional: Test the health endpoint
Write-Host ""
Write-Host "🔍 Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method Get -TimeoutSec 30
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Health check failed (this might be normal if the service is still starting): $($_.Exception.Message)" -ForegroundColor Yellow
}