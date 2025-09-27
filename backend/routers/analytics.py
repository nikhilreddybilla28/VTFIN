"""
Analytics and visualization router
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import json

from models.database import DatabaseService
from routers.auth import get_current_user

router = APIRouter()

class DateRange(BaseModel):
    """Request model for date range"""
    start_date: datetime
    end_date: datetime

class ChartRequest(BaseModel):
    """Request model for chart generation"""
    chart_type: str  # "spending", "goals", "trends", "categories"
    date_range: Optional[DateRange] = None
    category_filter: Optional[str] = None

@router.get("/spending-summary")
async def get_spending_summary(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get spending summary for a period"""
    try:
        db_service = DatabaseService()
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get spending summary
        summary = await db_service.get_spending_summary(
            current_user['uid'],
            start_date,
            end_date
        )
        
        return {
            "summary": summary,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending summary: {str(e)}"
        )

@router.get("/spending-categories")
async def get_spending_by_categories(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get spending breakdown by categories"""
    try:
        db_service = DatabaseService()
        
        # Get transactions
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=500)
        
        # Filter by date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        filtered_transactions = [
            t for t in transactions
            if start_date <= datetime.fromisoformat(t['date']) <= end_date
        ]
        
        # Calculate category totals
        category_totals = {}
        for transaction in filtered_transactions:
            if transaction.get('type') == 'debit':  # Only spending, not income
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
        
        total_spent = sum(category_totals.values())
        
        return {
            "categories": [
                {
                    "category": cat,
                    "amount": amount,
                    "percentage": round((amount / total_spent) * 100, 2) if total_spent > 0 else 0,
                    "transaction_count": len([t for t in filtered_transactions 
                                           if t.get('category') == cat and t.get('type') == 'debit'])
                }
                for cat, amount in sorted_categories
            ],
            "total_spent": total_spent,
            "period_days": days
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending categories: {str(e)}"
        )

@router.get("/goals-progress")
async def get_goals_progress(
    current_user: dict = Depends(get_current_user)
):
    """Get progress summary for all goals"""
    try:
        db_service = DatabaseService()
        goals = await db_service.get_user_goals(current_user['uid'])
        
        # Calculate progress for each goal
        goals_progress = []
        for goal in goals:
            current_amount = goal.get('current_amount', 0)
            target_amount = goal.get('target_amount', 1)
            progress_percentage = (current_amount / target_amount) * 100 if target_amount > 0 else 0
            
            # Calculate days remaining
            days_remaining = None
            if goal.get('target_date'):
                target_date = datetime.fromisoformat(goal['target_date'])
                days_remaining = (target_date - datetime.utcnow()).days
            
            goals_progress.append({
                "goal_id": goal['id'],
                "title": goal.get('title', ''),
                "category": goal.get('category', ''),
                "current_amount": current_amount,
                "target_amount": target_amount,
                "progress_percentage": round(progress_percentage, 2),
                "days_remaining": days_remaining,
                "status": goal.get('status', 'active'),
                "created_at": goal.get('created_at'),
                "target_date": goal.get('target_date')
            })
        
        # Sort by progress percentage
        goals_progress.sort(key=lambda x: x['progress_percentage'], reverse=True)
        
        return {
            "goals": goals_progress,
            "summary": {
                "total_goals": len(goals),
                "active_goals": len([g for g in goals if g.get('status') == 'active']),
                "completed_goals": len([g for g in goals if g.get('status') == 'completed']),
                "average_progress": round(sum(g['progress_percentage'] for g in goals_progress) / len(goals_progress), 2) if goals_progress else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goals progress: {str(e)}"
        )

@router.post("/charts")
async def generate_chart(
    request: ChartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate chart data for visualization"""
    try:
        db_service = DatabaseService()
        
        # Set date range
        if request.date_range:
            start_date = request.date_range.start_date
            end_date = request.date_range.end_date
        else:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        
        if request.chart_type == "spending":
            return await generate_spending_chart(db_service, current_user['uid'], start_date, end_date)
        elif request.chart_type == "goals":
            return await generate_goals_chart(db_service, current_user['uid'])
        elif request.chart_type == "trends":
            return await generate_trends_chart(db_service, current_user['uid'], start_date, end_date)
        elif request.chart_type == "categories":
            return await generate_categories_chart(db_service, current_user['uid'], start_date, end_date)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chart type"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chart: {str(e)}"
        )

@router.get("/trends")
async def get_spending_trends(
    days: int = 90,
    current_user: dict = Depends(get_current_user)
):
    """Get spending trends over time"""
    try:
        db_service = DatabaseService()
        
        # Get transactions
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=1000)
        
        # Filter by date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        filtered_transactions = [
            t for t in transactions
            if start_date <= datetime.fromisoformat(t['date']) <= end_date
        ]
        
        # Group by date
        daily_spending = {}
        for transaction in filtered_transactions:
            if transaction.get('type') == 'debit':
                date = datetime.fromisoformat(transaction['date']).date()
                amount = abs(transaction['amount'])
                
                if date not in daily_spending:
                    daily_spending[date] = 0
                daily_spending[date] += amount
        
        # Sort by date
        sorted_dates = sorted(daily_spending.items())
        
        return {
            "trends": [
                {
                    "date": date.isoformat(),
                    "amount": amount
                }
                for date, amount in sorted_dates
            ],
            "period_days": days,
            "total_transactions": len(filtered_transactions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending trends: {str(e)}"
        )

@router.get("/dashboard-data")
async def get_dashboard_data(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard data"""
    try:
        db_service = DatabaseService()
        
        # Get all data
        goals = await db_service.get_user_goals(current_user['uid'])
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=200)
        
        # Calculate metrics
        active_goals = [g for g in goals if g.get('status') == 'active']
        completed_goals = [g for g in goals if g.get('status') == 'completed']
        
        # Spending metrics
        recent_transactions = [
            t for t in transactions
            if datetime.fromisoformat(t['date']) >= datetime.utcnow() - timedelta(days=30)
        ]
        
        total_spent = sum(abs(t['amount']) for t in recent_transactions if t.get('type') == 'debit')
        total_income = sum(t['amount'] for t in recent_transactions if t.get('type') == 'credit')
        
        # Goals metrics
        total_target = sum(g.get('target_amount', 0) for g in active_goals)
        total_current = sum(g.get('current_amount', 0) for g in active_goals)
        overall_progress = (total_current / total_target * 100) if total_target > 0 else 0
        
        return {
            "financial_summary": {
                "total_spent_30_days": total_spent,
                "total_income_30_days": total_income,
                "net_amount": total_income - total_spent,
                "transaction_count": len(recent_transactions)
            },
            "goals_summary": {
                "total_goals": len(goals),
                "active_goals": len(active_goals),
                "completed_goals": len(completed_goals),
                "total_target_amount": total_target,
                "total_current_amount": total_current,
                "overall_progress": round(overall_progress, 2)
            },
            "recent_activity": {
                "recent_transactions": recent_transactions[:10],
                "recent_goals": sorted(goals, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard data: {str(e)}"
        )

async def generate_spending_chart(db_service: DatabaseService, user_id: str, start_date: datetime, end_date: datetime) -> dict:
    """Generate spending chart data"""
    transactions = await db_service.get_user_transactions(user_id, limit=500)
    
    # Filter by date range
    filtered_transactions = [
        t for t in transactions
        if start_date <= datetime.fromisoformat(t['date']) <= end_date and t.get('type') == 'debit'
    ]
    
    # Group by category
    category_totals = {}
    for transaction in filtered_transactions:
        category = transaction.get('category', 'other')
        amount = abs(transaction['amount'])
        
        if category not in category_totals:
            category_totals[category] = 0
        category_totals[category] += amount
    
    # Create pie chart data
    labels = list(category_totals.keys())
    values = list(category_totals.values())
    
    return {
        "chart_type": "pie",
        "data": {
            "labels": labels,
            "values": values
        },
        "title": "Spending by Category",
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    }

async def generate_goals_chart(db_service: DatabaseService, user_id: str) -> dict:
    """Generate goals progress chart"""
    goals = await db_service.get_user_goals(user_id)
    
    # Prepare data for bar chart
    goal_names = []
    progress_values = []
    target_values = []
    
    for goal in goals:
        if goal.get('status') == 'active':
            goal_names.append(goal.get('title', 'Untitled Goal'))
            current = goal.get('current_amount', 0)
            target = goal.get('target_amount', 1)
            progress = (current / target * 100) if target > 0 else 0
            progress_values.append(progress)
            target_values.append(100)
    
    return {
        "chart_type": "bar",
        "data": {
            "labels": goal_names,
            "current_progress": progress_values,
            "target": target_values
        },
        "title": "Goals Progress",
        "description": "Current progress towards your financial goals"
    }

async def generate_trends_chart(db_service: DatabaseService, user_id: str, start_date: datetime, end_date: datetime) -> dict:
    """Generate spending trends chart"""
    transactions = await db_service.get_user_transactions(user_id, limit=1000)
    
    # Filter and group by week
    weekly_spending = {}
    for transaction in transactions:
        if transaction.get('type') == 'debit':
            date = datetime.fromisoformat(transaction['date'])
            if start_date <= date <= end_date:
                # Get week start
                week_start = date - timedelta(days=date.weekday())
                week_key = week_start.strftime('%Y-%m-%d')
                
                if week_key not in weekly_spending:
                    weekly_spending[week_key] = 0
                weekly_spending[week_key] += abs(transaction['amount'])
    
    # Sort by date
    sorted_weeks = sorted(weekly_spending.items())
    
    return {
        "chart_type": "line",
        "data": {
            "labels": [week for week, _ in sorted_weeks],
            "values": [amount for _, amount in sorted_weeks]
        },
        "title": "Weekly Spending Trends",
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    }

async def generate_categories_chart(db_service: DatabaseService, user_id: str, start_date: datetime, end_date: datetime) -> dict:
    """Generate categories comparison chart"""
    transactions = await db_service.get_user_transactions(user_id, limit=500)
    
    # Filter by date range
    filtered_transactions = [
        t for t in transactions
        if start_date <= datetime.fromisoformat(t['date']) <= end_date and t.get('type') == 'debit'
    ]
    
    # Group by category
    category_totals = {}
    for transaction in filtered_transactions:
        category = transaction.get('category', 'other')
        amount = abs(transaction['amount'])
        
        if category not in category_totals:
            category_totals[category] = 0
        category_totals[category] += amount
    
    # Sort by amount
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "chart_type": "horizontal_bar",
        "data": {
            "labels": [cat for cat, _ in sorted_categories],
            "values": [amount for _, amount in sorted_categories]
        },
        "title": "Spending by Category",
        "description": "Total spending amount by category"
    }
