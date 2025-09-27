#!/usr/bin/env node

/**
 * FinQuest Demo Backend Server
 * A Node.js server that provides all FinQuest API endpoints
 */

const http = require('http');
const url = require('url');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8001;

// Gemini AI Configuration
const GEMINI_API_KEY = 'AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Plaid Configuration
const PLAID_CLIENT_ID = '68d7732f1059f3002356b0ff';
const PLAID_SECRET = '21ce3b9e390661c338e520d82049d4';
const PLAID_ENV = 'sandbox';

// Demo data - Start with empty arrays for fresh start
const demoGoals = [];

// Transactions are now loaded from JSON file

// Streaks data - Start with empty array for fresh start
const demoStreaks = [];

// User spending data for AI analysis
const userSpendingData = {
  totalSpending: 1200,
  categories: {
    "Food & Dining": 300,
    "Subscriptions": 80,
    "Movies": 60,
    "Cab": 120,
    "Shopping": 200,
    "Grocery": 250,
    "Travel": 150,
    "Misc": 40
  },
  monthlyIncome: 1500,
  monthlyExpenses: 1200,
  savingsRate: 20
};

// Helper function to update goal progress based on linked streaks
function updateGoalProgress(goal) {
  if (!goal.linked_streaks || goal.linked_streaks.length === 0) {
    goal.current_amount = 0;
    goal.progress = {
      progress_percentage: 0,
      days_remaining: Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)),
      on_track: true
    };
    return;
  }

  // Calculate total savings from active linked streaks
  let totalSavings = 0;
  const activeStreaks = demoStreaks.filter(streak => 
    streak.status === 'active' && 
    goal.linked_streaks.some(linkedStreak => linkedStreak.id === streak.id)
  );

  activeStreaks.forEach(streak => {
    // Calculate savings based on streak duration and current streak
    const daysSinceStart = Math.floor((new Date() - new Date(streak.startDate)) / (1000 * 60 * 60 * 24));
    const dailySavings = streak.savings / streak.duration;
    const currentSavings = Math.min(dailySavings * daysSinceStart, streak.savings);
    totalSavings += currentSavings;
  });

  goal.current_amount = Math.round(totalSavings * 100) / 100;
  
  // Calculate progress percentage
  const progressPercentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const daysRemaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  goal.progress = {
    progress_percentage: Math.round(progressPercentage * 100) / 100,
    days_remaining: Math.max(0, daysRemaining),
    on_track: progressPercentage >= (100 - (daysRemaining / 30)) // Rough on-track calculation
  };
}

// Helper function to update all goals when streaks change
function updateAllGoalsProgress() {
  demoGoals.forEach(goal => {
    updateGoalProgress(goal);
  });
}

// JSON File Storage Functions
const DATA_DIR = path.join(__dirname, 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const STREAKS_FILE = path.join(DATA_DIR, 'streaks.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from JSON files
function loadDataFromFile(filePath, defaultData = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
  }
  return defaultData;
}

// Save data to JSON file
function saveDataToFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
    return false;
  }
}

// Load initial data from files
let demoTransactions = loadDataFromFile(TRANSACTIONS_FILE, [
  {
    id: "1",
    description: "Coffee Shop",
    amount: -4.50,
    type: "debit",
    category: "food_dining",
    date: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    description: "Salary",
    amount: 1500.0,
    type: "credit",
    category: "income",
    date: "2024-01-01T09:00:00Z"
  },
  {
    id: "3",
    description: "Grocery Store",
    amount: -75.00,
    type: "debit",
    category: "grocery",
    date: "2024-01-14T15:20:00Z"
  },
  {
    id: "4",
    description: "Netflix Subscription",
    amount: -15.99,
    type: "debit",
    category: "subscriptions",
    date: "2024-01-01T00:00:00Z"
  },
  {
    id: "5",
    description: "Movie Theater",
    amount: -12.00,
    type: "debit",
    category: "movies",
    date: "2024-01-13T19:30:00Z"
  },
  {
    id: "6",
    description: "Uber Ride",
    amount: -8.50,
    type: "debit",
    category: "cab",
    date: "2024-01-12T18:45:00Z"
  },
  {
    id: "7",
    description: "Amazon Purchase",
    amount: -45.00,
    type: "debit",
    category: "shopping",
    date: "2024-01-11T14:20:00Z"
  },
  {
    id: "8",
    description: "Gas Station",
    amount: -35.00,
    type: "debit",
    category: "travel",
    date: "2024-01-10T16:30:00Z"
  }
]);

// Load goals and streaks from files (will be empty initially)
demoGoals = loadDataFromFile(GOALS_FILE, []);
demoStreaks = loadDataFromFile(STREAKS_FILE, []);

// Gemini AI function
function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// Handle requests
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  setCORSHeaders(res);

  // Route handlers
  if (path === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "healthy",
      services: {
        firebase: "configured",
        plaid: "configured",
        gemini: "configured"
      },
      message: "FinQuest API is running! 🌱"
    }));
  }
  else if (path === '/api/analytics/dashboard-data') {
    res.writeHead(200);
    res.end(JSON.stringify({
      financial_summary: {
        total_spent_30_days: 1200.0,
        total_income_30_days: 1500.0,
        net_amount: 300.0,
        transaction_count: 25
      },
      goals_summary: {
        total_goals: 3,
        active_goals: 2,
        completed_goals: 1,
        total_target_amount: 5000.0,
        total_current_amount: 1500.0,
        overall_progress: 30.0
      },
      recent_activity: {
        recent_transactions: demoTransactions.slice(0, 4),
        recent_goals: demoGoals.slice(0, 1)
      }
    }));
  }
  else if (path === '/api/goals/') {
    res.writeHead(200);
    res.end(JSON.stringify(demoGoals));
  }
  else if (path === '/api/plaid/link-token' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      link_token: "link-sandbox-demo-token-12345",
      message: "Demo link token generated"
    }));
  }
  else if (path === '/api/plaid/exchange-token' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      access_token: "access-sandbox-demo-token-12345",
      success: true,
      message: "Demo access token generated"
    }));
  }
  else if (path === '/api/plaid/accounts') {
    res.writeHead(200);
    res.end(JSON.stringify({
      accounts: [
        {
          account_id: "demo-checking-123",
          name: "Demo Checking Account",
          type: "depository",
          subtype: "checking",
          mask: "0000",
          balances: {
            available: 1500.0,
            current: 1500.0
          }
        }
      ]
    }));
  }
  else if (path === '/api/plaid/transactions') {
    res.writeHead(200);
    res.end(JSON.stringify({
      transactions: [
        {
          transaction_id: "txn-1",
          account_id: "demo-checking-123",
          amount: -25.50,
          date: "2024-01-15",
          name: "Coffee Shop",
          merchant_name: "Starbucks",
          category: ["Food and Drink", "Restaurants"],
          pending: false
        },
        {
          transaction_id: "txn-2",
          account_id: "demo-checking-123",
          amount: -150.00,
          date: "2024-01-14",
          name: "Grocery Store",
          merchant_name: "Whole Foods",
          category: ["Food and Drink", "Groceries"],
          pending: false
        }
      ]
    }));
  }
  else if (path === '/api/ai/recommendations') {
    // Generate AI recommendations using Gemini
    const prompt = `Analyze this user's spending data and provide personalized financial recommendations:

User Spending Data:
- Monthly Income: $${userSpendingData.monthlyIncome}
- Monthly Expenses: $${userSpendingData.monthlyExpenses}
- Savings Rate: ${userSpendingData.savingsRate}%
- Spending by Category: ${JSON.stringify(userSpendingData.categories)}

Please provide:
1. 2-3 specific spending reduction recommendations (like "Cut coffee" or "Remove Netflix subscription")
2. Potential savings for each recommendation
3. A brief explanation for each recommendation
4. Suggest some financial products (credit cards, savings accounts) that would benefit this user

Format as JSON with this structure:
{
  "recommendations": [
    {
      "title": "Cut coffee",
      "description": "Stop buying coffee for 10 days",
      "savings": 45,
      "period": "10 days",
      "category": "Food & Dining",
      "reason": "You spend $45/month on coffee. Making coffee at home could save this amount."
    }
  ],
  "financial_products": [
    {
      "title": "Chase Sapphire Preferred",
      "category": "Credit Card",
      "benefit": "3x points on dining",
      "description": "Perfect for your high dining expenses"
    }
  ]
}`;

    callGeminiAPI(prompt)
      .then(response => {
        try {
          const aiResponse = JSON.parse(response.candidates[0].content.parts[0].text);
          res.writeHead(200);
          res.end(JSON.stringify(aiResponse));
        } catch (error) {
          // Fallback to demo data if AI fails
          res.writeHead(200);
          res.end(JSON.stringify({
            recommendations: [
              {
                title: "Cut coffee",
                description: "Stop buying coffee for 10 days",
                savings: 45,
                period: "10 days",
                category: "Food & Dining",
                reason: "You spend $45/month on coffee. Making coffee at home could save this amount."
              },
              {
                title: "Remove Netflix subscription",
                description: "Cancel Netflix to save $120/year",
                savings: 120,
                period: "year",
                category: "Entertainment",
                reason: "You can use free alternatives or share accounts to save money."
              }
            ],
            financial_products: [
              {
                title: "Chase Sapphire Preferred",
                category: "Credit Card",
                benefit: "3x points on dining",
                description: "Perfect for your high dining expenses"
              }
            ]
          }));
        }
      })
      .catch(error => {
        console.error('Gemini API Error:', error);
        // Fallback to demo data
        res.writeHead(200);
        res.end(JSON.stringify({
          recommendations: [
            {
              title: "Cut coffee",
              description: "Stop buying coffee for 10 days",
              savings: 45,
              period: "10 days",
              category: "Food & Dining",
              reason: "You spend $45/month on coffee. Making coffee at home could save this amount."
            },
            {
              title: "Remove Netflix subscription",
              description: "Cancel Netflix to save $120/year",
              savings: 120,
              period: "year",
              category: "Entertainment",
              reason: "You can use free alternatives or share accounts to save money."
            }
          ],
          financial_products: [
            {
              title: "Chase Sapphire Preferred",
              category: "Credit Card",
              benefit: "3x points on dining",
              description: "Perfect for your high dining expenses"
            }
          ]
        }));
      });
  }
  else if (path === '/api/streaks') {
    res.writeHead(200);
    res.end(JSON.stringify(demoStreaks));
  }
  else if (path === '/api/streaks/start' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { strategy, streakData } = JSON.parse(body);
        
        // Check for duplicate active streaks
        const existingActiveStreak = demoStreaks.find(streak => 
          streak.status === 'active' && 
          streak.title === streakData.title &&
          streak.category === streakData.category
        );
        
        if (existingActiveStreak) {
          res.writeHead(400);
          res.end(JSON.stringify({ 
            error: 'Duplicate streak', 
            message: `You already have an active "${streakData.title}" streak in ${streakData.category}` 
          }));
          return;
        }
        
        // Create new streak based on provided streak data
        const newStreak = {
          id: (demoStreaks.length + 1).toString(),
          title: streakData.title || 'New Streak',
          description: streakData.description || 'Save money with this streak',
          savings: streakData.savings || 50,
          period: streakData.period || 'month',
          duration: streakData.duration || 30,
          currentStreak: 1,
          maxStreak: 1,
          status: 'active',
          category: streakData.category || 'General',
          startDate: new Date().toISOString(),
          strategy: strategy || 'custom'
        };
        
        demoStreaks.push(newStreak);
        
        // Save streaks to file
        saveDataToFile(STREAKS_FILE, demoStreaks);
        
        // Update all goals progress when new streak is added
        updateAllGoalsProgress();
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, streak: newStreak }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (path.startsWith('/api/streaks/') && path.endsWith('/complete') && method === 'POST') {
    const streakId = path.split('/')[3];
    const streak = demoStreaks.find(s => s.id === streakId);
    if (streak && streak.status === 'active') {
      streak.currentStreak += 1;
      streak.maxStreak = Math.max(streak.maxStreak, streak.currentStreak);
      
      // Update all goals progress when streak is updated
      updateAllGoalsProgress();
      
      // Save streaks to file
      saveDataToFile(STREAKS_FILE, demoStreaks);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, streak }));
  }
  else if (path.startsWith('/api/streaks/') && path.endsWith('/skip') && method === 'POST') {
    const streakId = path.split('/')[3];
    const streak = demoStreaks.find(s => s.id === streakId);
    if (streak && streak.status === 'active') {
      // Don't increment streak, but don't reset either
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, streak }));
  }
  else if (path.startsWith('/api/streaks/') && path.endsWith('/end') && method === 'POST') {
    const streakId = path.split('/')[3];
    const streak = demoStreaks.find(s => s.id === streakId);
    if (streak) {
      streak.status = 'completed';
      streak.endDate = new Date().toISOString();
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, streak }));
  }
  else if (path === '/api/goals' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { goalData, selectedStreaks } = JSON.parse(body);
        
        // Create new goal with linked streaks
        const newGoal = {
          id: (demoGoals.length + 1).toString(),
          ...goalData,
          linked_streaks: selectedStreaks || [],
          current_amount: 0, // Start with 0, will be updated by streaks
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        };
        
        // Calculate initial progress based on linked streaks
        updateGoalProgress(newGoal);
        
        demoGoals.push(newGoal);
        
        // Save goals to file
        saveDataToFile(GOALS_FILE, demoGoals);
        
        res.writeHead(201);
        res.end(JSON.stringify({ success: true, goal: newGoal }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid goal data' }));
      }
    });
  }
  else if (path.startsWith('/api/what-if/') && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { recommendation, savings, period } = JSON.parse(body);
        
        // Calculate what-if scenario
        const currentSavings = userSpendingData.monthlyIncome - userSpendingData.monthlyExpenses;
        const newSavings = currentSavings + (savings / (period.includes('year') ? 12 : 1));
        const newSavingsRate = (newSavings / userSpendingData.monthlyIncome) * 100;
        
        const whatIfResult = {
          recommendation,
          current_savings: currentSavings,
          new_savings: newSavings,
          additional_savings: savings / (period.includes('year') ? 12 : 1),
          current_savings_rate: userSpendingData.savingsRate,
          new_savings_rate: Math.round(newSavingsRate * 10) / 10,
          impact: {
            monthly_impact: savings / (period.includes('year') ? 12 : 1),
            yearly_impact: savings,
            goal_acceleration: "This could help you reach your goals 2-3 months earlier"
          }
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(whatIfResult));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid what-if data' }));
      }
    });
  }
  else if (path === '/api/transactions' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const transactionData = JSON.parse(body);
        
        // Create new transaction
        const newTransaction = {
          id: (demoTransactions.length + 1).toString(),
          ...transactionData,
          date: transactionData.date || new Date().toISOString()
        };
        
        demoTransactions.push(newTransaction);
        
        // Save transactions to file
        saveDataToFile(TRANSACTIONS_FILE, demoTransactions);
        
        res.writeHead(201);
        res.end(JSON.stringify({ success: true, transaction: newTransaction }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid transaction data' }));
      }
    });
  }
  else if (path === '/api/reset' && method === 'POST') {
    // Reset all goals and streaks
    demoGoals.length = 0;
    demoStreaks.length = 0;
    
    // Save empty arrays to files
    saveDataToFile(GOALS_FILE, demoGoals);
    saveDataToFile(STREAKS_FILE, demoStreaks);
    
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      message: 'All goals and streaks have been reset successfully!',
      goals_count: 0,
      streaks_count: 0
    }));
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({
      message: "FinQuest API endpoint not found",
      path: path,
      available_endpoints: [
        "/api/health",
        "/api/analytics/dashboard-data",
        "/api/goals/",
        "/api/plaid/link-token",
        "/api/plaid/exchange-token",
        "/api/plaid/accounts",
        "/api/plaid/transactions",
        "/api/ai/recommendations",
        "/api/reset"
      ]
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🌱 FinQuest Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Dashboard Data: http://localhost:${PORT}/api/analytics/dashboard-data`);
  console.log(`🎯 Goals Data: http://localhost:${PORT}/api/goals/`);
  console.log("Press Ctrl+C to stop the server");
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server stopped');
  server.close();
  process.exit(0);
});
