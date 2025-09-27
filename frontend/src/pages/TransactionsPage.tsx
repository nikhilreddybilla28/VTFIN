import React from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const TransactionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Transactions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your bank account to view transactions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
