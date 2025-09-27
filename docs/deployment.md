# FinQuest Deployment Guide

This guide covers deploying FinQuest to Google Cloud Platform using Cloud Run and Firebase Hosting.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- Firebase CLI installed
- Access to a Google Cloud Project with billing enabled

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Cloud Run     │    │   Cloud Run     │
│   Hosting      │    │   (Frontend)    │    │   (Backend)     │
│   (Static)     │    │   (Optional)    │    │   (API)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Firestore     │
                    │   (Database)    │
                    └─────────────────┘
```

## Option 1: Firebase Hosting + Cloud Run (Recommended)

### 1. Setup Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Hosting: Configure files for Firebase Hosting
# - Firestore: Deploy Firestore security rules and indexes
```

### 2. Configure Firebase

Update `deployment/firebase.json` with your project settings:

```json
{
  "hosting": {
    "public": "frontend/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  }
}
```

### 3. Deploy Frontend to Firebase Hosting

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 4. Deploy Backend to Cloud Run

```bash
# Build and push backend image
gcloud builds submit --tag gcr.io/$PROJECT_ID/finquest-backend

# Deploy to Cloud Run
gcloud run deploy finquest-backend \
  --image gcr.io/$PROJECT_ID/finquest-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  --set-env-vars PLAID_CLIENT_ID=$PLAID_CLIENT_ID \
  --set-env-vars PLAID_SECRET=$PLAID_SECRET \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```

## Option 2: Full Cloud Run Deployment

### 1. Setup Cloud Build

Create a Cloud Build trigger:

```bash
# Create trigger
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=deployment/cloudbuild.yaml
```

### 2. Configure Environment Variables

Set up secret environment variables in Cloud Build:

```bash
# Set substitution variables
gcloud builds triggers update your-trigger-name \
  --substitutions=_FIREBASE_PROJECT_ID=your-project-id,_PLAID_CLIENT_ID=your-plaid-id
```

### 3. Deploy Firestore Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Option 3: Docker Compose (Local/Development)

### 1. Environment Setup

Create a `.env` file in the project root:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Plaid Configuration
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-firebase-app-id
```

### 2. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## CI/CD Pipeline Setup

### 1. GitHub Actions (Alternative to Cloud Build)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Google Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Google Cloud SDK
      uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and Deploy
      run: |
        gcloud builds submit --config deployment/cloudbuild.yaml
```

### 2. Environment Variables in CI/CD

Set up the following secrets in your repository:

- `GCP_SA_KEY`: Service account key JSON
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `FIREBASE_PROJECT_ID`: Firebase Project ID
- `PLAID_CLIENT_ID`: Plaid Client ID
- `PLAID_SECRET`: Plaid Secret
- `GEMINI_API_KEY`: Gemini API Key

## Monitoring and Logging

### 1. Cloud Run Monitoring

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View metrics
gcloud monitoring dashboards list
```

### 2. Firebase Monitoring

- Go to Firebase Console > Performance
- Monitor app performance and crashes
- Set up alerts for errors

### 3. Health Checks

The application includes health check endpoints:

- Backend: `http://your-backend-url/api/health`
- Frontend: `http://your-frontend-url/health`

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use Google Secret Manager for production secrets
- Rotate API keys regularly

### 2. Firestore Security Rules

The included `firestore.rules` file provides:
- User-specific data access
- Proper authentication checks
- Data validation

### 3. CORS Configuration

Ensure CORS is properly configured for your domain:

```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Scaling Considerations

### 1. Cloud Run Scaling

- Set appropriate min/max instances
- Configure CPU and memory allocation
- Use request-based scaling

### 2. Firestore Scaling

- Use appropriate indexes
- Implement pagination for large datasets
- Consider data archiving strategies

### 3. CDN Configuration

- Use Firebase Hosting's global CDN
- Configure appropriate cache headers
- Enable compression

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Docker build logs
   - Verify all dependencies are included
   - Check for syntax errors

2. **Runtime Errors**
   - Check Cloud Run logs
   - Verify environment variables
   - Test API endpoints

3. **Authentication Issues**
   - Verify Firebase configuration
   - Check CORS settings
   - Validate API keys

### Debug Commands

```bash
# Check Cloud Run service status
gcloud run services list

# View detailed logs
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Test API endpoint
curl https://your-backend-url/api/health

# Check Firebase deployment
firebase hosting:channel:list
```

## Cost Optimization

### 1. Cloud Run Optimization

- Use appropriate instance sizes
- Set up auto-scaling policies
- Monitor usage patterns

### 2. Firestore Optimization

- Use efficient queries
- Implement proper indexing
- Consider data lifecycle management

### 3. Firebase Hosting

- Optimize bundle sizes
- Use appropriate cache headers
- Enable compression

## Backup and Recovery

### 1. Firestore Backup

```bash
# Enable Firestore backup
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)
```

### 2. Application Backup

- Use version control for code
- Document configuration changes
- Maintain deployment records

## Support and Maintenance

### 1. Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Test updates in staging environment

### 2. Monitoring

- Set up alerts for critical issues
- Monitor performance metrics
- Track user engagement

### 3. Documentation

- Keep deployment docs updated
- Document configuration changes
- Maintain runbooks for common issues
