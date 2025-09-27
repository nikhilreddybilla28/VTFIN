# FinQuest API Documentation

This document provides comprehensive API documentation for the FinQuest backend service.

## Base URL

- Development: `http://localhost:8000`
- Production: `https://your-backend-url.com`

## Authentication

All API endpoints (except health checks) require authentication via Firebase ID tokens.

### Headers

```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

## API Endpoints

### Health Check

#### GET /api/health

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "firebase": "connected",
    "plaid": "configured",
    "gemini": "configured"
  }
}
```

### Authentication

#### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "John Doe"
}
```

**Response:**
```json
{
  "uid": "user-id",
  "email": "user@example.com",
  "display_name": "John Doe",
  "role": "student",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /api/auth/me

Get current user profile.

**Response:**
```json
{
  "uid": "user-id",
  "email": "user@example.com",
  "display_name": "John Doe",
  "role": "student",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Goals Management

#### GET /api/goals/

Get all goals for the current user.

**Query Parameters:**
- `status_filter` (optional): Filter by goal status

**Response:**
```json
[
  {
    "id": "goal-id",
    "user_id": "user-id",
    "title": "Emergency Fund",
    "description": "Build a 6-month emergency fund",
    "category": "emergency_fund",
    "priority": "high",
    "target_amount": 10000.0,
    "current_amount": 2500.0,
    "target_date": "2024-12-31T00:00:00Z",
    "status": "active",
    "progress": {
      "progress_percentage": 25.0,
      "days_remaining": 300,
      "on_track": true
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/goals/

Create a new goal.

**Request Body:**
```json
{
  "title": "Emergency Fund",
  "description": "Build a 6-month emergency fund",
  "category": "emergency_fund",
  "priority": "high",
  "target_amount": 10000.0,
  "target_date": "2024-12-31T00:00:00Z"
}
```

#### GET /api/goals/{goal_id}

Get a specific goal.

#### PUT /api/goals/{goal_id}

Update a goal.

**Request Body:**
```json
{
  "title": "Updated Goal Title",
  "target_amount": 12000.0,
  "status": "active"
}
```

#### DELETE /api/goals/{goal_id}

Delete a goal.

#### POST /api/goals/{goal_id}/progress

Update goal progress.

**Request Body:**
```json
{
  "amount": 500.0
}
```

### Plaid Integration

#### POST /api/plaid/link-token

Create a link token for Plaid Link.

**Response:**
```json
{
  "link_token": "link-sandbox-xxx"
}
```

#### POST /api/plaid/exchange-token

Exchange public token for access token.

**Request Body:**
```json
{
  "public_token": "public-sandbox-xxx"
}
```

#### GET /api/plaid/accounts

Get connected bank accounts.

**Response:**
```json
{
  "accounts": [
    {
      "account_id": "account-id",
      "name": "Checking Account",
      "type": "depository",
      "subtype": "checking",
      "mask": "0000",
      "balances": {
        "available": 1500.0,
        "current": 1500.0
      }
    }
  ]
}
```

#### GET /api/plaid/transactions

Get transactions.

**Query Parameters:**
- `start_date` (optional): Start date (ISO format)
- `end_date` (optional): End date (ISO format)
- `limit` (optional): Number of transactions (default: 100)

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn-id",
      "account_id": "account-id",
      "amount": -25.50,
      "date": "2024-01-15",
      "name": "Coffee Shop",
      "merchant_name": "Starbucks",
      "category": ["Food and Drink", "Restaurants"],
      "pending": false
    }
  ]
}
```

#### GET /api/plaid/spending-insights

Get spending insights and analysis.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "insights": {
    "total_spent": 1250.75,
    "category_breakdown": {
      "food_dining": 400.50,
      "transportation": 200.25,
      "entertainment": 150.00
    },
    "top_categories": [
      ["food_dining", 400.50],
      ["transportation", 200.25]
    ],
    "transaction_count": 45
  },
  "period_days": 30
}
```

### AI Recommendations

#### GET /api/ai/recommendations

Get AI-powered financial recommendations.

**Response:**
```json
{
  "recommendations": {
    "spending_analysis": {
      "total_monthly_spending": 1250.75,
      "top_spending_categories": [
        {
          "category": "food_dining",
          "amount": 400.50,
          "recommendation": "Consider meal planning to reduce dining out costs"
        }
      ],
      "spending_trends": "Your spending has increased 15% this month"
    },
    "saving_strategies": {
      "short_term_strategies": [
        {
          "strategy": "Reduce dining out",
          "description": "Limit dining out to twice per week",
          "potential_savings": 200.0,
          "effort_required": "medium"
        }
      ]
    }
  }
}
```

#### POST /api/ai/what-if

Run what-if simulation.

**Request Body:**
```json
{
  "changes": {
    "reduce_dining_out": true,
    "cancel_subscriptions": ["netflix", "spotify"],
    "increase_savings": 200.0
  },
  "timeframe_months": 12
}
```

**Response:**
```json
{
  "simulation": {
    "monthly_savings": 350.0,
    "annual_savings": 4200.0,
    "goal_impact": {
      "goal_id": "goal-id",
      "months_saved": 3,
      "new_completion_date": "2024-09-30T00:00:00Z"
    }
  },
  "scenario": {
    "reduce_dining_out": true,
    "cancel_subscriptions": ["netflix", "spotify"]
  }
}
```

#### GET /api/ai/goal-insights/{goal_id}

Get AI insights for a specific goal.

**Response:**
```json
{
  "goal_id": "goal-id",
  "insights": {
    "progress_analysis": {
      "current_progress": 25.0,
      "on_track": true,
      "completion_probability": "high"
    },
    "optimization_suggestions": [
      {
        "suggestion": "Increase monthly contribution by $100",
        "potential_impact": "high",
        "effort_required": "low"
      }
    ],
    "motivation_tips": [
      "You're 25% of the way to your goal!",
      "Consider setting up automatic transfers"
    ]
  }
}
```

### Analytics

#### GET /api/analytics/dashboard-data

Get comprehensive dashboard data.

**Response:**
```json
{
  "financial_summary": {
    "total_spent_30_days": 1250.75,
    "total_income_30_days": 3000.0,
    "net_amount": 1749.25,
    "transaction_count": 45
  },
  "goals_summary": {
    "total_goals": 3,
    "active_goals": 2,
    "completed_goals": 1,
    "total_target_amount": 15000.0,
    "total_current_amount": 5000.0,
    "overall_progress": 33.3
  },
  "recent_activity": {
    "recent_transactions": [...],
    "recent_goals": [...]
  }
}
```

#### GET /api/analytics/spending-categories

Get spending breakdown by categories.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "categories": [
    {
      "category": "food_dining",
      "amount": 400.50,
      "percentage": 32.0,
      "transaction_count": 15
    }
  ],
  "total_spent": 1250.75,
  "period_days": 30
}
```

#### POST /api/analytics/charts

Generate chart data for visualization.

**Request Body:**
```json
{
  "chart_type": "spending",
  "date_range": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "chart_type": "pie",
  "data": {
    "labels": ["Food & Dining", "Transportation", "Entertainment"],
    "values": [400.50, 200.25, 150.00]
  },
  "title": "Spending by Category"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

- API calls are limited to 1000 requests per hour per user
- Plaid API calls are limited by Plaid's rate limits
- Gemini API calls are limited by Google's rate limits

## Data Models

### Goal Categories
- `emergency_fund`
- `vacation`
- `education`
- `car`
- `house`
- `debt_payoff`
- `investment`
- `other`

### Goal Priorities
- `low`
- `medium`
- `high`
- `urgent`

### Goal Status
- `active`
- `completed`
- `paused`
- `cancelled`

### Transaction Categories
- `food_dining`
- `transportation`
- `entertainment`
- `shopping`
- `bills_utilities`
- `healthcare`
- `education`
- `travel`
- `subscriptions`
- `savings`
- `investment`
- `other`

## Webhooks

Currently, FinQuest does not support webhooks. All data synchronization is handled through API polling.

## SDKs and Libraries

### Python
```python
import requests

# Example API call
headers = {
    'Authorization': 'Bearer your-firebase-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://your-api-url.com/api/goals/',
    headers=headers
)
```

### JavaScript
```javascript
// Example API call
const response = await fetch('https://your-api-url.com/api/goals/', {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  }
});

const goals = await response.json();
```

## Support

For API support and questions:
1. Check the troubleshooting section in the setup guide
2. Review the error responses above
3. Check the GitHub issues page
4. Contact the development team
