"""
Simple FastAPI Backend for VTFIN
Basic version without external service dependencies
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Create FastAPI app
app = FastAPI(
    title="VTFIN API",
    description="Financial Quest Backend API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic models
class HealthResponse(BaseModel):
    status: str
    message: str

class User(BaseModel):
    id: str
    email: str
    name: str

class Goal(BaseModel):
    id: str
    title: str
    target_amount: float
    current_amount: float
    deadline: str

# Basic routes
@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="success",
        message="VTFIN Backend is running!"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="Backend service is operational"
    )

@app.get("/api/users", response_model=List[User])
async def get_users():
    # Mock data for development
    return [
        User(id="1", email="user1@example.com", name="John Doe"),
        User(id="2", email="user2@example.com", name="Jane Smith")
    ]

@app.get("/api/goals", response_model=List[Goal])
async def get_goals():
    # Mock data for development
    return [
        Goal(
            id="1",
            title="Emergency Fund",
            target_amount=10000.0,
            current_amount=2500.0,
            deadline="2024-12-31"
        ),
        Goal(
            id="2",
            title="Vacation Fund",
            target_amount=5000.0,
            current_amount=1200.0,
            deadline="2024-06-30"
        )
    ]

@app.post("/api/goals", response_model=Goal)
async def create_goal(goal: Goal):
    # In a real app, this would save to database
    return goal

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)