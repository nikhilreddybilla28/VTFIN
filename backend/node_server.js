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
let demoGoals = [];

// Transactions are now loaded from JSON file

// Streaks data - Start with empty array for fresh start
let demoStreaks = [];

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
  console.log(`Updating goal progress for: ${goal.title}`);
  
  if (!goal.linked_streaks || goal.linked_streaks.length === 0) {
    console.log(`Goal ${goal.title} has no linked streaks`);
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
    streak.linkedGoalId === goal.id
  );

  console.log(`Found ${activeStreaks.length} active streaks for goal ${goal.title}`);

  activeStreaks.forEach(streak => {
    // Calculate savings based on current streak count
    // Each completed day of the streak contributes to savings
    const dailySavings = streak.savings / streak.duration;
    const currentSavings = dailySavings * streak.currentStreak;
    const streakSavings = Math.min(currentSavings, streak.savings);
    totalSavings += streakSavings;
    
    console.log(`Streak ${streak.title}: ${streak.currentStreak} days, $${streakSavings.toFixed(2)} saved`);
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
  
  console.log(`Goal ${goal.title} updated: $${goal.current_amount} saved (${goal.progress.progress_percentage}%)`);
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

// Generate 3 months of realistic transaction data
function generateTransactionData() {
  const transactions = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-03-31');
  let transactionId = 1;

  // Salary payments (1st of each month)
  for (let month = 0; month < 3; month++) {
    const salaryDate = new Date(startDate);
    salaryDate.setMonth(salaryDate.getMonth() + month);
    salaryDate.setDate(1);
    
    transactions.push({
      id: (transactionId++).toString(),
      description: "Monthly Salary",
      amount: 1500.00,
      type: "credit",
      category: "income",
      date: salaryDate.toISOString()
    });
  }

  // Generate daily transactions for 3 months
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Coffee (weekdays only)
    if (!isWeekend && Math.random() > 0.3) {
      transactions.push({
        id: (transactionId++).toString(),
        description: "Coffee Shop",
        amount: -(3.50 + Math.random() * 2),
        type: "debit",
        category: "food_dining",
        date: new Date(currentDate.getTime() + (8 + Math.random() * 2) * 60 * 60 * 1000).toISOString()
      });
    }

    // Lunch (weekdays)
    if (!isWeekend && Math.random() > 0.4) {
      transactions.push({
        id: (transactionId++).toString(),
        description: "Lunch",
        amount: -(8.00 + Math.random() * 7),
        type: "debit",
        category: "food_dining",
        date: new Date(currentDate.getTime() + (12 + Math.random() * 1) * 60 * 60 * 1000).toISOString()
      });
    }

    // Grocery shopping (2-3 times per week)
    if (Math.random() > 0.6) {
      transactions.push({
        id: (transactionId++).toString(),
        description: "Grocery Store",
        amount: -(40 + Math.random() * 40),
        type: "debit",
        category: "grocery",
        date: new Date(currentDate.getTime() + (16 + Math.random() * 4) * 60 * 60 * 1000).toISOString()
      });
    }

    // Uber rides (occasionally)
    if (Math.random() > 0.8) {
      transactions.push({
        id: (transactionId++).toString(),
        description: "Uber Ride",
        amount: -(5 + Math.random() * 15),
        type: "debit",
        category: "cab",
        date: new Date(currentDate.getTime() + (18 + Math.random() * 4) * 60 * 60 * 1000).toISOString()
      });
    }

    // Online shopping (occasionally)
    if (Math.random() > 0.9) {
      const shoppingAmounts = [25, 45, 80, 120, 200];
      const amount = shoppingAmounts[Math.floor(Math.random() * shoppingAmounts.length)];
      transactions.push({
        id: (transactionId++).toString(),
        description: "Online Purchase",
        amount: -amount,
        type: "debit",
        category: "shopping",
        date: new Date(currentDate.getTime() + (20 + Math.random() * 2) * 60 * 60 * 1000).toISOString()
      });
    }

    // Gas (weekly)
    if (dayOfWeek === 6 && Math.random() > 0.5) {
      transactions.push({
        id: (transactionId++).toString(),
        description: "Gas Station",
        amount: -(25 + Math.random() * 15),
        type: "debit",
        category: "travel",
        date: new Date(currentDate.getTime() + (10 + Math.random() * 4) * 60 * 60 * 1000).toISOString()
      });
    }

    // Entertainment (weekends)
    if (isWeekend && Math.random() > 0.6) {
      const entertainmentTypes = [
        { desc: "Movie Theater", amount: -(12 + Math.random() * 8), category: "movies" },
        { desc: "Restaurant", amount: -(20 + Math.random() * 30), category: "food_dining" },
        { desc: "Concert", amount: -(50 + Math.random() * 100), category: "entertainment" }
      ];
      const entertainment = entertainmentTypes[Math.floor(Math.random() * entertainmentTypes.length)];
      transactions.push({
        id: (transactionId++).toString(),
        description: entertainment.desc,
        amount: entertainment.amount,
        type: "debit",
        category: entertainment.category,
        date: new Date(currentDate.getTime() + (19 + Math.random() * 3) * 60 * 60 * 1000).toISOString()
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Monthly subscriptions
  const subscriptions = [
    { name: "Netflix", amount: 15.99, category: "subscriptions" },
    { name: "Spotify", amount: 9.99, category: "subscriptions" },
    { name: "Gym Membership", amount: 49.99, category: "health_fitness" },
    { name: "Phone Bill", amount: 65.00, category: "utilities" },
    { name: "Internet", amount: 79.99, category: "utilities" }
  ];

  for (let month = 0; month < 3; month++) {
    subscriptions.forEach(sub => {
      const subDate = new Date(startDate);
      subDate.setMonth(subDate.getMonth() + month);
      subDate.setDate(1);
      
      transactions.push({
        id: (transactionId++).toString(),
        description: sub.name,
        amount: -sub.amount,
        type: "debit",
        category: sub.category,
        date: subDate.toISOString()
      });
    });
  }

  // Random miscellaneous expenses
  const miscExpenses = [
    { desc: "ATM Withdrawal", amount: -20, category: "misc" },
    { desc: "Bank Fee", amount: -5, category: "misc" },
    { desc: "Parking", amount: -8, category: "misc" },
    { desc: "Coffee with Friends", amount: -12, category: "food_dining" },
    { desc: "Bookstore", amount: -25, category: "shopping" },
    { desc: "Pharmacy", amount: -15, category: "health_fitness" }
  ];

  for (let i = 0; i < 20; i++) {
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const misc = miscExpenses[Math.floor(Math.random() * miscExpenses.length)];
    
    transactions.push({
      id: (transactionId++).toString(),
      description: misc.desc,
      amount: misc.amount,
      type: "debit",
      category: misc.category,
      date: randomDate.toISOString()
    });
  }

  // Sort by date
  return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Load initial data from files
let demoTransactions = loadDataFromFile(TRANSACTIONS_FILE, generateTransactionData());

// Load goals and streaks from files (will be empty initially)
demoGoals = loadDataFromFile(GOALS_FILE, []);
demoStreaks = loadDataFromFile(STREAKS_FILE, []);

// Save initial transaction data to file if it doesn't exist
if (!fs.existsSync(TRANSACTIONS_FILE)) {
  console.log('📊 Generating 3 months of transaction data...');
  saveDataToFile(TRANSACTIONS_FILE, demoTransactions);
  console.log(`✅ Generated ${demoTransactions.length} transactions and saved to ${TRANSACTIONS_FILE}`);
}

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
    // Calculate analytics from actual transaction data
    const totalIncome = demoTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(demoTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const categories = {};
    demoTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      });

    // Calculate monthly trends
    const monthlyData = {};
    demoTransactions.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'credit') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += Math.abs(t.amount);
      }
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      financial_summary: {
        total_spent_30_days: totalExpenses,
        total_income_30_days: totalIncome,
        net_amount: totalIncome - totalExpenses,
        transaction_count: demoTransactions.length,
        savings_rate: ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)
      },
      goals_summary: {
        total_goals: demoGoals.length,
        active_goals: demoGoals.filter(g => g.status === 'active').length,
        completed_goals: demoGoals.filter(g => g.status === 'completed').length,
        total_target_amount: demoGoals.reduce((sum, g) => sum + g.target_amount, 0),
        total_current_amount: demoGoals.reduce((sum, g) => sum + g.current_amount, 0),
        overall_progress: demoGoals.length > 0 ? 
          (demoGoals.reduce((sum, g) => sum + g.current_amount, 0) / 
           demoGoals.reduce((sum, g) => sum + g.target_amount, 0) * 100).toFixed(1) : 0
      },
      recent_activity: {
        recent_transactions: demoTransactions.slice(-10).reverse(),
        recent_goals: demoGoals.slice(0, 3)
      },
      categories: categories,
      monthly_trends: monthlyData,
      date_range: {
        start: demoTransactions[0]?.date,
        end: demoTransactions[demoTransactions.length - 1]?.date
      }
    }));
  }
  else if (path === '/api/goals/') {
    res.writeHead(200);
    res.end(JSON.stringify(demoGoals));
  }
  else if (path === '/api/transactions') {
    res.writeHead(200);
    res.end(JSON.stringify(demoTransactions));
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
          strategy: strategy || 'custom',
          linkedGoalId: null, // Will be set when goal is created
          linkedGoalTitle: null // Will be set when goal is created
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
      streak.lastCompletedDate = new Date().toISOString();
      
      // Update all goals progress when streak is updated
      updateAllGoalsProgress();
      
      // Save streaks to file
      saveDataToFile(STREAKS_FILE, demoStreaks);
      
      // Save goals to file after updating progress
      saveDataToFile(GOALS_FILE, demoGoals);
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

        // Update streaks to link them with this goal
        selectedStreaks.forEach(streak => {
          const streakIndex = demoStreaks.findIndex(s => s.id === streak.id);
          if (streakIndex !== -1) {
            demoStreaks[streakIndex].linkedGoalId = newGoal.id;
            demoStreaks[streakIndex].linkedGoalTitle = newGoal.title;
          }
        });
        
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
        "/api/transactions",
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
