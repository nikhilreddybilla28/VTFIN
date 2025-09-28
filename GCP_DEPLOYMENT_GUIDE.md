# VTFIN Backend Deployment Guide - Google Cloud Platform

## Prerequisites

### 1. Google Cloud Account & SDK
- Create a Google Cloud account: https://cloud.google.com/
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Authenticate: `gcloud auth login`

### 2. Create a New Google Cloud Project
```bash
# Create a new project
gcloud projects create vtfin-backend-prod --name="VTFIN Backend"

# Set as active project
gcloud config set project vtfin-backend-prod

# Enable billing (required for Cloud Run)
# Visit: https://console.cloud.google.com/billing/linkedaccount?project=vtfin-backend-prod
```

## Quick Deployment (Recommended)

### Method 1: Automated Script
```bash
# Make the script executable (Linux/Mac)
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh
```

### Method 2: Manual Steps

#### Step 1: Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Build Docker Image
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/vtfin-backend-prod/vtfin-backend
```

#### Step 3: Deploy to Cloud Run
```bash
gcloud run deploy vtfin-api \
    --image gcr.io/vtfin-backend-prod/vtfin-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10
```

## Configuration Options

### Environment Variables
The backend supports these environment variables:
- `ENVIRONMENT`: Set to "production" for production deployment
- `PORT`: Port number (default: 8080 for Cloud Run)
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### Resource Limits
Current configuration:
- **CPU**: 1 vCPU
- **Memory**: 1GB
- **Max Instances**: 10
- **Timeout**: 300 seconds
- **Concurrency**: 80 concurrent requests per instance

### Custom Domain (Optional)
```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
    --service vtfin-api \
    --domain api.yourdomain.com \
    --region us-central1
```

## Testing Deployment

### Health Check
```bash
# Replace with your actual service URL
curl https://vtfin-api-[RANDOM-HASH]-uc.a.run.app/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "2024-01-XX", "environment": "production"}
```

### API Endpoints Test
```bash
SERVICE_URL="https://vtfin-api-[RANDOM-HASH]-uc.a.run.app"

# Test authentication
curl -X POST "$SERVICE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test goals endpoint
curl "$SERVICE_URL/api/goals" \
  -H "Authorization: Bearer your-token-here"
```

## Monitoring & Logs

### View Logs
```bash
# View recent logs
gcloud run services logs read vtfin-api --region us-central1

# Follow logs in real-time
gcloud run services logs tail vtfin-api --region us-central1
```

### Monitoring Dashboard
Visit Google Cloud Console:
1. Go to Cloud Run → vtfin-api
2. Click "Logs" tab for application logs
3. Click "Metrics" tab for performance metrics

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
gcloud builds list --limit=5

# Get detailed build log
gcloud builds log [BUILD_ID]
```

#### 2. Deployment Failures
- Ensure Docker image builds successfully locally
- Check that port 8080 is exposed in Dockerfile
- Verify health endpoint returns 200 status

#### 3. Service Not Accessible
- Ensure `--allow-unauthenticated` flag is set
- Check firewall rules don't block traffic
- Verify the service URL is correct

### Rollback Deployment
```bash
# List revisions
gcloud run revisions list --service vtfin-api --region us-central1

# Rollback to previous revision
gcloud run services update-traffic vtfin-api \
    --to-revisions [PREVIOUS_REVISION]=100 \
    --region us-central1
```

## Cost Optimization

### Pricing Model
Cloud Run pricing:
- **CPU**: $0.000024 per vCPU-second
- **Memory**: $0.0000025 per GB-second
- **Requests**: $0.40 per million requests

### Tips to Reduce Costs
1. Set appropriate min/max instances
2. Use CPU throttling for non-critical workloads
3. Optimize container startup time
4. Set reasonable timeout values

## Security Considerations

### 1. Service Account (Production)
```bash
# Create dedicated service account
gcloud iam service-accounts create vtfin-api-sa \
    --display-name="VTFIN API Service Account"

# Deploy with custom service account
gcloud run deploy vtfin-api \
    --service-account vtfin-api-sa@vtfin-backend-prod.iam.gserviceaccount.com
```

### 2. VPC Connector (Enterprise)
For private network access:
```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create vtfin-connector \
    --region us-central1 \
    --subnet default

# Deploy with VPC access
gcloud run deploy vtfin-api \
    --vpc-connector vtfin-connector
```

## Next Steps

After successful backend deployment:

1. **Note the Service URL**: Copy the Cloud Run service URL
2. **Update Frontend**: Replace the API base URL in your frontend configuration
3. **Test Integration**: Verify frontend can communicate with deployed backend
4. **Deploy Frontend**: Deploy your frontend to Vercel or another hosting platform
5. **Set up Monitoring**: Configure alerts for errors and performance metrics

## Support

For issues:
1. Check Google Cloud Console logs
2. Review the deployment script output
3. Verify all prerequisites are met
4. Test with a simple curl command first