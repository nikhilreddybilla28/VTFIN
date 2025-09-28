# FinQuest GCP Deployment - Step by Step Guide

## 🚀 Complete Deployment Guide

### Prerequisites

1. **Enable Billing** (Required for Cloud Run):
   - Visit: https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0377439063
   - Link a billing account to your project
   - This is required for Cloud Build, Cloud Run, and Container Registry

2. **Install Node.js** (for Firebase and frontend tools):
   - Download from: https://nodejs.org/
   - Install Firebase CLI: `npm install -g firebase-tools`

### Option 1: Full Deployment (Recommended)

Once billing is enabled, run:

```powershell
# Navigate to project directory
cd "c:\Users\moksh\Downloads\hackathon\VTFIN"

# Run the deployment script
.\deploy-gcp.ps1
```

### Option 2: Simple Server Deployment

For a minimal deployment using the working simple server:

```powershell
# Enable required services first (requires billing)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Run simple deployment
.\deploy-simple.ps1
```

### Option 3: Manual Step-by-Step Deployment

#### Step 1: Enable Services
```powershell
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

#### Step 2: Build Backend
```powershell
# Build backend container
gcloud builds submit --tag gcr.io/gen-lang-client-0377439063/finquest-backend --file docker/Dockerfile.backend .
```

#### Step 3: Deploy Backend
```powershell
gcloud run deploy finquest-backend \
  --image gcr.io/gen-lang-client-0377439063/finquest-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --set-env-vars "PLAID_CLIENT_ID=68d7732f1059f3002356b0ff" \
  --set-env-vars "PLAID_SECRET=21ce3b9e390661c338e520d82049d4" \
  --set-env-vars "GEMINI_API_KEY=AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI"
```

#### Step 4: Build and Deploy Frontend
```powershell
# Get backend URL
$BACKEND_URL = gcloud run services describe finquest-backend --platform=managed --region=us-central1 --format="value(status.url)"

# Build frontend
gcloud builds submit --tag gcr.io/gen-lang-client-0377439063/finquest-frontend --file docker/Dockerfile.frontend .

# Deploy frontend
gcloud run deploy finquest-frontend \
  --image gcr.io/gen-lang-client-0377439063/finquest-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars "REACT_APP_API_URL=$BACKEND_URL"
```

### Option 4: Firebase Hosting (Free Tier)

For frontend hosting only:

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# Build frontend
cd frontend
npm install
npm run build

# Deploy to Firebase
firebase deploy
```

## 🔧 Configuration Files Created

- `deploy-gcp.ps1` - Complete deployment script
- `deploy-simple.ps1` - Simple server deployment
- `docker/Dockerfile.simple` - Minimal container for simple server

## 🎯 Next Steps

1. **Enable billing** in Google Cloud Console
2. Choose your deployment option
3. Run the appropriate script or manual commands
4. Monitor deployment in Cloud Console

## 💡 Cost Optimization

- Cloud Run has a generous free tier (2 million requests/month)
- Firebase Hosting is free for small projects
- Consider using Cloud Run with minimal resources for cost efficiency

## 🆘 Troubleshooting

If you encounter issues:
1. Verify billing is enabled
2. Check that all required APIs are enabled
3. Ensure Docker is running (if building locally)
4. Verify authentication with `gcloud auth list`