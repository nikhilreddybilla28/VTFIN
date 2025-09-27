import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TagIcon as TargetIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: string;
  progress: {
    progress_percentage: number;
    days_remaining: number;
    on_track: boolean;
  };
}

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/api/goals/');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Financial Goals 🌱</h1>
            <p className="mt-2 text-gray-600">Track your progress and watch your goals bloom</p>
          </div>
          <Link
            to="/goals/new"
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Goal
          </Link>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No goals yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first financial goal.
            </p>
            <div className="mt-6">
              <Link
                to="/goals/new"
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {goal.status === 'completed' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <TargetIcon className="h-6 w-6 text-primary-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{goal.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    goal.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : goal.status === 'active'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{goal.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{goal.progress.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${goal.current_amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${goal.target_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Days remaining */}
                {goal.progress.days_remaining !== null && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>
                      {goal.progress.days_remaining > 0 
                        ? `${goal.progress.days_remaining} days remaining`
                        : goal.progress.days_remaining === 0
                        ? 'Due today'
                        : `${Math.abs(goal.progress.days_remaining)} days overdue`
                      }
                    </span>
                    {!goal.progress.on_track && goal.status === 'active' && (
                      <span className="ml-2 text-orange-600">⚠️ Behind schedule</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/goals/${goal.id}`}
                    className="flex-1 text-center py-2 px-3 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                  >
                    View Details
                  </Link>
                  <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    Update Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;
