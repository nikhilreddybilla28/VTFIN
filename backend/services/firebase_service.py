"""
Firebase Authentication Service
"""

import firebase_admin
from firebase_admin import auth
from typing import Optional, Dict, Any
import os

class FirebaseService:
    """Service for Firebase Authentication operations"""
    
    def __init__(self):
        self.app = firebase_admin.get_app()
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user info"""
        try:
            decoded_token = auth.verify_id_token(token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'firebase': decoded_token.get('firebase', {})
            }
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None
    
    async def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user by UID"""
        try:
            user = auth.get_user(uid)
            return {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'photo_url': user.photo_url,
                'email_verified': user.email_verified,
                'disabled': user.disabled,
                'created_at': user.user_metadata.creation_timestamp,
                'last_sign_in': user.user_metadata.last_sign_in_timestamp
            }
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    async def create_user(self, email: str, password: str, display_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            return {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'email_verified': user.email_verified
            }
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    async def update_user(self, uid: str, **kwargs) -> bool:
        """Update user information"""
        try:
            auth.update_user(uid, **kwargs)
            return True
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    async def delete_user(self, uid: str) -> bool:
        """Delete a user"""
        try:
            auth.delete_user(uid)
            return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    async def set_custom_claims(self, uid: str, claims: Dict[str, Any]) -> bool:
        """Set custom claims for a user"""
        try:
            auth.set_custom_user_claims(uid, claims)
            return True
        except Exception as e:
            print(f"Error setting custom claims: {e}")
            return False
