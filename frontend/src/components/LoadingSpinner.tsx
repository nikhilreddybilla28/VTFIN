import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading FinQuest...</h2>
        <p className="text-gray-500 mt-2">Setting up your financial garden 🌱</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
