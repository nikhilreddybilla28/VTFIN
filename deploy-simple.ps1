# Simple FinQuest Deployment Script
# Deploy the simple version that's already working locally

Write-Host "🌱 FinQuest Simple Deployment" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

$PROJECT_ID = "gen-lang-client-0377439063"
$REGION = "us-central1"

# Create a simple Dockerfile for the working simple server
$simpleDockerfile = @'
FROM python:3.11-slim

WORKDIR /app

# Install minimal requirements
RUN pip install --no-cache-dir uvicorn fastapi python-dotenv

# Copy the simple server
COPY backend/simple_server.py .
COPY backend/.env .env

# Expose port
EXPOSE 8000

# Run the simple server
CMD ["python", "simple_server.py"]
'@

$simpleDockerfile | Out-File -FilePath "docker/Dockerfile.simple" -Encoding UTF8

Write-Host "✅ Created simple Dockerfile" -ForegroundColor Green

# Build and deploy simple backend
Write-Host "🔨 Building simple backend..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$PROJECT_ID/finquest-simple --file docker/Dockerfile.simple .

if ($LASTEXITCODE -eq 0) {
    Write-Host "🚀 Deploying simple backend..." -ForegroundColor Cyan
    gcloud run deploy finquest-simple `
        --image gcr.io/$PROJECT_ID/finquest-simple `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --port 8000 `
        --memory 512Mi `
        --max-instances 3

    $BACKEND_URL = gcloud run services describe finquest-simple --platform=managed --region=$REGION --format="value(status.url)"
    Write-Host "✅ Simple backend deployed at: $BACKEND_URL" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check billing is enabled." -ForegroundColor Red
}