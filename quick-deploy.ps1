# Quick Deploy - Direct to Cloud Run without build
# Uses a pre-built Python image and runs the simple server directly

Write-Host "⚡ Quick Deploy to Cloud Run" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

$PROJECT_ID = "gen-lang-client-0377439063"
$REGION = "us-central1"
$SERVICE_NAME = "finquest-simple"

# Deploy simple server directly using source code
Write-Host "🚀 Deploying source directly to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
    --source ./backend `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8000 `
    --memory 512Mi `
    --cpu 0.5 `
    --max-instances 5 `
    --set-env-vars "PLAID_CLIENT_ID=68d7732f1059f3002356b0ff" `
    --set-env-vars "PLAID_SECRET=21ce3b9e390661c338e520d82049d4" `
    --set-env-vars "GEMINI_API_KEY=AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI"

if ($LASTEXITCODE -eq 0) {
    $BACKEND_URL = gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)"
    Write-Host ""
    Write-Host "🎉 Quick Deploy Success!" -ForegroundColor Green
    Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 For Vercel Frontend:" -ForegroundColor Yellow
    Write-Host "Set REACT_APP_API_URL = $BACKEND_URL"
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
}