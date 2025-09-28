# Frontend Deployment Guide for Vercel

## Prerequisites Setup

1. **Install Node.js**: Download from https://nodejs.org/ and install the LTS version
2. **Install Vercel CLI**: After Node.js is installed, run: `npm install -g vercel`

## Option 1: Deploy via Vercel Website (Easiest)

### Step 1: Push to GitHub (if not already done)
```bash
# If you haven't pushed to GitHub yet:
git add .
git commit -m "Add backend integration and deployment config"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to **https://vercel.com**
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Import your **VTFIN** repository
5. Configure the deployment:
   - **Project Name**: `finquest-app`
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Leave empty (default)
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd frontend && npm ci`

### Step 3: Set Environment Variables
In Vercel project settings, add:
- **Variable**: `REACT_APP_API_URL`
- **Value**: `https://finquest-simple-895919367989.us-central1.run.app`

### Step 4: Deploy!
Click **Deploy** - Vercel will handle the rest automatically.

## Option 2: Deploy via Vercel CLI

After installing Node.js and Vercel CLI:

```bash
# Navigate to your project
cd VTFIN

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add REACT_APP_API_URL production
# Enter: https://finquest-simple-895919367989.us-central1.run.app
```

## Option 3: Static Deployment (Alternative)

If you want to deploy the frontend-simple (which is already working):

### Deploy to Netlify Drop
1. Go to **https://app.netlify.com/drop**
2. Drag and drop your `frontend-simple` folder
3. Your site will be live instantly!

### Deploy to Vercel as Static Site
1. Create a new folder: `frontend-static`
2. Copy your `frontend-simple/index.html` there
3. Deploy via Vercel website pointing to that folder

## Expected Results

After deployment, you'll get:
- **Frontend URL**: `https://finquest-your-username.vercel.app`
- **Backend URL**: `https://finquest-simple-895919367989.us-central1.run.app`
- **Automatic deployments**: Every GitHub push triggers new deployment
- **Global CDN**: Fast loading worldwide

## Next Steps

1. **Install Node.js** from https://nodejs.org/
2. **Choose your deployment method** (Website is easiest)
3. **Deploy and test**
4. **Update CORS** in backend if needed

Your backend is ready and waiting! 🚀