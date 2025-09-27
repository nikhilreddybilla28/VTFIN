# FinQuest Setup Guide

This guide will help you set up FinQuest, a student financial management application with gamified goals, bank transaction insights, and AI-driven recommendations.

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Google Cloud SDK (for deployment)
- Firebase CLI (for Firebase setup)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd FinQuest
```

### 2. Environment Configuration

#### Backend Environment Variables

Copy the backend environment template:
```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` with your configuration:

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
PLAID_PRODUCTS=transactions,auth

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

#### Frontend Environment Variables

Copy the frontend environment template:
```bash
cp frontend/env.example frontend/.env
```

Edit `frontend/.env` with your configuration:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-firebase-app-id

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

### 3. Install Dependencies

#### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. Run Development Servers

#### Option A: Docker Compose (Recommended)
```bash
# From project root
docker-compose up --build
```

This will start:
- Backend API at http://localhost:8000
- Frontend at http://localhost:3000

#### Option B: Manual Development
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

## API Keys Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication and Firestore
4. Go to Project Settings > Service Accounts
5. Generate a new private key
6. Copy the configuration values to your `.env` files

### 2. Plaid Setup

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Create a new application
3. Get your Client ID and Secret from the dashboard
4. Use sandbox environment for development

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your backend `.env` file

## Database Setup

### Firestore Configuration

1. Enable Firestore in Firebase Console
2. Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

3. Deploy the indexes:
```bash
firebase deploy --only firestore:indexes
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Production Deployment

See [deployment.md](./deployment.md) for detailed deployment instructions.

## Troubleshooting

### Common Issues

1. **Firebase Authentication Issues**
   - Verify your Firebase configuration
   - Check that Authentication is enabled in Firebase Console
   - Ensure CORS is properly configured

2. **Plaid Connection Issues**
   - Verify your Plaid credentials
   - Check that you're using the correct environment (sandbox for development)
   - Ensure your redirect URI is configured in Plaid dashboard

3. **API Connection Issues**
   - Check that the backend is running on the correct port
   - Verify CORS settings in the backend
   - Check network connectivity

### Logs

- Backend logs: Check the console output or Docker logs
- Frontend logs: Check browser console
- Firebase logs: Check Firebase Console > Functions > Logs

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8000/docs
3. Check the GitHub issues page
