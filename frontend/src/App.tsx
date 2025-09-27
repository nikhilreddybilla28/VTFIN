import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthChange } from './firebase/auth';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import PlaidConnectPage from './pages/PlaidConnectPage';

// Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Store a demo token for API calls
        localStorage.setItem('firebase_token', 'demo-token-123');
      } else {
        localStorage.removeItem('firebase_token');
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          
          {user && <Navbar />}
          
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <DashboardPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/goals" 
              element={user ? <GoalsPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/transactions" 
              element={user ? <TransactionsPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/analytics" 
              element={user ? <AnalyticsPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <ProfilePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/connect-bank" 
              element={user ? <PlaidConnectPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;