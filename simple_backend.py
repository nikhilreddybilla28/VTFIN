from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List
import json
import os

app = FastAPI(title="VTFIN API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Goal(BaseModel):
    id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: str
    description: str

class Transaction(BaseModel):
    id: str
    amount: float
    category: str
    description: str
    date: str

class UserProfile(BaseModel):
    name: str
    email: str
    monthly_income: float
    currency: str

# Mock data storage (in a real app, this would be a database)
goals_data = [
    {
        "id": "1",
        "name": "Emergency Fund",
        "target_amount": 10000.0,
        "current_amount": 2500.0,
        "deadline": "2024-12-31",
        "description": "Build a safety net for unexpected expenses"
    },
    {
        "id": "2", 
        "name": "Vacation Fund",
        "target_amount": 5000.0,
        "current_amount": 1200.0,
        "deadline": "2024-06-30",
        "description": "Save for that dream vacation to Europe"
    },
    {
        "id": "3",
        "name": "New Car",
        "target_amount": 25000.0,
        "current_amount": 8500.0,
        "deadline": "2025-03-15",
        "description": "Save for a reliable new vehicle"
    }
]

transactions_data = [
    {"id": "1", "amount": -45.67, "category": "Food", "description": "Grocery shopping", "date": "2024-01-15"},
    {"id": "2", "amount": -120.00, "category": "Transportation", "description": "Gas station", "date": "2024-01-14"},
    {"id": "3", "amount": 4200.00, "category": "Income", "description": "Monthly salary", "date": "2024-01-01"},
    {"id": "4", "amount": -89.99, "category": "Entertainment", "description": "Movie tickets", "date": "2024-01-13"},
    {"id": "5", "amount": -250.00, "category": "Utilities", "description": "Electricity bill", "date": "2024-01-12"},
]

user_profile = {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "monthly_income": 4200.0,
    "currency": "USD"
}

# Routes
@app.get("/")
async def root():
    return {"message": "VTFIN API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "All systems operational"}

# Goals endpoints
@app.get("/api/goals", response_model=List[Goal])
async def get_goals():
    return goals_data

@app.post("/api/goals", response_model=Goal)
async def create_goal(goal: Goal):
    goals_data.append(goal.dict())
    return goal

@app.get("/api/goals/{goal_id}", response_model=Goal)
async def get_goal(goal_id: str):
    for goal in goals_data:
        if goal["id"] == goal_id:
            return goal
    raise HTTPException(status_code=404, detail="Goal not found")

@app.put("/api/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, goal: Goal):
    for i, existing_goal in enumerate(goals_data):
        if existing_goal["id"] == goal_id:
            goals_data[i] = goal.dict()
            return goal
    raise HTTPException(status_code=404, detail="Goal not found")

@app.delete("/api/goals/{goal_id}")
async def delete_goal(goal_id: str):
    for i, goal in enumerate(goals_data):
        if goal["id"] == goal_id:
            goals_data.pop(i)
            return {"message": "Goal deleted successfully"}
    raise HTTPException(status_code=404, detail="Goal not found")

# Transactions endpoints
@app.get("/api/transactions", response_model=List[Transaction])
async def get_transactions():
    return transactions_data

@app.post("/api/transactions", response_model=Transaction)
async def create_transaction(transaction: Transaction):
    transactions_data.append(transaction.dict())
    return transaction

# Analytics endpoints
@app.get("/api/analytics/spending")
async def get_spending_analytics():
    spending_by_category = {}
    for transaction in transactions_data:
        if transaction["amount"] < 0:  # Only expenses
            category = transaction["category"]
            amount = abs(transaction["amount"])
            spending_by_category[category] = spending_by_category.get(category, 0) + amount
    
    return {
        "total_spending": sum(spending_by_category.values()),
        "by_category": spending_by_category,
        "top_categories": sorted(spending_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    }

@app.get("/api/analytics/summary")
async def get_financial_summary():
    total_income = sum(t["amount"] for t in transactions_data if t["amount"] > 0)
    total_expenses = sum(abs(t["amount"]) for t in transactions_data if t["amount"] < 0)
    net_worth = total_income - total_expenses
    
    # Calculate goal progress
    total_goal_amount = sum(goal["target_amount"] for goal in goals_data)
    total_saved = sum(goal["current_amount"] for goal in goals_data)
    goal_progress = (total_saved / total_goal_amount * 100) if total_goal_amount > 0 else 0
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_worth": net_worth,
        "savings_rate": ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0,
        "goal_progress": goal_progress,
        "active_goals": len(goals_data)
    }

# User profile endpoints
@app.get("/api/profile", response_model=UserProfile)
async def get_profile():
    return user_profile

@app.put("/api/profile", response_model=UserProfile)
async def update_profile(profile: UserProfile):
    global user_profile
    user_profile = profile.dict()
    return profile

# Serve the HTML file
@app.get("/app", response_class=HTMLResponse)
async def serve_app():
    try:
        with open("vtfin_app.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="HTML app not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)