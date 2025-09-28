# Update Existing VTFIN Deployment with Fresh Container
# This script will rebuild and redeploy your existing Cloud Run service

param(
    [string]$ProjectId = "gen-lang-client-0377439063",
    [string]$ServiceName = "finquest-simple", 
    [string]$Region = "us-central1",
    [string]$ImageName = "vtfin-backend-fresh"
)

$ErrorActionPreference = "Stop"

Write-Host "Updating VTFIN Deployment with Fresh Container..." -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Cyan
Write-Host "Service Name: $ServiceName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Set the project
Write-Host "Setting project to $ProjectId..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable required APIs (in case they're not enabled)
Write-Host "Ensuring required APIs are enabled..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable APIs" -ForegroundColor Red
    exit 1
}

# Build a fresh Docker image with timestamp tag
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$imageTag = "$ImageName-$timestamp"

Write-Host "Building fresh Docker image: $imageTag..." -ForegroundColor Yellow
gcloud builds submit --tag "us-central1-docker.pkg.dev/$ProjectId/cloud-run-source-deploy/$imageTag" --region us-central1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Deploy the fresh container to existing service
Write-Host "Deploying fresh container to existing service..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image "us-central1-docker.pkg.dev/$ProjectId/cloud-run-source-deploy/$imageTag" `
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
    Write-Host "Failed to deploy fresh container" -ForegroundColor Red
    exit 1
}

# Get the service URL
$ServiceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"

Write-Host ""
Write-Host "Fresh container deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your updated VTFIN backend is live at:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl" -ForegroundColor White
Write-Host ""
Write-Host "Updated API Endpoints:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl/health (Health check)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/auth/login (Authentication)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/goals (Goals management)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/transactions (Transactions)" -ForegroundColor White
Write-Host "   $ServiceUrl/api/analytics/dashboard-data (Analytics)" -ForegroundColor White
Write-Host ""

# Test the health endpoint
Write-Host "Testing updated health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method Get -TimeoutSec 30
    Write-Host "Health check passed!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
} catch {
    Write-Host "Health check failed (service might still be starting): $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Wait a minute and try: curl $ServiceUrl/health" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Fresh container info:" -ForegroundColor Cyan
Write-Host "   Image: us-central1-docker.pkg.dev/$ProjectId/cloud-run-source-deploy/$imageTag" -ForegroundColor White
Write-Host "   Deployed at: $(Get-Date)" -ForegroundColor White
Write-Host ""
Write-Host "Fresh deployment complete!" -ForegroundColor Green