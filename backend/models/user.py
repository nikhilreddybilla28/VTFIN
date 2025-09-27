"""
User model and related schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class UserProfile(BaseModel):
    """User profile information"""
    uid: str
    email: EmailStr
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    created_at: datetime
    updated_at: datetime
    preferences: Optional[dict] = None

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    preferences: Optional[dict] = None

class UserResponse(BaseModel):
    """Schema for user response"""
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: UserRole
    created_at: datetime
    updated_at: datetime
    preferences: Optional[dict] = None

class LoginRequest(BaseModel):
    """Schema for login request"""
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
