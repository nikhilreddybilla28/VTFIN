"""
Database service for Firestore operations
"""

import firebase_admin
from firebase_admin import firestore
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

class DatabaseService:
    """Service for database operations"""
    
    def __init__(self):
        self.db = firestore.client()
    
    # User operations
    async def create_user(self, user_data: dict) -> str:
        """Create a new user in Firestore"""
        try:
            doc_ref = self.db.collection('users').document(user_data['uid'])
            doc_ref.set(user_data)
            return doc_ref.id
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    async def get_user(self, uid: str) -> Optional[dict]:
        """Get user by UID"""
        try:
            doc = self.db.collection('users').document(uid).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            raise Exception(f"Error getting user: {str(e)}")
    
    async def update_user(self, uid: str, update_data: dict) -> bool:
        """Update user data"""
        try:
            self.db.collection('users').document(uid).update(update_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating user: {str(e)}")
    
    # Goal operations
    async def create_goal(self, goal_data: dict) -> str:
        """Create a new goal"""
        try:
            doc_ref = self.db.collection('goals').document()
            goal_data['id'] = doc_ref.id
            goal_data['created_at'] = datetime.utcnow()
            goal_data['updated_at'] = datetime.utcnow()
            doc_ref.set(goal_data)
            return doc_ref.id
        except Exception as e:
            raise Exception(f"Error creating goal: {str(e)}")
    
    async def get_user_goals(self, user_id: str) -> List[dict]:
        """Get all goals for a user"""
        try:
            goals = self.db.collection('goals').where('user_id', '==', user_id).get()
            return [goal.to_dict() for goal in goals]
        except Exception as e:
            raise Exception(f"Error getting user goals: {str(e)}")
    
    async def get_goal(self, goal_id: str) -> Optional[dict]:
        """Get a specific goal"""
        try:
            doc = self.db.collection('goals').document(goal_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            raise Exception(f"Error getting goal: {str(e)}")
    
    async def update_goal(self, goal_id: str, update_data: dict) -> bool:
        """Update a goal"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            self.db.collection('goals').document(goal_id).update(update_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating goal: {str(e)}")
    
    async def delete_goal(self, goal_id: str) -> bool:
        """Delete a goal"""
        try:
            self.db.collection('goals').document(goal_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting goal: {str(e)}")
    
    # Transaction operations
    async def create_transaction(self, transaction_data: dict) -> str:
        """Create a new transaction"""
        try:
            doc_ref = self.db.collection('transactions').document()
            transaction_data['id'] = doc_ref.id
            transaction_data['created_at'] = datetime.utcnow()
            transaction_data['updated_at'] = datetime.utcnow()
            doc_ref.set(transaction_data)
            return doc_ref.id
        except Exception as e:
            raise Exception(f"Error creating transaction: {str(e)}")
    
    async def get_user_transactions(self, user_id: str, limit: int = 100) -> List[dict]:
        """Get transactions for a user"""
        try:
            transactions = (self.db.collection('transactions')
                          .where('user_id', '==', user_id)
                          .order_by('date', direction=firestore.Query.DESCENDING)
                          .limit(limit)
                          .get())
            return [transaction.to_dict() for transaction in transactions]
        except Exception as e:
            raise Exception(f"Error getting user transactions: {str(e)}")
    
    async def get_transactions_by_category(self, user_id: str, category: str) -> List[dict]:
        """Get transactions by category"""
        try:
            transactions = (self.db.collection('transactions')
                          .where('user_id', '==', user_id)
                          .where('category', '==', category)
                          .get())
            return [transaction.to_dict() for transaction in transactions]
        except Exception as e:
            raise Exception(f"Error getting transactions by category: {str(e)}")
    
    async def update_transaction(self, transaction_id: str, update_data: dict) -> bool:
        """Update a transaction"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            self.db.collection('transactions').document(transaction_id).update(update_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating transaction: {str(e)}")
    
    # Analytics operations
    async def get_spending_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> dict:
        """Get spending summary for a period"""
        try:
            transactions = (self.db.collection('transactions')
                          .where('user_id', '==', user_id)
                          .where('date', '>=', start_date)
                          .where('date', '<=', end_date)
                          .get())
            
            transaction_data = [t.to_dict() for t in transactions]
            
            # Calculate summary
            total_spent = sum(t['amount'] for t in transaction_data if t['type'] == 'debit')
            total_income = sum(t['amount'] for t in transaction_data if t['type'] == 'credit')
            
            # Group by category
            categories = {}
            for t in transaction_data:
                cat = t['category']
                if cat not in categories:
                    categories[cat] = {'total': 0, 'count': 0}
                categories[cat]['total'] += t['amount']
                categories[cat]['count'] += 1
            
            return {
                'period_start': start_date,
                'period_end': end_date,
                'total_spent': total_spent,
                'total_income': total_income,
                'net_amount': total_income - total_spent,
                'categories': categories
            }
        except Exception as e:
            raise Exception(f"Error getting spending summary: {str(e)}")
    
    # Generic operations
    async def get_collection(self, collection_name: str, filters: Optional[Dict] = None) -> List[dict]:
        """Get documents from a collection with optional filters"""
        try:
            query = self.db.collection(collection_name)
            
            if filters:
                for field, value in filters.items():
                    query = query.where(field, '==', value)
            
            docs = query.get()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            raise Exception(f"Error getting collection {collection_name}: {str(e)}")
    
    async def delete_document(self, collection_name: str, doc_id: str) -> bool:
        """Delete a document"""
        try:
            self.db.collection(collection_name).document(doc_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting document: {str(e)}")
