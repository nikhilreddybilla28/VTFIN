"""
Plaid integration router
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

from services.plaid_service import PlaidService
from models.database import DatabaseService
from routers.auth import get_current_user

router = APIRouter()

class LinkTokenRequest(BaseModel):
    """Request model for creating link token"""
    pass

class PublicTokenRequest(BaseModel):
    """Request model for exchanging public token"""
    public_token: str

class AccessTokenRequest(BaseModel):
    """Request model for storing access token"""
    access_token: str
    item_id: str

@router.post("/link-token")
async def create_link_token(
    request: LinkTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a link token for Plaid Link"""
    try:
        plaid_service = PlaidService()
        link_token = await plaid_service.create_link_token(current_user['uid'])
        
        if not link_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create link token"
            )
        
        return {"link_token": link_token}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create link token: {str(e)}"
        )

@router.post("/exchange-token")
async def exchange_public_token(
    request: PublicTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    """Exchange public token for access token"""
    try:
        plaid_service = PlaidService()
        access_token = await plaid_service.exchange_public_token(request.public_token)
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange public token"
            )
        
        # Store access token for the user
        db_service = DatabaseService()
        await db_service.update_user(current_user['uid'], {
            'plaid_access_token': access_token,
            'plaid_connected': True
        })
        
        return {"access_token": access_token, "success": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange token: {str(e)}"
        )

@router.get("/accounts")
async def get_accounts(current_user: dict = Depends(get_current_user)):
    """Get user's connected accounts"""
    try:
        db_service = DatabaseService()
        user_data = await db_service.get_user(current_user['uid'])
        
        if not user_data or not user_data.get('plaid_access_token'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Plaid access token found. Please connect your bank account first."
            )
        
        plaid_service = PlaidService()
        accounts = await plaid_service.get_accounts(user_data['plaid_access_token'])
        
        return {"accounts": accounts}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get accounts: {str(e)}"
        )

@router.get("/transactions")
async def get_transactions(
    start_date: str = None,
    end_date: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get user's transactions"""
    try:
        db_service = DatabaseService()
        user_data = await db_service.get_user(current_user['uid'])
        
        if not user_data or not user_data.get('plaid_access_token'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Plaid access token found. Please connect your bank account first."
            )
        
        # Parse dates
        if start_date:
            start_date = datetime.fromisoformat(start_date)
        else:
            start_date = datetime.now() - timedelta(days=30)
            
        if end_date:
            end_date = datetime.fromisoformat(end_date)
        else:
            end_date = datetime.now()
        
        plaid_service = PlaidService()
        transactions = await plaid_service.get_transactions(
            user_data['plaid_access_token'],
            start_date,
            end_date
        )
        
        # Store transactions in database
        db_service = DatabaseService()
        for transaction in transactions:
            transaction_data = {
                'user_id': current_user['uid'],
                'account_id': transaction['account_id'],
                'transaction_id': transaction['transaction_id'],
                'amount': transaction['amount'],
                'type': 'debit' if transaction['amount'] < 0 else 'credit',
                'category': await plaid_service.categorize_transaction(transaction),
                'merchant_name': transaction.get('merchant_name'),
                'description': transaction['name'],
                'date': datetime.fromisoformat(transaction['date']),
                'pending': transaction.get('pending', False),
                'account_owner': transaction.get('account_owner')
            }
            await db_service.create_transaction(transaction_data)
        
        return {"transactions": transactions[:limit]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transactions: {str(e)}"
        )

@router.get("/spending-insights")
async def get_spending_insights(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get spending insights and analysis"""
    try:
        db_service = DatabaseService()
        user_data = await db_service.get_user(current_user['uid'])
        
        if not user_data or not user_data.get('plaid_access_token'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Plaid access token found. Please connect your bank account first."
            )
        
        # Get recent transactions
        plaid_service = PlaidService()
        transactions = await plaid_service.get_recent_transactions(
            user_data['plaid_access_token'],
            days
        )
        
        # Get spending insights
        insights = await plaid_service.get_spending_insights(transactions)
        
        return {
            "insights": insights,
            "period_days": days,
            "transaction_count": len(transactions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending insights: {str(e)}"
        )

@router.get("/categories")
async def get_spending_categories(
    current_user: dict = Depends(get_current_user)
):
    """Get spending breakdown by categories"""
    try:
        db_service = DatabaseService()
        
        # Get transactions from database
        transactions = await db_service.get_user_transactions(current_user['uid'])
        
        # Calculate category breakdown
        category_totals = {}
        for transaction in transactions:
            category = transaction.get('category', 'other')
            amount = abs(transaction['amount'])
            
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += amount
        
        # Sort by amount
        sorted_categories = sorted(
            category_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            "categories": [
                {
                    "category": cat,
                    "amount": amount,
                    "percentage": round((amount / sum(category_totals.values())) * 100, 2)
                }
                for cat, amount in sorted_categories
            ],
            "total_spent": sum(category_totals.values())
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending categories: {str(e)}"
        )

@router.delete("/disconnect")
async def disconnect_account(current_user: dict = Depends(get_current_user)):
    """Disconnect Plaid account"""
    try:
        db_service = DatabaseService()
        
        # Remove Plaid access token
        await db_service.update_user(current_user['uid'], {
            'plaid_access_token': None,
            'plaid_connected': False
        })
        
        return {"message": "Account disconnected successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect account: {str(e)}"
        )
