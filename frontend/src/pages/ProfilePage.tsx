import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile</h3>
          <p className="mt-1 text-sm text-gray-500">
            Profile management coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
