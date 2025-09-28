# Deploy Frontend-Simple to Cloud Storage (Static Hosting)
# This deploys the working frontend-simple as a static website

Write-Host "🌐 Deploying Frontend-Simple to Cloud Storage" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$PROJECT_ID = "gen-lang-client-0377439063"
$BUCKET_NAME = "$PROJECT_ID-finquest-frontend"

# Create storage bucket for static hosting
Write-Host "🪣 Creating storage bucket..." -ForegroundColor Cyan
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME

# Set bucket for public web hosting
Write-Host "🌐 Configuring bucket for web hosting..." -ForegroundColor Cyan
gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Update the frontend-simple index.html to point to deployed backend
$BACKEND_URL = gcloud run services describe finquest-simple --platform=managed --region=us-central1 --format="value(status.url)" 2>$null

if ($BACKEND_URL) {
    Write-Host "🔧 Backend URL found: $BACKEND_URL" -ForegroundColor Green
    
    # Read the index.html file and update API URL
    $indexPath = "frontend-simple/index.html"
    if (Test-Path $indexPath) {
        $content = Get-Content $indexPath -Raw
        $updatedContent = $content -replace "http://localhost:8000", $BACKEND_URL
        $updatedContent | Set-Content $indexPath -Encoding UTF8
        Write-Host "✅ Updated frontend to use deployed backend" -ForegroundColor Green
    }
}

# Upload files to bucket
Write-Host "📤 Uploading files..." -ForegroundColor Cyan
gsutil -m cp -r frontend-simple/* gs://$BUCKET_NAME/

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Website URL: https://storage.googleapis.com/$BUCKET_NAME/index.html" -ForegroundColor Cyan
Write-Host "Alternative: http://$BUCKET_NAME.storage.googleapis.com/index.html" -ForegroundColor Cyan