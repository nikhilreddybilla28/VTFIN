"""
Goal model and related schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class GoalCategory(str, Enum):
    EMERGENCY_FUND = "emergency_fund"
    VACATION = "vacation"
    EDUCATION = "education"
    CAR = "car"
    HOUSE = "house"
    DEBT_PAYOFF = "debt_payoff"
    INVESTMENT = "investment"
    OTHER = "other"

class GoalPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class SubGoal(BaseModel):
    """Sub-goal within a main goal"""
    id: str
    title: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float = 0.0
    due_date: Optional[datetime] = None
    completed: bool = False
    created_at: datetime
    updated_at: datetime

class Goal(BaseModel):
    """Financial goal model"""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: GoalCategory
    priority: GoalPriority
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[datetime] = None
    status: GoalStatus = GoalStatus.ACTIVE
    sub_goals: List[SubGoal] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class GoalCreate(BaseModel):
    """Schema for creating a new goal"""
    title: str
    description: Optional[str] = None
    category: GoalCategory
    priority: GoalPriority
    target_amount: float
    target_date: Optional[datetime] = None

class GoalUpdate(BaseModel):
    """Schema for updating a goal"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    priority: Optional[GoalPriority] = None
    target_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    status: Optional[GoalStatus] = None

class GoalProgress(BaseModel):
    """Goal progress tracking"""
    goal_id: str
    progress_percentage: float
    days_remaining: Optional[int] = None
    on_track: bool
    projected_completion: Optional[datetime] = None

class GoalResponse(BaseModel):
    """Schema for goal response"""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: GoalCategory
    priority: GoalPriority
    target_amount: float
    current_amount: float
    target_date: Optional[datetime] = None
    status: GoalStatus
    sub_goals: List[SubGoal]
    progress: GoalProgress
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
