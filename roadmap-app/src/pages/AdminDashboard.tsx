import { useState } from 'react';
import { ResourceManagement } from '../components/ResourceManagement';
import { ResourceSuggestions } from '../components/ResourceSuggestions';
import { InviteCodes } from '../components/InviteCodes';
import { UserManagement } from '../components/UserManagement';

type Tab = 'resources' | 'suggestions' | 'invite-codes' | 'users';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('resources');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'resources', label: 'Resources', icon: '📚' },
    { id: 'suggestions', label: 'Suggestions', icon: '💡' },
    { id: 'invite-codes', label: 'Invite Codes', icon: '🎟️' },
    { id: 'users', label: 'User Management', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resources':
        return <ResourceManagement />;
      case 'suggestions':
        return <ResourceSuggestions />;
      case 'invite-codes':
        return <InviteCodes />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage resources, users, and system settings</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logged in as: <span className="font-medium text-gray-900 dark:text-white">admin@example.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Admin Dashboard v1.0 - College CS Roadmap App
          </p>
        </div>
      </div>
    </div>
  );
}
