"""
Authentication router
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os

from models.user import UserCreate, UserResponse, LoginRequest, TokenResponse
from services.firebase_service import FirebaseService
from models.database import DatabaseService

router = APIRouter()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from Firebase token"""
    try:
        firebase_service = FirebaseService()
        user_data = await firebase_service.verify_token(credentials.credentials)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        firebase_service = FirebaseService()
        db_service = DatabaseService()
        
        # Create user in Firebase Auth
        firebase_user = await firebase_service.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name
        )
        
        if not firebase_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create user profile in Firestore
        user_profile = {
            'uid': firebase_user['uid'],
            'email': firebase_user['email'],
            'display_name': firebase_user.get('display_name'),
            'role': 'student',
            'created_at': firebase_user.get('created_at'),
            'updated_at': firebase_user.get('created_at'),
            'preferences': {}
        }
        
        await db_service.create_user(user_profile)
        
        return UserResponse(**user_profile)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: LoginRequest):
    """Login user (Firebase handles authentication)"""
    try:
        # Note: In a real implementation, you would verify the password here
        # For now, we'll assume the frontend handles Firebase Auth
        # and sends us the ID token
        
        return {
            "message": "Use Firebase Auth on the frontend to get the ID token",
            "note": "Send the ID token in the Authorization header for protected routes"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        db_service = DatabaseService()
        user_profile = await db_service.get_user(current_user['uid'])
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return UserResponse(**user_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        db_service = DatabaseService()
        
        # Update user profile
        success = await db_service.update_user(current_user['uid'], update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user profile"
            )
        
        # Get updated profile
        updated_profile = await db_service.get_user(current_user['uid'])
        return UserResponse(**updated_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}"
        )

@router.delete("/me")
async def delete_user_account(current_user: dict = Depends(get_current_user)):
    """Delete user account"""
    try:
        firebase_service = FirebaseService()
        db_service = DatabaseService()
        
        # Delete from Firebase Auth
        await firebase_service.delete_user(current_user['uid'])
        
        # Note: In a real implementation, you might want to soft delete
        # or archive user data instead of hard deletion
        
        return {"message": "User account deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user account: {str(e)}"
        )

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh user token"""
    try:
        # Firebase handles token refresh automatically
        # This endpoint can be used to validate the current token
        return {
            "message": "Token is valid",
            "user_id": current_user['uid']
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )
