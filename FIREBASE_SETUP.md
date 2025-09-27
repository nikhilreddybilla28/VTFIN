# Firebase Setup Guide for FinQuest

## 🔥 Quick Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `finquest-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Save**

### Step 3: Enable Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select a location (choose closest to your users)
5. Click **Done**

### Step 4: Get Configuration Keys

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Enter app nickname: `finquest-web`
5. **Don't** check "Set up Firebase Hosting"
6. Click **Register app**
7. Copy the configuration object

### Step 5: Get Service Account Key

1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. **Keep this file secure!**

### Step 6: Update Environment Files

#### Backend Configuration (`backend/.env`)

Replace the Firebase values with your actual credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=from-service-account-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nactual-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=from-service-account-json
FIREBASE_CLIENT_ID=from-service-account-json
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Plaid Configuration (Already configured)
PLAID_CLIENT_ID=68d7732f1059f3002356b0ff
PLAID_SECRET=21ce3b9e390661c338e520d82049d4
PLAID_ENV=sandbox

# Gemini API Configuration (Already configured)
GEMINI_API_KEY=AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI

# Application Configuration
SECRET_KEY=finquest-secret-key-2024-very-secure
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
```

#### Frontend Configuration (`frontend/.env`)

Replace with your Firebase web app config:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

### Step 7: Deploy Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   cd /Users/nikilreddy/Desktop/VTFIN
   firebase init
   ```
   
   Select:
   - ✅ Firestore: Configure security rules and indexes files
   - ❌ Hosting (we'll use Docker for now)

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

### Step 8: Test Your Setup

1. Start the application:
   ```bash
   docker-compose up --build
   ```

2. Open your browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

3. Try to register a new account in the app

## 🔒 Security Rules Already Configured

The project includes secure Firestore rules that:
- ✅ Only allow users to access their own data
- ✅ Validate user authentication
- ✅ Protect against unauthorized access
- ✅ Ensure data integrity

## 🧪 Test Credentials

For testing Plaid integration, use these sandbox credentials:
- **Username**: `user_good`
- **Password**: `pass_good`

## 🚨 Important Notes

1. **Never commit** your `.env` files to version control
2. **Keep your service account key** secure and private
3. **Test in sandbox mode** before going to production
4. **Monitor your Firebase usage** to avoid unexpected charges

## 🆘 Troubleshooting

### Common Issues:

1. **"Firebase project not found"**
   - Check your project ID is correct
   - Ensure you're using the right Firebase project

2. **"Authentication failed"**
   - Verify your service account key is correct
   - Check that Authentication is enabled in Firebase Console

3. **"Permission denied"**
   - Deploy the security rules: `firebase deploy --only firestore:rules`
   - Check that your user is authenticated

4. **"CORS error"**
   - Ensure `ALLOWED_ORIGINS` includes your frontend URL
   - Check that both frontend and backend are running

## ✅ Ready to Go!

Once you've completed these steps, FinQuest will be fully configured with:
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Plaid Bank Integration
- ✅ Gemini AI Features
- ✅ Secure API endpoints

Your financial garden is ready to grow! 🌱💰
