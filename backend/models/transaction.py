"""
Transaction model and related schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class TransactionCategory(str, Enum):
    FOOD_DINING = "food_dining"
    TRANSPORTATION = "transportation"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    BILLS_UTILITIES = "bills_utilities"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    TRAVEL = "travel"
    SUBSCRIPTIONS = "subscriptions"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    OTHER = "other"

class Transaction(BaseModel):
    """Transaction model"""
    id: str
    user_id: str
    account_id: str
    transaction_id: str  # Plaid transaction ID
    amount: float
    type: TransactionType
    category: TransactionCategory
    subcategory: Optional[str] = None
    merchant_name: Optional[str] = None
    description: str
    date: datetime
    pending: bool = False
    account_owner: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TransactionCreate(BaseModel):
    """Schema for creating a transaction"""
    account_id: str
    amount: float
    type: TransactionType
    category: TransactionCategory
    subcategory: Optional[str] = None
    merchant_name: Optional[str] = None
    description: str
    date: datetime

class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    category: Optional[TransactionCategory] = None
    subcategory: Optional[str] = None
    merchant_name: Optional[str] = None
    description: Optional[str] = None

class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: str
    user_id: str
    account_id: str
    transaction_id: str
    amount: float
    type: TransactionType
    category: TransactionCategory
    subcategory: Optional[str] = None
    merchant_name: Optional[str] = None
    description: str
    date: datetime
    pending: bool
    account_owner: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SpendingCategory(BaseModel):
    """Spending by category"""
    category: TransactionCategory
    total_amount: float
    transaction_count: int
    percentage: float

class SpendingSummary(BaseModel):
    """Spending summary for a period"""
    period_start: datetime
    period_end: datetime
    total_spent: float
    total_income: float
    net_amount: float
    categories: List[SpendingCategory]
    top_merchants: List[dict]
    trends: dict
