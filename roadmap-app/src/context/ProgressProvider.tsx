import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ProgressProviderProps {
  children: ReactNode;
}

const ProgressContext = createContext<null>(null);

export function ProgressProvider({ children }: ProgressProviderProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Handle manual sync events
    const handleSyncProgress = () => {
      if (!user?.id) return;

      // Dispatch a custom event to notify all progress hooks to re-sync
      window.dispatchEvent(
        new CustomEvent('progress-sync-requested', { detail: { userId: user.id } })
      );
    };

    window.addEventListener('sync-progress', handleSyncProgress);
    return () => window.removeEventListener('sync-progress', handleSyncProgress);
  }, [user?.id]);

  return (
    <ProgressContext.Provider value={null}>
      {children}
    </ProgressContext.Provider>
  );
}
