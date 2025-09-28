# Pre-deployment Check Script for VTFIN Backend
# Run this before attempting to deploy to Google Cloud

param(
    [switch]$Detailed = $false
)

Write-Host "🔍 VTFIN Backend Pre-Deployment Check" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$allChecksPass = $true

# Check 1: Google Cloud SDK
Write-Host "1. Checking Google Cloud SDK..." -ForegroundColor Cyan
try {
    $gcloudVersion = gcloud version --format="value(Google Cloud SDK)" 2>$null
    if ($gcloudVersion) {
        Write-Host "   ✅ Google Cloud SDK installed: $gcloudVersion" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Google Cloud SDK not found" -ForegroundColor Red
        Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        $allChecksPass = $false
    }
} catch {
    Write-Host "   ❌ Google Cloud SDK not found" -ForegroundColor Red
    Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    $allChecksPass = $false
}

# Check 2: Authentication
Write-Host "2. Checking Google Cloud authentication..." -ForegroundColor Cyan
try {
    $activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
    if ($activeAccount) {
        Write-Host "   ✅ Authenticated as: $activeAccount" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Not authenticated with Google Cloud" -ForegroundColor Red
        Write-Host "   Run: gcloud auth login" -ForegroundColor Yellow
        $allChecksPass = $false
    }
} catch {
    Write-Host "   ❌ Unable to check authentication status" -ForegroundColor Red
    $allChecksPass = $false
}

# Check 3: Docker (optional but recommended for local testing)
Write-Host "3. Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "   ✅ Docker installed: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        try {
            docker ps >$null 2>&1
            Write-Host "   ✅ Docker daemon is running" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Docker installed but daemon not running" -ForegroundColor Yellow
            Write-Host "   Start Docker Desktop or Docker service" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Docker not found (optional for Cloud Build deployment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Docker not found (optional for Cloud Build deployment)" -ForegroundColor Yellow
}

# Check 4: Project files
Write-Host "4. Checking required files..." -ForegroundColor Cyan
$requiredFiles = @(
    "html_backend.py",
    "requirements.txt", 
    "Dockerfile",
    ".dockerignore"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allChecksPass = $false
    }
}

# Check 5: Python (for local testing)
Write-Host "5. Checking Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "   ✅ Python installed: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Python not found (needed for local testing only)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Python not found (needed for local testing only)" -ForegroundColor Yellow
}

# Detailed checks
if ($Detailed) {
    Write-Host ""
    Write-Host "📋 Detailed Information:" -ForegroundColor Cyan
    
    # Check current project
    try {
        $currentProject = gcloud config get-value project 2>$null
        Write-Host "   Current GCP Project: $currentProject" -ForegroundColor White
    } catch {
        Write-Host "   Current GCP Project: Not set" -ForegroundColor Yellow
    }
    
    # Check available regions
    Write-Host "   Recommended regions: us-central1, us-east1, europe-west1" -ForegroundColor White
    
    # Check file sizes
    if (Test-Path "html_backend.py") {
        $backendSize = (Get-Item "html_backend.py").Length
        Write-Host "   Backend file size: $([math]::Round($backendSize/1KB, 2)) KB" -ForegroundColor White
    }
}

# Summary
Write-Host ""
Write-Host "🎯 Summary:" -ForegroundColor Green
if ($allChecksPass) {
    Write-Host "   ✅ All critical checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run deployment script: .\deploy-gcp.ps1" -ForegroundColor White
    Write-Host "   2. Or follow manual steps in GCP_DEPLOYMENT_GUIDE.md" -ForegroundColor White
} else {
    Write-Host "   ❌ Some checks failed. Please address the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Common fixes:" -ForegroundColor Cyan
    Write-Host "   • Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "   • Authenticate: gcloud auth login" -ForegroundColor White
    Write-Host "   • Create missing files using the provided examples" -ForegroundColor White
}

Write-Host ""