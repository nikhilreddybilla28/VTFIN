"""
FinQuest Backend - FastAPI Application
Main application entry point with all API routes
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from contextlib import asynccontextmanager

from routers import auth, plaid, goals, ai, analytics
from services.firebase_service import FirebaseService
from services.plaid_service import PlaidService
from services.ai_service import AIService
from models.database import DatabaseService

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        firebase_config = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        }
        
        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred)
        
        # Initialize services
        app.state.firebase_service = FirebaseService()
        app.state.plaid_service = PlaidService()
        app.state.ai_service = AIService()
        app.state.db_service = DatabaseService()
        
        print("✅ FinQuest backend initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing backend: {e}")
        raise
    
    yield
    
    # Shutdown
    print("🔄 Shutting down FinQuest backend")

# Create FastAPI app
app = FastAPI(
    title="FinQuest API",
    description="Student Financial Management Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(plaid.router, prefix="/api/plaid", tags=["Plaid Integration"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals Management"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Recommendations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "FinQuest API is running! 🌱",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "firebase": "connected",
            "plaid": "configured",
            "gemini": "configured"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
