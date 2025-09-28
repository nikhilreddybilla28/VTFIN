# FinQuest Hybrid Deployment Guide
# GCP Backend + Vercel Frontend

## 🚀 Deployment Strategy

**Backend**: Google Cloud Run (Scalable, serverless)
**Frontend**: Vercel (Fast, CDN, automatic deployments)

This approach gives us:
- ✅ Scalable backend on GCP
- ✅ Lightning-fast frontend on Vercel's global CDN  
- ✅ Easy deployments from Git
- ✅ Automatic HTTPS for both
- ✅ Cost-effective (generous free tiers)

## Step 1: Deploy Backend to GCP

### Prerequisites
- Billing enabled on your GCP project
- Google Cloud SDK installed and authenticated

### Deploy Backend
```powershell
cd "c:\Users\moksh\Downloads\hackathon\VTFIN"
.\deploy-backend-gcp.ps1
```

This will:
1. Build backend Docker container
2. Deploy to Cloud Run
3. Return a backend URL like: `https://finquest-backend-xxxx-uc.a.run.app`

## Step 2: Deploy Frontend to Vercel

### Method 1: GitHub + Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment config"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Sign up/in with GitHub
   - Import your repository
   - Configure project:
     - Framework Preset: `Create React App`
     - Root Directory: `/` (leave empty)
     - Build Command: `cd frontend && npm ci && npm run build`
     - Output Directory: `frontend/build`

3. **Set Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url-from-step1`

4. **Deploy**: Vercel will automatically deploy!

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 3: Update CORS Settings

After getting your Vercel URL, update the backend CORS settings:

```powershell
# Redeploy backend with Vercel URL
gcloud run services update finquest-backend \
  --region us-central1 \
  --update-env-vars "ALLOWED_ORIGINS=https://your-vercel-url.vercel.app"
```

## 🌟 Expected Results

- **Backend**: `https://finquest-backend-xxxx-uc.a.run.app`
- **Frontend**: `https://finquest-your-username.vercel.app`
- **Automatic deployments**: Every push to main branch
- **HTTPS**: Enabled by default on both platforms
- **Global CDN**: Fast loading worldwide

## 💰 Cost Breakdown

### GCP (Backend)
- **Free Tier**: 2M requests/month, 400k GB-seconds
- **After Free Tier**: ~$0.40/million requests

### Vercel (Frontend)
- **Hobby Plan**: Free forever
- **Unlimited sites**: Static hosting
- **100GB bandwidth/month**: Free

## 🔧 Configuration Files Created

- `deploy-backend-gcp.ps1` - Backend deployment script
- `vercel.json` - Vercel configuration
- Environment variables setup

## 🆘 Troubleshooting

### Common Issues:
1. **CORS errors**: Update `ALLOWED_ORIGINS` in backend
2. **API not found**: Check `REACT_APP_API_URL` in Vercel
3. **Build fails**: Ensure `package.json` is in `frontend/` directory

### Debug Commands:
```bash
# Check backend logs
gcloud logs tail finquest-backend --region=us-central1

# Check Vercel deployment logs
vercel logs your-deployment-url
```