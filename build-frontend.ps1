# Frontend Static Build Script
# Build the React frontend for static hosting

Write-Host "🔨 Building Frontend for Static Hosting" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$BACKEND_URL = "https://finquest-backend-xxxx-uc.a.run.app"  # Will be updated after backend deployment

# Navigate to frontend directory
cd frontend

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "After installing Node.js, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# Set environment variable for build
$env:REACT_APP_API_URL = $BACKEND_URL
Write-Host "🔧 API URL set to: $BACKEND_URL" -ForegroundColor Yellow

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend built successfully!" -ForegroundColor Green
    Write-Host "📁 Build files are in: $(Get-Location)\build" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Deploy backend first to get the URL"
    Write-Host "2. Update REACT_APP_API_URL in this script"
    Write-Host "3. Run this script again"
    Write-Host "4. Upload build folder to Firebase Hosting or static host"
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
}