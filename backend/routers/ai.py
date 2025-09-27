"""
AI recommendations and what-if simulations router
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from services.ai_service import AIService
from models.database import DatabaseService
from routers.auth import get_current_user

router = APIRouter()

class WhatIfSimulation(BaseModel):
    """Request model for what-if simulation"""
    changes: Dict[str, Any]
    timeframe_months: int = 12

class AIAnalysisRequest(BaseModel):
    """Request model for AI analysis"""
    analysis_type: str  # "spending", "goals", "general"
    timeframe_days: int = 30

@router.get("/recommendations")
async def get_ai_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered financial recommendations"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get user data
        user_profile = await db_service.get_user(current_user['uid'])
        goals = await db_service.get_user_goals(current_user['uid'])
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=100)
        
        # Get spending analysis
        spending_analysis = await ai_service.analyze_spending_patterns(transactions, goals)
        
        # Generate saving strategies
        saving_strategies = await ai_service.generate_saving_strategies(
            user_profile or {},
            goals,
            spending_analysis
        )
        
        return {
            "recommendations": {
                "spending_analysis": spending_analysis,
                "saving_strategies": saving_strategies,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI recommendations: {str(e)}"
        )

@router.post("/what-if")
async def run_what_if_simulation(
    simulation: WhatIfSimulation,
    current_user: dict = Depends(get_current_user)
):
    """Run what-if simulation"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get user's current transactions
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=200)
        
        # Run simulation
        simulation_results = await ai_service.generate_what_if_simulation(
            transactions,
            simulation.changes
        )
        
        return {
            "simulation": simulation_results,
            "scenario": simulation.changes,
            "timeframe_months": simulation.timeframe_months,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run what-if simulation: {str(e)}"
        )

@router.get("/goal-insights/{goal_id}")
async def get_goal_insights(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get AI insights for a specific goal"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get goal
        goal = await db_service.get_goal(goal_id)
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        if goal['user_id'] != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get progress data
        progress_data = {
            'current_amount': goal.get('current_amount', 0),
            'target_amount': goal.get('target_amount', 0),
            'target_date': goal.get('target_date'),
            'created_at': goal.get('created_at'),
            'status': goal.get('status')
        }
        
        # Generate insights
        insights = await ai_service.generate_goal_insights(goal, progress_data)
        
        return {
            "goal_id": goal_id,
            "insights": insights,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goal insights: {str(e)}"
        )

@router.get("/spending-analysis")
async def get_spending_analysis(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered spending analysis"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get transactions for the specified period
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=500)
        
        # Filter transactions by date range
        filtered_transactions = [
            t for t in transactions
            if start_date <= datetime.fromisoformat(t['date']) <= end_date
        ]
        
        # Get goals for context
        goals = await db_service.get_user_goals(current_user['uid'])
        
        # Analyze spending patterns
        analysis = await ai_service.analyze_spending_patterns(filtered_transactions, goals)
        
        return {
            "analysis": analysis,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "transaction_count": len(filtered_transactions),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get spending analysis: {str(e)}"
        )

@router.get("/education")
async def get_financial_education(
    level: str = "beginner",
    current_user: dict = Depends(get_current_user)
):
    """Get personalized financial education content"""
    try:
        ai_service = AIService()
        
        # Generate educational content
        education_content = await ai_service.generate_financial_education(level)
        
        return {
            "education": education_content,
            "user_level": level,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get financial education: {str(e)}"
        )

@router.post("/analyze")
async def run_custom_analysis(
    request: AIAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Run custom AI analysis"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get relevant data based on analysis type
        if request.analysis_type == "spending":
            transactions = await db_service.get_user_transactions(
                current_user['uid'], 
                limit=200
            )
            goals = await db_service.get_user_goals(current_user['uid'])
            analysis = await ai_service.analyze_spending_patterns(transactions, goals)
            
        elif request.analysis_type == "goals":
            goals = await db_service.get_user_goals(current_user['uid'])
            user_profile = await db_service.get_user(current_user['uid'])
            analysis = await ai_service.generate_saving_strategies(
                user_profile or {},
                goals,
                {}
            )
            
        else:  # general
            user_profile = await db_service.get_user(current_user['uid'])
            goals = await db_service.get_user_goals(current_user['uid'])
            transactions = await db_service.get_user_transactions(current_user['uid'], limit=100)
            
            spending_analysis = await ai_service.analyze_spending_patterns(transactions, goals)
            saving_strategies = await ai_service.generate_saving_strategies(
                user_profile or {},
                goals,
                spending_analysis
            )
            
            analysis = {
                "spending_analysis": spending_analysis,
                "saving_strategies": saving_strategies
            }
        
        return {
            "analysis_type": request.analysis_type,
            "results": analysis,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run analysis: {str(e)}"
        )

@router.get("/insights/dashboard")
async def get_dashboard_insights(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard insights"""
    try:
        ai_service = AIService()
        db_service = DatabaseService()
        
        # Get all user data
        user_profile = await db_service.get_user(current_user['uid'])
        goals = await db_service.get_user_goals(current_user['uid'])
        transactions = await db_service.get_user_transactions(current_user['uid'], limit=100)
        
        # Generate comprehensive insights
        spending_analysis = await ai_service.analyze_spending_patterns(transactions, goals)
        saving_strategies = await ai_service.generate_saving_strategies(
            user_profile or {},
            goals,
            spending_analysis
        )
        
        # Get insights for each active goal
        goal_insights = {}
        for goal in goals:
            if goal.get('status') == 'active':
                progress_data = {
                    'current_amount': goal.get('current_amount', 0),
                    'target_amount': goal.get('target_amount', 0),
                    'target_date': goal.get('target_date'),
                    'created_at': goal.get('created_at'),
                    'status': goal.get('status')
                }
                insights = await ai_service.generate_goal_insights(goal, progress_data)
                goal_insights[goal['id']] = insights
        
        return {
            "dashboard_insights": {
                "spending_analysis": spending_analysis,
                "saving_strategies": saving_strategies,
                "goal_insights": goal_insights,
                "summary": generate_dashboard_summary(spending_analysis, saving_strategies, goals)
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard insights: {str(e)}"
        )

def generate_dashboard_summary(spending_analysis: dict, saving_strategies: dict, goals: list) -> dict:
    """Generate a summary for the dashboard"""
    active_goals = [goal for goal in goals if goal.get('status') == 'active']
    completed_goals = [goal for goal in goals if goal.get('status') == 'completed']
    
    return {
        "total_goals": len(goals),
        "active_goals": len(active_goals),
        "completed_goals": len(completed_goals),
        "total_target_amount": sum(goal.get('target_amount', 0) for goal in active_goals),
        "total_current_amount": sum(goal.get('current_amount', 0) for goal in active_goals),
        "overall_progress": calculate_overall_progress(active_goals),
        "key_recommendations": extract_key_recommendations(saving_strategies)
    }

def calculate_overall_progress(goals: list) -> float:
    """Calculate overall progress across all goals"""
    if not goals:
        return 0.0
    
    total_progress = 0
    for goal in goals:
        current = goal.get('current_amount', 0)
        target = goal.get('target_amount', 1)
        progress = (current / target) * 100 if target > 0 else 0
        total_progress += progress
    
    return round(total_progress / len(goals), 2)

def extract_key_recommendations(saving_strategies: dict) -> list:
    """Extract key recommendations from saving strategies"""
    recommendations = []
    
    if 'short_term_strategies' in saving_strategies:
        for strategy in saving_strategies['short_term_strategies'][:2]:  # Top 2
            recommendations.append({
                'type': 'short_term',
                'strategy': strategy.get('strategy', ''),
                'description': strategy.get('description', ''),
                'potential_savings': strategy.get('potential_savings', 0)
            })
    
    return recommendations
