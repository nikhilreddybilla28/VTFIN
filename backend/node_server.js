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
const axios = require('axios');

const PORT = 8001;

// Gemini AI Configuration
const GEMINI_API_KEY = 'AIzaSyB__BxaTVFEUVq4X_MnTgHQoHQeJai5ODI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Plaid Configuration
const PLAID_CLIENT_ID = '68d7732f1059f3002356b0ff';
const PLAID_SECRET = '21ce3b9e390661c338e520d82049d4';
const PLAID_ENV = 'sandbox';

// Nessie API Configuration (Capital One Hackathon API)
const NESSIE_API_BASE_URL = 'http://api.nessieisreal.com';
const NESSIE_API_KEY = '853c3a59c190f86eefd20d854b65e96a'; // Your actual API key

// Multi-user system with real Nessie API customer IDs
const users = {
  'user1': {
    id: 'user1',
    email: 'akash@example.com',
    password: 'password123',
    customerId: '68d84b999683f20dd5196b7c', // Real Akash customer from Nessie API
    name: 'Akash Mallepally'
  },
  'user2': {
    id: 'user2',
    email: 'alice@example.com',
    password: 'password456',
    customerId: '68d840da9683f20dd5196aca', // Real Alice customer from Nessie API
    name: 'Alice Smith'
  },
  'user3': {
    id: 'user3',
    email: 'nikhil@example.com',
    password: 'password789',
    customerId: '68d84bc09683f20dd5196b7e', // Real Nikhil customer from Nessie API
    name: 'Nikhil Bismillah'
  },
  'user4': {
    id: 'user4',
    email: 'mokshitha@example.com',
    password: 'password101',
    customerId: '68d84bc99683f20dd5196b7f', // Real Mokshitha customer from Nessie API
    name: 'Mokshitha Mandadi'
  }
};

// Current user session
let currentUser = null;

// Demo data - Start with empty arrays for fresh start
let demoGoals = [];

// Transactions are now loaded from JSON file

// Streaks data - Start with empty array for fresh start
let demoStreaks = [];

// Day tracking system
let currentDay = 0; // Global day counter
let dailySavingsHistory = {}; // Track savings for each day: {day: {goalId: amount}}

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
    
    // Use the actual streak count (how many times user clicked)
    const actualStreakDays = streak.currentStreak || 0;
    
    const currentSavings = dailySavings * actualStreakDays;
    const streakSavings = Math.min(currentSavings, streak.savings);
    totalSavings += streakSavings;
    
    console.log(`Streak ${streak.title}: ${actualStreakDays} days completed, $${streakSavings.toFixed(2)} saved`);
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
  
  // Save daily savings history for current day
  saveDailySavingsHistory();
}

// Helper function to save daily savings history
function saveDailySavingsHistory() {
  if (!dailySavingsHistory[currentDay]) {
    dailySavingsHistory[currentDay] = {};
  }
  
  demoGoals.forEach(goal => {
    if (goal.status === 'active') {
      dailySavingsHistory[currentDay][goal.id] = goal.current_amount;
    }
  });
  
  // Save to file
  saveDataToFile(DAILY_SAVINGS_FILE, dailySavingsHistory);
}

// Helper function to clean up duplicate streaks
function cleanupDuplicateStreaks() {
  console.log('🧹 Cleaning up duplicate streaks...');
  const uniqueStreaks = [];
  const seen = new Set();
  
  demoStreaks.forEach(streak => {
    const key = `${streak.title}-${streak.category}-${streak.status}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueStreaks.push(streak);
    } else {
      console.log(`🗑️ Removing duplicate streak: ${streak.title} (${streak.category})`);
    }
  });
  
  demoStreaks.length = 0;
  demoStreaks.push(...uniqueStreaks);
  
  // Save cleaned streaks
  saveDataToFile(STREAKS_FILE, demoStreaks);
  console.log(`✅ Cleaned up streaks: ${uniqueStreaks.length} unique streaks remaining`);
}

// JSON File Storage Functions
const DATA_DIR = path.join(__dirname, 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const STREAKS_FILE = path.join(DATA_DIR, 'streaks.json');
const DAY_COUNTER_FILE = path.join(DATA_DIR, 'day_counter.json');
const DAILY_SAVINGS_FILE = path.join(DATA_DIR, 'daily_savings.json');

// Customer data storage (per customer ID)
const customerData = {};

// Nessie API functions
async function getAccountsForCustomer(customerId) {
  try {
    const url = `${NESSIE_API_BASE_URL}/customers/${customerId}/accounts?key=${NESSIE_API_KEY}`;
    console.log(`Finding accounts for customer ${customerId}...`);
    
    const response = await axios.get(url);
    const accounts = response.data;
    
    if (accounts && accounts.length > 0) {
      console.log(`✅ Found ${accounts.length} account(s) for customer ${customerId}.`);
      return accounts;
    } else {
      console.log(`❌ No accounts found for customer ${customerId}.`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching accounts for customer ${customerId}:`, error.message);
    return [];
  }
}

async function getTransactionsForAccount(accountId) {
  const accountTransactions = [];
  const transactionEndpoints = ['purchases', 'deposits', 'withdrawals', 'transfers'];
  
  console.log(`Fetching transactions for account: ${accountId}`);
  
  for (const endpoint of transactionEndpoints) {
    try {
      const url = `${NESSIE_API_BASE_URL}/accounts/${accountId}/${endpoint}?key=${NESSIE_API_KEY}`;
      const response = await axios.get(url);
      const transactions = response.data;
      
      // Add type and account_id fields to each transaction
      transactions.forEach(t => {
        t.type = endpoint.slice(0, -1); // Remove 's' from endpoint name
        t.account_id = accountId;
      });
      
      accountTransactions.push(...transactions);
      if (transactions.length > 0) {
        console.log(`  - Found ${transactions.length} ${endpoint}.`);
      }
    } catch (error) {
      // Silently fail if an endpoint has an error (e.g., no withdrawals)
      console.log(`  - No ${endpoint} found for account ${accountId}.`);
    }
  }
  
  return accountTransactions;
}

async function fetchCustomerData(customerId) {
  try {
    console.log(`Fetching data for customer: ${customerId}`);
    
    // Get all accounts for the customer
    const customerAccounts = await getAccountsForCustomer(customerId);
    
    if (!customerAccounts || customerAccounts.length === 0) {
      console.log(`No accounts found for customer ${customerId}, using demo data`);
      return generateDemoTransactionData();
    }
    
    let allCustomerTransactions = [];
    
    // Get transactions for each account
    for (const account of customerAccounts) {
      const transactions = await getTransactionsForAccount(account._id);
      allCustomerTransactions.push(...transactions);
    }
    
    // Sort transactions by date
    allCustomerTransactions.sort((a, b) => {
      const dateA = new Date(a.purchase_date || a.transaction_date);
      const dateB = new Date(b.purchase_date || b.transaction_date);
      return dateA - dateB;
    });
    
    console.log(`✅ Found a total of ${allCustomerTransactions.length} transactions for customer ${customerId}.`);
    
    // Convert to FinQuest format
    const finquestTransactions = allCustomerTransactions.map(transaction => ({
      id: transaction._id || Math.random().toString(36).substr(2, 9),
      description: transaction.description || transaction.merchant_name || 'Transaction',
      amount: Math.abs(transaction.amount || 0),
      type: transaction.type === 'deposit' ? 'credit' : 'debit',
      category: mapTransactionCategory(transaction),
      date: transaction.purchase_date || transaction.transaction_date,
      account_id: transaction.account_id
    }));
    
    return finquestTransactions;
  } catch (error) {
    console.error(`Error fetching customer data for ${customerId}:`, error.message);
    return generateDemoTransactionData();
  }
}

function mapTransactionCategory(transaction) {
  // Map transaction types to FinQuest categories
  const categoryMap = {
    'purchase': 'shopping',
    'deposit': 'income',
    'withdrawal': 'misc',
    'transfer': 'misc'
  };
  
  return categoryMap[transaction.type] || 'misc';
}

function generateDemoTransactionData() {
  // Fallback demo data if API fails
  return [
    {
      id: '1',
      description: 'Salary Deposit',
      amount: 1500,
      type: 'credit',
      category: 'income',
      date: '2025-09-01',
      account_id: 'demo_account'
    },
    {
      id: '2',
      description: 'Grocery Store',
      amount: 85.50,
      type: 'debit',
      category: 'grocery',
      date: '2025-09-02',
      account_id: 'demo_account'
    }
    // Add more demo transactions as needed
  ];
}

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

// Load day counter from file
const dayCounterData = loadDataFromFile(DAY_COUNTER_FILE, { currentDay: 0 });
currentDay = dayCounterData.currentDay;

// Load daily savings history
dailySavingsHistory = loadDataFromFile(DAILY_SAVINGS_FILE, {});

// Initialize customer data
async function initializeCustomerData() {
  for (const userId in users) {
    const user = users[userId];
    console.log(`Initializing data for user: ${user.name} (${user.customerId})`);
    
    // Fetch real data from API or use demo data
    const transactions = await fetchCustomerData(user.customerId);
    
    customerData[user.customerId] = {
      transactions: transactions,
      goals: [],
      streaks: []
    };
  }
}

// Initialize customer data on startup
initializeCustomerData();

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
  else if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        
        // Find user by email and password
        const user = Object.values(users).find(u => u.email === email && u.password === password);
        
        if (user) {
          currentUser = user;
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              customerId: user.customerId
            },
            message: `Welcome back, ${user.name}!`
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid email or password'
          }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data'
        }));
      }
    });
  }
  else if (path === '/api/auth/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { name, email, password, customerId } = JSON.parse(body);
        
        console.log('Registration attempt for email:', email, 'customerId:', customerId);
        
        // Validate required fields
        if (!name || !email || !password || !customerId) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'All fields are required'
          }));
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid email format'
          }));
          return;
        }
        
        // Validate customer ID format (24 character hex string)
        if (!customerId.match(/^[a-f0-9]{24}$/)) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid Nessie Customer ID format'
          }));
          return;
        }
        
        // Check if email already exists
        const existingUser = Object.values(users).find(u => u.email === email);
        if (existingUser) {
          res.writeHead(409);
          res.end(JSON.stringify({
            success: false,
            message: 'Email already exists'
          }));
          return;
        }
        
        // Check if customer ID already exists
        const existingCustomer = Object.values(users).find(u => u.customerId === customerId);
        if (existingCustomer) {
          res.writeHead(409);
          res.end(JSON.stringify({
            success: false,
            message: 'Customer ID already registered'
          }));
          return;
        }
        
        // Verify customer ID exists in Nessie API
        try {
          const customerResponse = await axios.get(`${NESSIE_API_BASE_URL}/customers/${customerId}?key=${NESSIE_API_KEY}`);
          console.log('Customer verification successful:', customerResponse.data);
        } catch (error) {
          console.log('Customer verification failed:', error.response?.status);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid Nessie Customer ID - customer not found'
          }));
          return;
        }
        
        // Generate new user ID
        const userId = 'user' + (Object.keys(users).length + 1);
        
        // Create new user
        const newUser = {
          id: userId,
          email: email,
          password: password,
          customerId: customerId,
          name: name
        };
        
        // Add user to users object
        users[userId] = newUser;
        
        // Initialize customer data
        console.log(`Initializing data for new user: ${name} (${customerId})`);
        const transactions = await fetchCustomerData(customerId);
        customerData[customerId] = {
          transactions: transactions,
          goals: [],
          streaks: []
        };
        
        console.log('Registration successful for user:', name);
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            customerId: newUser.customerId
          },
          message: `Account created successfully for ${name}!`
        }));
        
      } catch (error) {
        console.error('Registration error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          message: 'Registration failed: ' + error.message
        }));
      }
    });
  }
  else if (path === '/api/auth/logout' && method === 'POST') {
    currentUser = null;
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }));
  }
  else if (path === '/api/auth/current-user' && method === 'GET') {
    if (currentUser) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          customerId: currentUser.customerId
        }
      }));
    } else {
      res.writeHead(401);
      res.end(JSON.stringify({
        success: false,
        message: 'No user logged in'
      }));
    }
  }
  else if (path === '/api/analytics/dashboard-data') {
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    // Get user-specific transaction data
    const userTransactions = customerData[currentUser.customerId]?.transactions || [];
    const userGoals = customerData[currentUser.customerId]?.goals || [];
    
    console.log(`📊 Generating analytics for user: ${currentUser.name} (${userTransactions.length} transactions)`);
    
    // Calculate analytics for both monthly (30 days) and 6-month periods
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= thirtyDaysAgo;
    });
    
    const sixMonthTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= sixMonthsAgo;
    });
    
    // Monthly calculations (30 days)
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = Math.abs(monthlyTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0));
    
    // 6-month calculations
    const totalIncome = sixMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(sixMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const categories = {};
    sixMonthTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      });

    // Calculate monthly trends
    const monthlyData = {};
    userTransactions.forEach(t => {
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
        // Monthly data (30 days)
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        monthly_net: monthlyIncome - monthlyExpenses,
        monthly_transaction_count: monthlyTransactions.length,
        monthly_savings_rate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : "0.0",
        
        // 6-month data
        total_spent_6_months: totalExpenses,
        total_income_6_months: totalIncome,
        net_amount: totalIncome - totalExpenses,
        transaction_count: sixMonthTransactions.length,
        savings_rate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : "0.0"
      },
      goals_summary: {
        total_goals: userGoals.length,
        active_goals: userGoals.filter(g => g.status === 'active').length,
        completed_goals: userGoals.filter(g => g.status === 'completed').length,
        total_target_amount: userGoals.reduce((sum, g) => sum + g.target_amount, 0),
        total_current_amount: userGoals.reduce((sum, g) => sum + g.current_amount, 0),
        overall_progress: userGoals.length > 0 ? 
          (userGoals.reduce((sum, g) => sum + g.current_amount, 0) / 
           userGoals.reduce((sum, g) => sum + g.target_amount, 0) * 100).toFixed(1) : "0.0"
      },
      recent_activity: {
        recent_transactions: sixMonthTransactions.slice(-10).reverse(),
        recent_goals: userGoals.slice(0, 3)
      },
      categories: categories,
      monthly_trends: monthlyData,
      date_range: {
        start: userTransactions[0]?.date,
        end: userTransactions[userTransactions.length - 1]?.date
      }
    }));
  }
  else if (path === '/api/goals/') {
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    // Return all goals (demoGoals is global)
    res.writeHead(200);
    res.end(JSON.stringify(demoGoals));
  }
  else if (path === '/api/transactions') {
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    const userTransactions = customerData[currentUser.customerId]?.transactions || [];
    res.writeHead(200);
    res.end(JSON.stringify(userTransactions));
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
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    // Get user-specific transaction data
    const userTransactions = customerData[currentUser.customerId]?.transactions || [];
    
    // Calculate user-specific spending data (last 6 months for demo)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= sixMonthsAgo;
    });
    
    const totalIncome = recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(recentTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const categories = {};
    recentTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      });
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : "0.0";
    
    console.log(`🤖 Generating AI recommendations for user: ${currentUser.name}`);
    
    // Generate AI recommendations using Gemini
    const prompt = `Analyze this user's spending data and provide personalized financial recommendations:

User Spending Data:
- Monthly Income: $${totalIncome.toFixed(2)}
- Monthly Expenses: $${totalExpenses.toFixed(2)}
- Savings Rate: ${savingsRate}%
- Spending by Category: ${JSON.stringify(categories)}

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
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    // Return all active streaks (demoStreaks is global)
    const activeStreaks = demoStreaks.filter(s => s.status === 'active');
    res.writeHead(200);
    res.end(JSON.stringify(activeStreaks));
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
            message: `You already have an active "${streakData.title}" streak in ${streakData.category}`,
            existingStreak: existingActiveStreak
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
          start_day: currentDay, // Track which day the streak was created
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
          status: 'active',
          start_date: new Date().toISOString(), // Track when goal was created
          start_day: currentDay // Track which day the goal was created
        };

        // Update streaks to link them with this goal
        selectedStreaks.forEach(streak => {
          // First try to find by ID
          let streakIndex = demoStreaks.findIndex(s => s.id === streak.id);
          
          // If not found by ID, try to find by title and category
          if (streakIndex === -1) {
            streakIndex = demoStreaks.findIndex(s => 
              s.title === streak.title && 
              s.category === streak.category &&
              s.status === 'active'
            );
          }
          
          // If still not found, create a new streak
          if (streakIndex === -1) {
            console.log(`Creating new streak for goal: ${streak.title}`);
            const newStreak = {
              id: (demoStreaks.length + 1).toString(),
              title: streak.title || 'New Streak',
              description: streak.description || 'Save money with this streak',
              savings: streak.savings || 50,
              period: streak.period || 'month',
              duration: streak.duration || 30,
              currentStreak: 0,
              maxStreak: 0,
              status: 'active',
              category: streak.category || 'General',
              startDate: new Date().toISOString(),
              start_day: currentDay, // Track which day the streak was created
              strategy: 'goal_linked',
              linkedGoalId: newGoal.id,
              linkedGoalTitle: newGoal.title
            };
            
            demoStreaks.push(newStreak);
            console.log(`✅ Created streak for goal: ${newStreak.title}`);
          } else {
            // Link existing streak to goal
            demoStreaks[streakIndex].linkedGoalId = newGoal.id;
            demoStreaks[streakIndex].linkedGoalTitle = newGoal.title;
            console.log(`✅ Linked existing streak to goal: ${streak.title}`);
          }
        });
        
        // Calculate initial progress based on linked streaks
        updateGoalProgress(newGoal);
        
        demoGoals.push(newGoal);
        
        // Save goals and streaks to file
        saveDataToFile(GOALS_FILE, demoGoals);
        saveDataToFile(STREAKS_FILE, demoStreaks);
        
        res.writeHead(201);
        res.end(JSON.stringify({ success: true, goal: newGoal }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid goal data' }));
      }
    });
  }
  else if (path.startsWith('/api/what-if/') && method === 'POST') {
    if (!currentUser) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { recommendation, savings, period } = JSON.parse(body);
        
        // Get user-specific transaction data
        const userTransactions = customerData[currentUser.customerId]?.transactions || [];
        
        // Calculate user-specific spending data (last 30 days only)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTransactions = userTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= thirtyDaysAgo;
        });
        
        const totalIncome = recentTransactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(recentTransactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0));
        
        const currentSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
        
        // Calculate what-if scenario
        const currentSavings = totalIncome - totalExpenses;
        const newSavings = currentSavings + (savings / (period.includes('year') ? 12 : 1));
        const newSavingsRate = (newSavings / totalIncome) * 100;
        
        const whatIfResult = {
          recommendation,
          current_savings: currentSavings,
          new_savings: newSavings,
          additional_savings: savings / (period.includes('year') ? 12 : 1),
          current_savings_rate: currentSavingsRate.toFixed(1),
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
  else if (path === '/api/cleanup-duplicates' && method === 'POST') {
    // Clean up duplicate streaks
    cleanupDuplicateStreaks();
    
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Duplicate streaks cleaned up successfully' }));
  }
  else if (path === '/api/day-counter' && method === 'GET') {
    // Get current day counter
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      currentDay: currentDay,
      message: `Current day: ${currentDay}`
    }));
  }
  else if (path === '/api/day-counter/increment' && method === 'POST') {
    // Increment day counter
    currentDay += 1;
    
    // Save day counter to file
    saveDataToFile(DAY_COUNTER_FILE, { currentDay: currentDay });
    
    // Update all goals progress when day increments
    updateAllGoalsProgress();
    
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      currentDay: currentDay,
      message: `Day incremented to: ${currentDay}`
    }));
  }
  else if (path === '/api/day-counter/reset' && method === 'POST') {
    // Reset day counter
    currentDay = 0;
    
    // Save day counter to file
    saveDataToFile(DAY_COUNTER_FILE, { currentDay: currentDay });
    
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      currentDay: currentDay,
      message: 'Day counter reset to 0'
    }));
  }
  else if (path.startsWith('/api/goals/') && path.endsWith('/trajectory') && method === 'GET') {
    // Get trajectory data for a specific goal
    const goalId = path.split('/')[3];
    const goal = demoGoals.find(g => g.id === goalId);
    
    if (!goal) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Goal not found' }));
      return;
    }
    
    // Calculate trajectory data
    const startDate = goal.start_date || goal.created_at;
    const goalDuration = Math.max(1, Math.ceil((new Date(goal.target_date) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    const maxDays = Math.max(goalDuration + 2, 30); // Add 2 day buffer as requested, minimum 30 days
    
    // Generate ideal trajectory (linear progression)
    const idealTrajectory = [];
    for (let day = 0; day <= maxDays; day++) {
      const idealAmount = (goal.target_amount / goalDuration) * Math.min(day, goalDuration);
      idealTrajectory.push({ day, amount: idealAmount });
    }
    
    // Generate real trajectory based on daily savings history
    const realTrajectory = [];
    const startDay = goal.start_day || 0;
    
    for (let day = 0; day <= Math.min(currentDay - startDay, maxDays); day++) {
      const actualDay = startDay + day;
      let daySavings = 0;
      
      // Get savings from history if available
      if (dailySavingsHistory[actualDay] && dailySavingsHistory[actualDay][goal.id] !== undefined) {
        daySavings = dailySavingsHistory[actualDay][goal.id];
      } else if (day === 0) {
        // Day 0 always starts with 0
        daySavings = 0;
      } else {
        // If no history for this day, use the previous day's amount
        const prevDay = actualDay - 1;
        if (dailySavingsHistory[prevDay] && dailySavingsHistory[prevDay][goal.id] !== undefined) {
          daySavings = dailySavingsHistory[prevDay][goal.id];
        }
      }
      
      realTrajectory.push({ day, amount: daySavings });
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      goal: {
        id: goal.id,
        title: goal.title,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        start_day: startDay,
        current_day: currentDay
      },
      trajectory: {
        ideal: idealTrajectory,
        real: realTrajectory,
        max_days: maxDays,
        current_day: currentDay - startDay
      }
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
  
  // Clean up any duplicate streaks on startup
  cleanupDuplicateStreaks();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server stopped');
  server.close();
  process.exit(0);
});
