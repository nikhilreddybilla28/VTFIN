import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ArrowTrendingDownIcon as TrendingDownIcon,
  BanknotesIcon,
  TagIcon as TargetIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

interface DashboardData {
  financial_summary: {
    total_spent_30_days: number;
    total_income_30_days: number;
    net_amount: number;
    transaction_count: number;
  };
  goals_summary: {
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    total_target_amount: number;
    total_current_amount: number;
    overall_progress: number;
  };
  recent_activity: {
    recent_transactions: any[];
    recent_goals: any[];
  };
}

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/analytics/dashboard-data');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { financial_summary, goals_summary, recent_activity } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to your Financial Garden 🌱</h1>
          <p className="mt-2 text-gray-600">Track your progress and watch your financial goals bloom</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/goals"
            className="card hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TargetIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Set Goals</h3>
                <p className="text-sm text-gray-500">Create and track financial goals</p>
              </div>
            </div>
          </Link>

          <Link
            to="/connect-bank"
            className="card hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-secondary-600 group-hover:text-secondary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Connect Bank</h3>
                <p className="text-sm text-gray-500">Link your bank account securely</p>
              </div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="card hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-500">Analyze your spending patterns</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDownIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${financial_summary?.total_spent_30_days?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Income (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${financial_summary?.total_income_30_days?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Net Amount</p>
                <p className={`text-2xl font-bold ${
                  (financial_summary?.net_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${financial_summary?.net_amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Goals</span>
                <span className="font-semibold text-gray-900">{goals_summary?.active_goals || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Goals</span>
                <span className="font-semibold text-green-600">{goals_summary?.completed_goals || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Progress</span>
                <span className="font-semibold text-primary-600">{goals_summary?.overall_progress?.toFixed(1) || 0}%</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Overall Progress</span>
                <span>{goals_summary?.overall_progress?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goals_summary?.overall_progress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recent_activity?.recent_transactions?.slice(0, 3).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600 truncate">
                      {transaction.merchant_name || transaction.description}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'debit' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {(!recent_activity?.recent_transactions || recent_activity.recent_transactions.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent transactions. Connect your bank account to get started!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to grow your financial garden? 🌱
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your bank account to start tracking your spending and set your first financial goal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/connect-bank"
                className="btn-primary inline-flex items-center"
              >
                <BanknotesIcon className="w-4 h-4 mr-2" />
                Connect Bank Account
              </Link>
              <Link
                to="/goals"
                className="btn-secondary inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
