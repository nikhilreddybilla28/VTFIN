"""
Goals management router
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from models.goal import GoalCreate, GoalUpdate, GoalResponse, GoalProgress, SubGoal
from models.database import DatabaseService
from routers.auth import get_current_user

router = APIRouter()

class SubGoalCreate(BaseModel):
    """Request model for creating sub-goal"""
    title: str
    description: Optional[str] = None
    target_amount: float
    due_date: Optional[datetime] = None

class GoalProgressUpdate(BaseModel):
    """Request model for updating goal progress"""
    amount: float

@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal_data: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new financial goal"""
    try:
        db_service = DatabaseService()
        
        goal_dict = {
            'user_id': current_user['uid'],
            'title': goal_data.title,
            'description': goal_data.description,
            'category': goal_data.category.value,
            'priority': goal_data.priority.value,
            'target_amount': goal_data.target_amount,
            'current_amount': 0.0,
            'target_date': goal_data.target_date.isoformat() if goal_data.target_date else None,
            'status': 'active',
            'sub_goals': [],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        goal_id = await db_service.create_goal(goal_dict)
        
        # Get the created goal
        goal = await db_service.get_goal(goal_id)
        
        # Calculate progress
        progress = calculate_goal_progress(goal)
        goal['progress'] = progress
        
        return GoalResponse(**goal)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}"
        )

@router.get("/", response_model=List[GoalResponse])
async def get_user_goals(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all goals for the current user"""
    try:
        db_service = DatabaseService()
        goals = await db_service.get_user_goals(current_user['uid'])
        
        # Filter by status if provided
        if status_filter:
            goals = [goal for goal in goals if goal.get('status') == status_filter]
        
        # Calculate progress for each goal
        for goal in goals:
            progress = calculate_goal_progress(goal)
            goal['progress'] = progress
        
        return [GoalResponse(**goal) for goal in goals]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goals: {str(e)}"
        )

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific goal"""
    try:
        db_service = DatabaseService()
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
        
        # Calculate progress
        progress = calculate_goal_progress(goal)
        goal['progress'] = progress
        
        return GoalResponse(**goal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goal: {str(e)}"
        )

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    update_data: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a goal"""
    try:
        db_service = DatabaseService()
        
        # Check if goal exists and belongs to user
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
        
        # Prepare update data
        update_dict = {}
        if update_data.title is not None:
            update_dict['title'] = update_data.title
        if update_data.description is not None:
            update_dict['description'] = update_data.description
        if update_data.category is not None:
            update_dict['category'] = update_data.category.value
        if update_data.priority is not None:
            update_dict['priority'] = update_data.priority.value
        if update_data.target_amount is not None:
            update_dict['target_amount'] = update_data.target_amount
        if update_data.target_date is not None:
            update_dict['target_date'] = update_data.target_date.isoformat()
        if update_data.status is not None:
            update_dict['status'] = update_data.status.value
            if update_data.status.value == 'completed':
                update_dict['completed_at'] = datetime.utcnow().isoformat()
        
        # Update goal
        success = await db_service.update_goal(goal_id, update_dict)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update goal"
            )
        
        # Get updated goal
        updated_goal = await db_service.get_goal(goal_id)
        progress = calculate_goal_progress(updated_goal)
        updated_goal['progress'] = progress
        
        return GoalResponse(**updated_goal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goal: {str(e)}"
        )

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a goal"""
    try:
        db_service = DatabaseService()
        
        # Check if goal exists and belongs to user
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
        
        # Delete goal
        success = await db_service.delete_goal(goal_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete goal"
            )
        
        return {"message": "Goal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete goal: {str(e)}"
        )

@router.post("/{goal_id}/subgoals", response_model=GoalResponse)
async def add_subgoal(
    goal_id: str,
    subgoal_data: SubGoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a sub-goal to an existing goal"""
    try:
        db_service = DatabaseService()
        
        # Check if goal exists and belongs to user
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
        
        # Create sub-goal
        subgoal = {
            'id': f"sub_{datetime.utcnow().timestamp()}",
            'title': subgoal_data.title,
            'description': subgoal_data.description,
            'target_amount': subgoal_data.target_amount,
            'current_amount': 0.0,
            'due_date': subgoal_data.due_date.isoformat() if subgoal_data.due_date else None,
            'completed': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Add sub-goal to goal
        goal['sub_goals'].append(subgoal)
        await db_service.update_goal(goal_id, {'sub_goals': goal['sub_goals']})
        
        # Get updated goal
        updated_goal = await db_service.get_goal(goal_id)
        progress = calculate_goal_progress(updated_goal)
        updated_goal['progress'] = progress
        
        return GoalResponse(**updated_goal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add sub-goal: {str(e)}"
        )

@router.post("/{goal_id}/progress", response_model=GoalResponse)
async def update_goal_progress(
    goal_id: str,
    progress_data: GoalProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update goal progress by adding amount"""
    try:
        db_service = DatabaseService()
        
        # Check if goal exists and belongs to user
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
        
        # Update current amount
        new_amount = goal['current_amount'] + progress_data.amount
        update_data = {'current_amount': new_amount}
        
        # Check if goal is completed
        if new_amount >= goal['target_amount'] and goal['status'] == 'active':
            update_data['status'] = 'completed'
            update_data['completed_at'] = datetime.utcnow().isoformat()
        
        # Update goal
        await db_service.update_goal(goal_id, update_data)
        
        # Get updated goal
        updated_goal = await db_service.get_goal(goal_id)
        progress = calculate_goal_progress(updated_goal)
        updated_goal['progress'] = progress
        
        return GoalResponse(**updated_goal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goal progress: {str(e)}"
        )

@router.get("/{goal_id}/progress")
async def get_goal_progress(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed progress information for a goal"""
    try:
        db_service = DatabaseService()
        
        # Check if goal exists and belongs to user
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
        
        progress = calculate_goal_progress(goal)
        
        return {
            "goal_id": goal_id,
            "progress": progress,
            "milestones": calculate_milestones(goal),
            "recommendations": generate_progress_recommendations(goal, progress)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goal progress: {str(e)}"
        )

def calculate_goal_progress(goal: dict) -> dict:
    """Calculate progress metrics for a goal"""
    current_amount = goal.get('current_amount', 0)
    target_amount = goal.get('target_amount', 1)
    target_date = goal.get('target_date')
    
    progress_percentage = (current_amount / target_amount) * 100 if target_amount > 0 else 0
    
    # Calculate days remaining
    days_remaining = None
    if target_date:
        target_dt = datetime.fromisoformat(target_date)
        days_remaining = (target_dt - datetime.utcnow()).days
    
    # Determine if on track
    on_track = True
    if target_date and days_remaining is not None:
        if days_remaining > 0:
            daily_target = target_amount / ((datetime.fromisoformat(target_date) - datetime.utcnow()).days + 1)
            current_daily_average = current_amount / max(1, (datetime.utcnow() - datetime.fromisoformat(goal['created_at'])).days)
            on_track = current_daily_average >= daily_target * 0.8  # 80% of target pace
    
    return {
        'progress_percentage': round(progress_percentage, 2),
        'days_remaining': days_remaining,
        'on_track': on_track,
        'amount_remaining': target_amount - current_amount
    }

def calculate_milestones(goal: dict) -> List[dict]:
    """Calculate milestone information for a goal"""
    milestones = []
    target_amount = goal.get('target_amount', 0)
    
    # Create milestones at 25%, 50%, 75%, 100%
    for percentage in [25, 50, 75, 100]:
        milestone_amount = target_amount * (percentage / 100)
        milestones.append({
            'percentage': percentage,
            'amount': milestone_amount,
            'achieved': goal.get('current_amount', 0) >= milestone_amount
        })
    
    return milestones

def generate_progress_recommendations(goal: dict, progress: dict) -> List[str]:
    """Generate recommendations based on goal progress"""
    recommendations = []
    
    if progress['progress_percentage'] < 25:
        recommendations.append("Consider setting up automatic transfers to build momentum")
    elif progress['progress_percentage'] < 50:
        recommendations.append("Great start! Consider increasing your monthly contribution")
    elif progress['progress_percentage'] < 75:
        recommendations.append("You're making excellent progress! Stay consistent")
    else:
        recommendations.append("You're almost there! Consider a final push to complete your goal")
    
    if not progress['on_track'] and progress['days_remaining'] and progress['days_remaining'] > 0:
        recommendations.append("Consider increasing your savings rate to stay on track")
    
    return recommendations
