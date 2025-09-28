from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional

# Production configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8080))

app = FastAPI(
    title="VTFIN API", 
    version="1.0.0",
    description="Financial Quest API - Personal Finance Management"
)

# Pydantic models for request/response
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Goal(BaseModel):
    id: Optional[int] = None
    name: str
    target: float
    current: float
    category: str
    deadline: str

class Transaction(BaseModel):
    id: Optional[int] = None
    description: str
    amount: float
    type: str
    date: str

# Configure CORS for production and development
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5000", 
    "http://127.0.0.1:5001",
    "https://vtfin.vercel.app",  # Production frontend URL
    "https://vtfin-frontend.vercel.app",  # Alternative frontend URL
]

if ENVIRONMENT == "development":
    allowed_origins.extend([
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"  # Allow all in development
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for the HTML frontend
mock_data = {
    "user": {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com",
        "balance": 15234.50,
        "monthlyIncome": 5000,
        "monthlyExpenses": 3200
    },
    "goals": [
        {
            "id": 1,
            "name": "Emergency Fund",
            "target": 10000,
            "current": 4500,
            "category": "emergency",
            "deadline": "2024-12-31"
        },
        {
            "id": 2,
            "name": "Vacation Fund",
            "target": 5000,
            "current": 1200,
            "category": "travel",
            "deadline": "2024-06-30"
        },
        {
            "id": 3,
            "name": "New Car",
            "target": 25000,
            "current": 8750,
            "category": "transportation",
            "deadline": "2025-03-15"
        }
    ],
    "transactions": [
        {"id": 1, "description": "Salary", "amount": 5000, "type": "income", "date": "2024-01-01"},
        {"id": 2, "description": "Rent", "amount": -1200, "type": "expense", "date": "2024-01-02"},
        {"id": 3, "description": "Groceries", "amount": -150, "type": "expense", "date": "2024-01-03"},
        {"id": 4, "description": "Emergency Fund Deposit", "amount": -500, "type": "savings", "date": "2024-01-05"},
        {"id": 5, "description": "Freelance Work", "amount": 800, "type": "income", "date": "2024-01-07"},
    ]
}

@app.get("/")
async def serve_index():
    return FileResponse('index.html')

@app.get("/app")
async def serve_app():
    return FileResponse('index.html')

@app.get("/favicon.ico")
async def favicon():
    # Return a simple response for favicon requests
    return {"message": "No favicon"}

# Authentication endpoints
@app.post("/api/auth/login")
async def login(login_request: LoginRequest):
    # Mock authentication - in real app, verify credentials
    if login_request.email and login_request.password:
        return {
            "success": True,
            "access_token": "mock_jwt_token_12345",
            "token_type": "bearer",
            "user": mock_data["user"]
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/register")
async def register(login_request: LoginRequest):
    # Mock registration
    return {"message": "User registered successfully", "user": mock_data["user"]}

@app.post("/api/auth/logout")
async def logout():
    # Mock logout
    return {"message": "Logged out successfully"}

@app.get("/api/user")
async def get_user():
    return mock_data["user"]

@app.get("/api/goals")
async def get_goals():
    return mock_data["goals"]

@app.post("/api/goals")
async def create_goal(goal: Goal):
    # Add new goal with auto-generated ID
    new_id = max([g["id"] for g in mock_data["goals"]]) + 1
    new_goal = goal.dict()
    new_goal["id"] = new_id
    mock_data["goals"].append(new_goal)
    return new_goal

@app.put("/api/goals/{goal_id}")
async def update_goal(goal_id: int, goal: Goal):
    # Update existing goal
    for i, g in enumerate(mock_data["goals"]):
        if g["id"] == goal_id:
            updated_goal = goal.dict()
            updated_goal["id"] = goal_id
            mock_data["goals"][i] = updated_goal
            return updated_goal
    raise HTTPException(status_code=404, detail="Goal not found")

@app.delete("/api/goals/{goal_id}")
async def delete_goal(goal_id: int):
    # Delete goal
    for i, g in enumerate(mock_data["goals"]):
        if g["id"] == goal_id:
            deleted_goal = mock_data["goals"].pop(i)
            return {"message": "Goal deleted", "goal": deleted_goal}
    raise HTTPException(status_code=404, detail="Goal not found")

@app.get("/api/transactions")
async def get_transactions():
    return mock_data["transactions"]

@app.post("/api/transactions")
async def create_transaction(transaction: Transaction):
    # Add new transaction with auto-generated ID
    new_id = max([t["id"] for t in mock_data["transactions"]]) + 1
    new_transaction = transaction.dict()
    new_transaction["id"] = new_id
    mock_data["transactions"].append(new_transaction)
    return new_transaction

@app.get("/api/analytics/spending")
async def get_spending_analytics():
    # Mock spending analytics
    return {
        "categories": ["Food", "Transport", "Entertainment", "Bills", "Shopping"],
        "amounts": [450, 320, 180, 890, 240],
        "monthly_trend": [3200, 3450, 3100, 3300, 3200, 3400]
    }

@app.get("/api/analytics/income")
async def get_income_analytics():
    # Mock income analytics
    return {
        "sources": ["Salary", "Freelance", "Investments", "Other"],
        "amounts": [5000, 800, 200, 150],
        "monthly_trend": [5000, 5200, 4800, 5100, 5000, 5300]
    }

@app.get("/api/analytics/dashboard-data")
async def get_dashboard_analytics():
    # Mock dashboard analytics data
    return {
        "totalBalance": 15234.50,
        "monthlyIncome": 5000,
        "monthlyExpenses": 3200,
        "savingsRate": 36,
        "goalProgress": {
            "completed": 1,
            "inProgress": 2,
            "total": 3
        },
        "recentTransactions": mock_data["transactions"][-5:],
        "upcomingBills": [
            {"name": "Rent", "amount": 1200, "dueDate": "2024-02-01"},
            {"name": "Electric Bill", "amount": 85, "dueDate": "2024-02-05"}
        ]
    }

@app.get("/api/streaks")
async def get_streaks():
    # Mock streaks data
    return [
        {
            "id": 1,
            "name": "Daily Savings",
            "description": "Save money every day",
            "currentStreak": 15,
            "longestStreak": 23,
            "isActive": True,
            "category": "savings"
        },
        {
            "id": 2,
            "name": "No Unnecessary Purchases",
            "description": "Avoid impulse buying",
            "currentStreak": 7,
            "longestStreak": 12,
            "isActive": True,
            "category": "spending"
        },
        {
            "id": 3,
            "name": "Budget Tracking",
            "description": "Check budget daily",
            "currentStreak": 0,
            "longestStreak": 8,
            "isActive": False,
            "category": "planning"
        }
    ]

@app.post("/api/streaks")
async def create_streak(streak: dict):
    # Mock streak creation
    new_streak = streak
    new_streak["id"] = 4
    return new_streak

@app.get("/api/ai/recommendations")
async def get_ai_recommendations():
    # Mock AI recommendations
    return {
        "recommendations": [
            {
                "id": 1,
                "type": "saving",
                "title": "Increase Emergency Fund",
                "description": "Based on your spending patterns, consider increasing your emergency fund target to $12,000",
                "priority": "high",
                "potentialSavings": 500
            },
            {
                "id": 2,
                "type": "spending",
                "title": "Reduce Dining Out",
                "description": "You've spent 23% more on dining out this month. Consider meal prepping to save money",
                "priority": "medium",
                "potentialSavings": 200
            },
            {
                "id": 3,
                "type": "investment",
                "title": "Consider Index Funds",
                "description": "With your current savings rate, you could invest $800/month in low-cost index funds",
                "priority": "low",
                "potentialSavings": 0
            }
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Backend is operational"}

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=PORT,
        log_level="info" if ENVIRONMENT == "production" else "debug"
    )