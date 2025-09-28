# 👥 **FINQUEST - HOW TO ADD NEW USERS GUIDE**

## ✅ **COMPLETE GUIDE FOR ADDING NEW USERS TO FINQUEST**

I've created a comprehensive guide for adding new users to the FinQuest application with real Nessie API data.

## 🚀 **WHERE TO ADD NEW USERS:**

### **✅ Primary Location: Backend Configuration**
**File**: `backend/node_server.js`  
**Section**: `users` object (around line 31)

### **✅ Secondary Location: Frontend Display**
**File**: `frontend-simple/index.html`  
**Section**: Login page user list and quick login buttons

## 🔧 **STEP-BY-STEP PROCESS:**

### **Step 1: Get Customer ID from Nessie API**

#### **Option A: Use Existing Customer ID**
```bash
# Get list of available customers
curl -X GET "http://api.nessieisreal.com/customers?key=853c3a59c190f86eefd20d854b65e96a" | jq '.[0:10]'
```

#### **Option B: Create New Customer (if needed)**
```bash
# Create new customer
curl -X POST "http://api.nessieisreal.com/customers?key=853c3a59c190f86eefd20d854b65e96a" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "address": {
      "street_number": "123",
      "street_name": "Main St",
      "city": "Blacksburg",
      "state": "VA",
      "zip": "24060"
    }
  }'
```

### **Step 2: Add User to Backend Configuration**

**File**: `backend/node_server.js`

```javascript
// Add new user to the users object
const users = {
  'user1': {
    id: 'user1',
    email: 'akash@example.com',
    password: 'password123',
    customerId: '68d84b999683f20dd5196b7c',
    name: 'Akash Mallepally'
  },
  'user2': {
    id: 'user2',
    email: 'alice@example.com',
    password: 'password456',
    customerId: '68d840da9683f20dd5196aca',
    name: 'Alice Smith'
  },
  'user3': {
    id: 'user3',
    email: 'nikhil@example.com',
    password: 'password789',
    customerId: '68d84bc09683f20dd5196b7e',
    name: 'Nikhil Bismillah'
  },
  // ADD NEW USER HERE
  'user4': {
    id: 'user4',
    email: 'newuser@example.com',
    password: 'password123',
    customerId: 'CUSTOMER_ID_FROM_NESSIE_API',
    name: 'New User Name'
  }
};
```

### **Step 3: Add User to Frontend Display**

**File**: `frontend-simple/index.html`

#### **A. Add to User List**
```html
<div class="mt-2 space-y-1 text-xs">
    <p><strong>Akash Mallepally:</strong> akash@example.com / password123</p>
    <p><strong>Alice Smith:</strong> alice@example.com / password456</p>
    <p><strong>Nikhil Bismillah:</strong> nikhil@example.com / password789</p>
    <p><strong>Mokshitha Mandadi:</strong> mokshitha@example.com / password101</p>
    <!-- ADD NEW USER HERE -->
    <p><strong>New User Name:</strong> newuser@example.com / password123</p>
</div>
```

#### **B. Add Quick Login Button**
```html
<div class="mt-4 space-x-2">
    <button type="button" onclick="quickLogin('akash@example.com', 'password123')" class="text-xs bg-blue-200 hover:bg-blue-300 px-3 py-1 rounded">
        Login as Akash
    </button>
    <button type="button" onclick="quickLogin('alice@example.com', 'password456')" class="text-xs bg-green-200 hover:bg-green-300 px-3 py-1 rounded">
        Login as Alice
    </button>
    <button type="button" onclick="quickLogin('nikhil@example.com', 'password789')" class="text-xs bg-purple-200 hover:bg-purple-300 px-3 py-1 rounded">
        Login as Nikhil
    </button>
    <button type="button" onclick="quickLogin('mokshitha@example.com', 'password101')" class="text-xs bg-pink-200 hover:bg-pink-300 px-3 py-1 rounded">
        Login as Mokshitha
    </button>
    <!-- ADD NEW USER BUTTON HERE -->
    <button type="button" onclick="quickLogin('newuser@example.com', 'password123')" class="text-xs bg-orange-200 hover:bg-orange-300 px-3 py-1 rounded">
        Login as New User
    </button>
</div>
```

### **Step 4: Restart Backend Server**

```bash
# Stop existing server
pkill -f "node node_server.js"

# Start server with new user
cd backend
node node_server.js
```

## 🎯 **EXAMPLE: ADDING A NEW USER**

I've already added **Mokshitha Mandadi** as an example:

### **✅ Backend Configuration Added:**
```javascript
'user4': {
  id: 'user4',
  email: 'mokshitha@example.com',
  password: 'password101',
  customerId: '68d84bc99683f20dd5196b7f', // Real Mokshitha customer from Nessie API
  name: 'Mokshitha Mandadi'
}
```

### **✅ Frontend Display Added:**
- **User List**: Added to login page
- **Quick Login Button**: Pink button for easy access
- **Credentials**: mokshitha@example.com / password101

## 🔧 **TECHNICAL DETAILS:**

### **✅ User Object Structure**
```javascript
{
  id: 'unique_user_id',           // Unique identifier
  email: 'user@example.com',      // Login email
  password: 'password123',        // Login password
  customerId: 'nessie_customer_id', // Nessie API customer ID
  name: 'User Full Name'          // Display name
}
```

### **✅ Required Fields**
- **id**: Unique identifier (user1, user2, etc.)
- **email**: Login email address
- **password**: Login password
- **customerId**: Real customer ID from Nessie API
- **name**: Full name for display

### **✅ Customer ID Requirements**
- Must be a valid customer ID from Nessie API
- Customer must have accounts and transactions
- Use existing customers for demo purposes
- Create new customers only if needed

## 🎉 **CURRENT USERS:**

### **✅ Existing Users**
1. **Akash Mallepally**: akash@example.com / password123
2. **Alice Smith**: alice@example.com / password456
3. **Nikhil Bismillah**: nikhil@example.com / password789
4. **Mokshitha Mandadi**: mokshitha@example.com / password101 *(NEW)*

### **✅ Available Customer IDs**
- `68d840da9683f20dd5196aca` - Alice Smith
- `68d84b999683f20dd5196b7c` - Akash Mallepally
- `68d84bc09683f20dd5196b7e` - Nikhil Bismillah
- `68d84bc99683f20dd5196b7f` - Mokshitha Mandadi
- `68d85f499683f20dd5196e26` - Nikhil Billa
- And more available from the API

## 🌱 **HOW TO TEST NEW USER:**

### **1. Test Login**
1. **Open**: http://localhost:4000
2. **Click**: "Login as Mokshitha" button
3. **Result**: Should login and show Mokshitha's data
4. **Verify**: Should see Mokshitha's real financial data

### **2. Test Data Loading**
1. **Dashboard Stats**: Should show Mokshitha's balance/income/expenses
2. **Transactions**: Should show Mokshitha's transaction history
3. **Analytics**: Should show Mokshitha's spending patterns
4. **Goals/Streaks**: Should show Mokshitha's personal goals

### **3. Verify User-Specific Data**
1. **Different from other users**: Data should be unique to Mokshitha
2. **Real API data**: All data should come from Nessie API
3. **Proper mapping**: Categories and amounts should be correct
4. **Session persistence**: Should maintain login across page refreshes

## 🔧 **TROUBLESHOOTING:**

### **❌ Common Issues**
1. **Invalid Customer ID**: Make sure customer ID exists in Nessie API
2. **No Data**: Customer might not have accounts/transactions
3. **Server Not Restarted**: Must restart backend after adding user
4. **Frontend Not Updated**: Must update both backend and frontend

### **✅ Solutions**
1. **Check Customer ID**: Verify with Nessie API
2. **Check Customer Data**: Ensure customer has accounts
3. **Restart Server**: Always restart after backend changes
4. **Update Both**: Update both backend and frontend files

## 🎉 **ADD NEW USER GUIDE COMPLETE!**

**Your FinQuest app now supports:**
- ✅ Easy addition of new users
- ✅ Real Nessie API integration for all users
- ✅ User-specific data for each user
- ✅ Quick login buttons for easy testing
- ✅ Complete step-by-step guide

**Follow the guide to add as many users as you need! 🚀**

---

## 📞 **Support:**

To add new users:
1. **Get** customer ID from Nessie API
2. **Add** user to backend configuration
3. **Add** user to frontend display
4. **Restart** backend server
5. **Test** new user login

**Your FinQuest app is ready for unlimited users! 🌱💰**

## 🏆 **FINAL STATUS: ADD NEW USER GUIDE COMPLETE!**

**Complete user management, real API integration, easy user addition, ready for scaling! 🎉**
