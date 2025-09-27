#!/usr/bin/env python3
"""
Simple FinQuest Backend Server
A lightweight version that can run without complex dependencies
"""

import json
import os
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.parse

class FinQuestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if path == '/api/health':
            response = {
                "status": "healthy",
                "services": {
                    "firebase": "configured",
                    "plaid": "configured", 
                    "gemini": "configured"
                },
                "message": "FinQuest API is running! 🌱"
            }
        elif path == '/api/analytics/dashboard-data':
            response = {
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
                    "recent_transactions": [
                        {
                            "id": "1",
                            "description": "Coffee Shop",
                            "amount": -4.50,
                            "type": "debit",
                            "category": "food_dining",
                            "date": "2024-01-15T10:30:00Z"
                        },
                        {
                            "id": "2", 
                            "description": "Salary",
                            "amount": 3000.0,
                            "type": "credit",
                            "category": "income",
                            "date": "2024-01-01T09:00:00Z"
                        }
                    ],
                    "recent_goals": [
                        {
                            "id": "1",
                            "title": "Emergency Fund",
                            "target_amount": 10000.0,
                            "current_amount": 2500.0,
                            "status": "active"
                        }
                    ]
                }
            }
        elif path == '/api/goals/':
            response = [
                {
                    "id": "1",
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
                        "on_track": True
                    },
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-15T00:00:00Z"
                },
                {
                    "id": "2",
                    "title": "Vacation Fund",
                    "description": "Save for summer vacation",
                    "category": "vacation",
                    "priority": "medium",
                    "target_amount": 2000.0,
                    "current_amount": 800.0,
                    "target_date": "2024-06-30T00:00:00Z",
                    "status": "active",
                    "progress": {
                        "progress_percentage": 40.0,
                        "days_remaining": 150,
                        "on_track": True
                    },
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-15T00:00:00Z"
                }
            ]
        else:
            response = {"message": "FinQuest API endpoint", "path": path}
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            data = {}
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/plaid/link-token':
            response = {
                "link_token": "link-sandbox-demo-token-12345",
                "message": "Demo link token generated"
            }
        elif path == '/api/plaid/exchange-token':
            response = {
                "access_token": "access-sandbox-demo-token-12345",
                "success": True,
                "message": "Demo access token generated"
            }
        elif path == '/api/plaid/accounts':
            response = {
                "accounts": [
                    {
                        "account_id": "demo-checking-123",
                        "name": "Demo Checking Account",
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
        elif path == '/api/plaid/transactions':
            response = {
                "transactions": [
                    {
                        "transaction_id": "txn-1",
                        "account_id": "demo-checking-123",
                        "amount": -25.50,
                        "date": "2024-01-15",
                        "name": "Coffee Shop",
                        "merchant_name": "Starbucks",
                        "category": ["Food and Drink", "Restaurants"],
                        "pending": False
                    },
                    {
                        "transaction_id": "txn-2",
                        "account_id": "demo-checking-123", 
                        "amount": -150.00,
                        "date": "2024-01-14",
                        "name": "Grocery Store",
                        "merchant_name": "Whole Foods",
                        "category": ["Food and Drink", "Groceries"],
                        "pending": False
                    }
                ]
            }
        elif path == '/api/ai/recommendations':
            response = {
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
        else:
            response = {"message": "Demo API response", "path": path, "data": data}
        
        self.wfile.write(json.dumps(response).encode())

def run_server(port=8000):
    """Run the FinQuest demo server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, FinQuestHandler)
    print(f"🌱 FinQuest Demo Server running on http://localhost:{port}")
    print(f"📊 API Documentation: http://localhost:{port}/api/health")
    print(f"🎯 Dashboard Data: http://localhost:{port}/api/analytics/dashboard-data")
    print(f"🎯 Goals Data: http://localhost:{port}/api/goals/")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

