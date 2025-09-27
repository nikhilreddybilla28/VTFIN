# FinQuest Manual Setup Guide

## 🚀 Quick Start (Without Docker)

Since Docker isn't installed, let's run FinQuest manually:

### Step 1: Install Dependencies

#### Backend Setup
```bash
cd /Users/nikilreddy/Desktop/VTFIN/backend
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd /Users/nikilreddy/Desktop/VTFIN/frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration
Copy the backend config:
```bash
cp backend/config.env backend/.env
```

Your backend `.env` should look like this:
```env
# Firebase Configuration (You need to set these up)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Plaid Configuration (✅ Already configured)
PLAID_CLIENT_ID=68d7732f1059f3002356b0ff
PLAID_SECRET=21ce3b9e390661c338e520d82049d4
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions,auth

# Gemini API Configuration (✅ Already configured)
GEMINI_API_KEY=AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI

# Application Configuration
SECRET_KEY=finquest-secret-key-2024-very-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
```

#### Frontend Configuration
Copy the frontend config:
```bash
cp frontend/config.env frontend/.env
```

Your frontend `.env` should look like this:
```env
# Firebase Configuration (You need to set these up)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-firebase-app-id

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: Set Up Firebase (Required)

Follow the detailed guide in `FIREBASE_SETUP.md` to:
1. Create a Firebase project
2. Enable Authentication and Firestore
3. Get your configuration keys
4. Update the `.env` files

### Step 4: Run the Application

#### Terminal 1 - Backend
```bash
cd /Users/nikilreddy/Desktop/VTFIN/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd /Users/nikilreddy/Desktop/VTFIN/frontend
npm start
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Current Configuration Status

### ✅ Already Configured:
- **Plaid API**: Client ID and Secret set up
- **Gemini AI**: API key configured
- **Application**: Secret keys and CORS settings

### ⚠️ Needs Setup:
- **Firebase Project**: Create project and get credentials
- **Firebase Authentication**: Enable email/password auth
- **Firestore Database**: Create database and deploy rules

## 🧪 Test the Application

Once Firebase is configured:

1. **Register**: Create a new account at http://localhost:3000
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your financial garden
4. **Goals**: Create your first financial goal
5. **Bank Connection**: Connect using Plaid sandbox
   - Use: `user_good` / `pass_good`
6. **AI Features**: Get personalized recommendations

## 🎯 Features You Can Test

### Without Firebase (Limited):
- View the UI and navigation
- See the dashboard layout
- Explore the goal creation interface

### With Firebase (Full Features):
- User registration and authentication
- Goal creation and tracking
- Bank account connection (Plaid sandbox)
- AI-powered recommendations
- Spending analytics
- What-if simulations

## 🆘 Troubleshooting

### Common Issues:

1. **"Module not found" errors**
   - Run `pip install -r requirements.txt` in backend
   - Run `npm install` in frontend

2. **"Firebase not configured"**
   - Follow the Firebase setup guide
   - Check your `.env` files have correct values

3. **"CORS error"**
   - Ensure backend is running on port 8000
   - Check `ALLOWED_ORIGINS` in backend `.env`

4. **"Plaid connection failed"**
   - Use sandbox credentials: `user_good` / `pass_good`
   - Check your Plaid credentials are correct

## 📞 Next Steps

1. **Set up Firebase** (follow `FIREBASE_SETUP.md`)
2. **Test the application** with full features
3. **Customize the UI** if needed
4. **Deploy to cloud** when ready

Your FinQuest application is ready to grow! 🌱💰
