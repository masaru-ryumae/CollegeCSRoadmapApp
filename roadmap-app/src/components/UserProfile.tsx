import { useNavigate } from 'react-router-dom';
import { logout, type AuthUser } from '../services/supabaseAuth';

interface UserProfileProps {
  user: AuthUser;
  stats?: {
    projectsStarted: number;
    favorites: number;
    progress: number;
  };
  onLogout?: () => void;
}

export function UserProfile({ user, stats, onLogout }: UserProfileProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = () => {
    const name = user.displayName || user.email || 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-lg">
            {user.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials()
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{displayName}</h2>
            <p className="text-blue-100">
              {user.email || 'Guest User'}
              {user.isAnonymous && ' (Anonymous)'}
            </p>
            {user.isAnonymous && (
              <p className="text-xs text-blue-100 mt-1">
                Sign in to save progress across devices
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Projects Started"
              value={stats.projectsStarted}
            />
            <StatCard
              label="Favorites"
              value={stats.favorites}
            />
            <StatCard
              label="Overall Progress"
              value={`${stats.progress}%`}
            />
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="px-6 py-6 space-y-3">
        <button
          onClick={() => navigate('/profile/settings')}
          className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition"
        >
          Profile Settings
        </button>

        <button
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg font-medium transition border border-red-200 dark:border-red-800"
        >
          Sign Out
        </button>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-600 dark:text-gray-400">
        <p>Securely synced to cloud</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {value}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}
