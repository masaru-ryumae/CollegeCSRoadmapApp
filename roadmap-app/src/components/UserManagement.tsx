import { useState } from 'react';

interface User {
  id: string;
  email: string;
  signupDate: string;
  modulesCompleted: number;
  lastActive: string;
  banned: boolean;
  role: 'user' | 'admin';
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'john@example.com',
      signupDate: '2024-01-10',
      modulesCompleted: 5,
      lastActive: '2024-06-08',
      banned: false,
      role: 'user'
    },
    {
      id: '2',
      email: 'jane@example.com',
      signupDate: '2024-01-15',
      modulesCompleted: 8,
      lastActive: '2024-06-07',
      banned: false,
      role: 'user'
    },
    {
      id: '3',
      email: 'bob@example.com',
      signupDate: '2024-02-01',
      modulesCompleted: 2,
      lastActive: '2024-05-20',
      banned: true,
      role: 'user'
    },
    {
      id: '4',
      email: 'admin@example.com',
      signupDate: '2023-12-01',
      modulesCompleted: 15,
      lastActive: '2024-06-08',
      banned: false,
      role: 'admin'
    }
  ]);

  const [searchEmail, setSearchEmail] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchesEmail = !searchEmail ||
      u.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'banned' && u.banned) ||
      (filterStatus === 'active' && !u.banned);
    return matchesEmail && matchesRole && matchesStatus;
  });

  const handleBanUser = (id: string) => {
    if (window.confirm('Ban this user? They will not be able to access the app.')) {
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, banned: true } : u
      ));
    }
  };

  const handleUnbanUser = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, banned: false } : u
    ));
  };

  const handlePromoteToAdmin = (id: string) => {
    if (window.confirm('Promote this user to admin? They will have access to the admin dashboard.')) {
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, role: 'admin' } : u
      ));
    }
  };

  const handleDemoteToUser = (id: string) => {
    if (window.confirm('Demote this user to regular user? They will lose admin access.')) {
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, role: 'user' } : u
      ));
    }
  };

  const handleResetProgress = (id: string) => {
    if (window.confirm('Reset progress for this user? This cannot be undone.')) {
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, modulesCompleted: 0 } : u
      ));
    }
  };

  const daysSinceLastActive = (lastActive: string) => {
    const now = new Date();
    const last = new Date(lastActive);
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getActivityStatus = (lastActive: string) => {
    const days = daysSinceLastActive(lastActive);
    if (days === 0) return { text: 'Active today', color: 'text-green-600 dark:text-green-400' };
    if (days <= 7) return { text: 'Active recently', color: 'text-blue-600 dark:text-blue-400' };
    if (days <= 30) return { text: 'Inactive', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Very inactive', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Search & Filter</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Email
            </label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Signup Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Modules</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Last Active</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => {
                const activityStatus = getActivityStatus(user.lastActive);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.signupDate}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.modulesCompleted}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-700 dark:text-gray-300">{user.lastActive}</p>
                        <p className={`text-xs font-medium ${activityStatus.color}`}>
                          {activityStatus.text}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        user.banned
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {user.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowProgressModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          View
                        </button>
                        {user.role === 'user' ? (
                          <button
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDemoteToUser(user.id)}
                            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm"
                          >
                            Demote
                          </button>
                        )}
                        <button
                          onClick={() => handleResetProgress(user.id)}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium text-sm"
                        >
                          Reset
                        </button>
                        {user.banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                          >
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No users found
          </div>
        )}
      </div>

      {/* Progress Modal */}
      {showProgressModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">User Progress</h3>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Signup Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.signupDate}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modules Completed</p>
                <p className="font-medium text-gray-900 dark:text-white text-lg">{selectedUser.modulesCompleted}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.lastActive}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${Math.min(100, (selectedUser.modulesCompleted / 20) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round((selectedUser.modulesCompleted / 20) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProgressModal(false)}
              className="w-full px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
