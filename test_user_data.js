#!/usr/bin/env node

/**
 * Test script to cross-check user-specific financial data
 */

const https = require('https');

const API_BASE_URL = 'https://finquest-simple-qvueiu5eba-uc.a.run.app';

// Test users
const users = [
  { email: 'akash@example.com', password: 'password123', name: 'Akash Mallepally' },
  { email: 'alice@example.com', password: 'password456', name: 'Alice Smith' },
  { email: 'nikhil@example.com', password: 'password789', name: 'Nikhil Bismillah' },
  { email: 'mokshitha@example.com', password: 'password101', name: 'Mokshitha Mandadi' }
];

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'finquest-simple-qvueiu5eba-uc.a.run.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testUserData() {
  console.log('🔍 Testing User-Specific Financial Data\n');
  console.log('=' .repeat(80));

  for (const user of users) {
    console.log(`\n👤 Testing User: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log('-'.repeat(50));

    try {
      // Step 1: Login
      console.log('🔐 Logging in...');
      const loginResponse = await makeRequest('/api/auth/login', 'POST', {
        email: user.email,
        password: user.password
      });

      if (loginResponse.status !== 200) {
        console.log(`❌ Login failed: ${loginResponse.data.message || 'Unknown error'}`);
        continue;
      }

      console.log(`✅ Login successful: ${loginResponse.data.user.name}`);

      // Step 2: Get Dashboard Data
      console.log('📊 Fetching dashboard data...');
      const dashboardResponse = await makeRequest('/api/analytics/dashboard-data');

      if (dashboardResponse.status !== 200) {
        console.log(`❌ Dashboard data failed: ${dashboardResponse.data.error || 'Unknown error'}`);
        continue;
      }

      const financial = dashboardResponse.data.financial_summary;
      console.log('💰 Financial Summary:');
      console.log(`   Total Income (6 months): $${financial.total_income_6_months?.toFixed(2) || '0.00'}`);
      console.log(`   Total Expenses (6 months): $${financial.total_spent_6_months?.toFixed(2) || '0.00'}`);
      console.log(`   Net Amount: $${financial.net_amount?.toFixed(2) || '0.00'}`);
      console.log(`   Transaction Count: ${financial.transaction_count || 0}`);
      console.log(`   Savings Rate: ${financial.savings_rate || '0.0'}%`);

      // Step 3: Get Transactions
      console.log('💳 Fetching transactions...');
      const transactionsResponse = await makeRequest('/api/transactions');

      if (transactionsResponse.status !== 200) {
        console.log(`❌ Transactions failed: ${transactionsResponse.data.error || 'Unknown error'}`);
        continue;
      }

      const transactions = transactionsResponse.data;
      console.log(`📈 Transaction Details:`);
      console.log(`   Total Transactions: ${transactions.length}`);

      // Calculate actual totals from transactions
      const actualIncome = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const actualExpenses = Math.abs(transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0));

      console.log(`   Calculated Income: $${actualIncome.toFixed(2)}`);
      console.log(`   Calculated Expenses: $${actualExpenses.toFixed(2)}`);
      console.log(`   Calculated Net: $${(actualIncome - actualExpenses).toFixed(2)}`);

      // Step 4: Verify data consistency
      console.log('🔍 Data Consistency Check:');
      const incomeMatch = Math.abs(financial.total_income_6_months - actualIncome) < 0.01;
      const expensesMatch = Math.abs(financial.total_spent_6_months - actualExpenses) < 0.01;
      
      console.log(`   Income Match: ${incomeMatch ? '✅' : '❌'}`);
      console.log(`   Expenses Match: ${expensesMatch ? '✅' : '❌'}`);

      if (!incomeMatch || !expensesMatch) {
        console.log('⚠️  Data inconsistency detected!');
      }

      // Step 5: Show recent transactions
      if (transactions.length > 0) {
        console.log('📋 Recent Transactions (first 3):');
        transactions.slice(0, 3).forEach((tx, index) => {
          const amount = Math.abs(tx.amount);
          const prefix = tx.type === 'debit' ? '-' : '+';
          console.log(`   ${index + 1}. ${tx.description}: ${prefix}$${amount.toFixed(2)} (${tx.category})`);
        });
      }

    } catch (error) {
      console.log(`❌ Error testing user ${user.name}: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  console.log('\n🎉 User data testing complete!');
}

// Run the test
testUserData().catch(console.error);
