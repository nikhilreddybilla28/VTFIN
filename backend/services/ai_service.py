"""
AI Service using Gemini API for financial recommendations and what-if simulations
"""

import google.generativeai as genai
from typing import List, Dict, Any, Optional
import os
import json
from datetime import datetime, timedelta

class AIService:
    """Service for AI-powered financial insights using Gemini API"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def analyze_spending_patterns(self, transactions: List[Dict[str, Any]], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze spending patterns and provide insights"""
        try:
            # Prepare data for analysis
            spending_data = {
                'transactions': transactions[:50],  # Limit to recent transactions
                'goals': goals,
                'analysis_date': datetime.now().isoformat()
            }
            
            prompt = f"""
            Analyze the following financial data and provide insights:
            
            Transactions: {json.dumps(spending_data['transactions'], default=str)}
            Goals: {json.dumps(spending_data['goals'], default=str)}
            
            Please provide:
            1. Spending pattern analysis
            2. Areas where spending can be optimized
            3. Recommendations for achieving financial goals
            4. Potential risks or concerns
            
            Format the response as JSON with the following structure:
            {{
                "spending_analysis": {{
                    "total_monthly_spending": 0,
                    "top_spending_categories": [],
                    "spending_trends": "description"
                }},
                "optimization_opportunities": [
                    {{
                        "category": "category_name",
                        "current_spending": 0,
                        "potential_savings": 0,
                        "recommendation": "specific advice"
                    }}
                ],
                "goal_recommendations": [
                    {{
                        "goal_id": "goal_id",
                        "recommendation": "specific advice",
                        "priority": "high/medium/low"
                    }}
                ],
                "risks": [
                    {{
                        "type": "risk_type",
                        "description": "risk description",
                        "severity": "high/medium/low"
                    }}
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error analyzing spending patterns: {e}")
            return {}
    
    async def generate_what_if_simulation(self, 
                                        current_transactions: List[Dict[str, Any]], 
                                        simulation_changes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate what-if simulation results"""
        try:
            prompt = f"""
            Create a financial what-if simulation based on the following scenario:
            
            Current Transactions: {json.dumps(current_transactions[:30], default=str)}
            Proposed Changes: {json.dumps(simulation_changes, default=str)}
            
            Simulate the impact of these changes and provide:
            1. Projected savings/impact
            2. Timeline for goal achievement
            3. Risk assessment
            4. Alternative scenarios
            
            Format as JSON:
            {{
                "simulation_results": {{
                    "monthly_savings": 0,
                    "annual_savings": 0,
                    "goal_impact": {{
                        "goal_id": "goal_id",
                        "months_saved": 0,
                        "new_completion_date": "date"
                    }}
                }},
                "scenarios": [
                    {{
                        "name": "scenario_name",
                        "description": "scenario_description",
                        "monthly_savings": 0,
                        "feasibility": "high/medium/low"
                    }}
                ],
                "recommendations": [
                    "specific recommendation 1",
                    "specific recommendation 2"
                ],
                "risks": [
                    "potential risk 1",
                    "potential risk 2"
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error generating what-if simulation: {e}")
            return {}
    
    async def generate_saving_strategies(self, 
                                       user_profile: Dict[str, Any], 
                                       goals: List[Dict[str, Any]], 
                                       spending_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized saving strategies"""
        try:
            prompt = f"""
            Generate personalized saving strategies for a student with the following profile:
            
            User Profile: {json.dumps(user_profile, default=str)}
            Goals: {json.dumps(goals, default=str)}
            Spending Analysis: {json.dumps(spending_analysis, default=str)}
            
            Provide:
            1. Short-term strategies (1-3 months)
            2. Medium-term strategies (3-12 months)
            3. Long-term strategies (1+ years)
            4. Specific actionable steps
            5. Budget recommendations
            
            Format as JSON:
            {{
                "short_term_strategies": [
                    {{
                        "strategy": "strategy_name",
                        "description": "detailed description",
                        "potential_savings": 0,
                        "effort_required": "low/medium/high",
                        "timeline": "1-3 months"
                    }}
                ],
                "medium_term_strategies": [
                    {{
                        "strategy": "strategy_name",
                        "description": "detailed description",
                        "potential_savings": 0,
                        "effort_required": "low/medium/high",
                        "timeline": "3-12 months"
                    }}
                ],
                "long_term_strategies": [
                    {{
                        "strategy": "strategy_name",
                        "description": "detailed description",
                        "potential_savings": 0,
                        "effort_required": "low/medium/high",
                        "timeline": "1+ years"
                    }}
                ],
                "budget_recommendations": {{
                    "recommended_monthly_budget": 0,
                    "category_allocations": {{
                        "category": "percentage"
                    }},
                    "emergency_fund_target": 0
                }},
                "actionable_steps": [
                    "step 1",
                    "step 2",
                    "step 3"
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error generating saving strategies: {e}")
            return {}
    
    async def generate_goal_insights(self, goal: Dict[str, Any], progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate insights for a specific goal"""
        try:
            prompt = f"""
            Analyze this financial goal and provide insights:
            
            Goal: {json.dumps(goal, default=str)}
            Progress Data: {json.dumps(progress_data, default=str)}
            
            Provide:
            1. Progress analysis
            2. Timeline assessment
            3. Optimization suggestions
            4. Risk factors
            5. Motivation tips
            
            Format as JSON:
            {{
                "progress_analysis": {{
                    "current_progress": 0,
                    "on_track": true,
                    "days_ahead_behind": 0,
                    "completion_probability": "high/medium/low"
                }},
                "timeline_assessment": {{
                    "projected_completion": "date",
                    "milestones": [
                        {{
                            "date": "date",
                            "target_amount": 0,
                            "description": "milestone description"
                        }}
                    ]
                }},
                "optimization_suggestions": [
                    {{
                        "suggestion": "suggestion text",
                        "potential_impact": "high/medium/low",
                        "effort_required": "low/medium/high"
                    }}
                ],
                "risk_factors": [
                    {{
                        "risk": "risk description",
                        "probability": "high/medium/low",
                        "mitigation": "mitigation strategy"
                    }}
                ],
                "motivation_tips": [
                    "tip 1",
                    "tip 2",
                    "tip 3"
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error generating goal insights: {e}")
            return {}
    
    async def generate_financial_education(self, user_level: str = "beginner") -> Dict[str, Any]:
        """Generate personalized financial education content"""
        try:
            prompt = f"""
            Generate financial education content for a {user_level} level student:
            
            Topics to cover:
            1. Budgeting basics
            2. Saving strategies
            3. Debt management
            4. Investment basics
            5. Emergency funds
            6. Credit building
            
            Format as JSON:
            {{
                "educational_content": [
                    {{
                        "topic": "topic_name",
                        "title": "content_title",
                        "description": "brief_description",
                        "key_points": ["point1", "point2"],
                        "actionable_tips": ["tip1", "tip2"],
                        "difficulty": "beginner/intermediate/advanced"
                    }}
                ],
                "learning_path": [
                    {{
                        "step": 1,
                        "title": "step_title",
                        "description": "step_description",
                        "estimated_time": "time_estimate"
                    }}
                ],
                "resources": [
                    {{
                        "type": "article/video/tool",
                        "title": "resource_title",
                        "description": "resource_description",
                        "url": "resource_url"
                    }}
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error generating financial education: {e}")
            return {}
