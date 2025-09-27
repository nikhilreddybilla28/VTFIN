import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your bank account to view analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
