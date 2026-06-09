import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard protects admin routes by checking user role.
 * Only users with role === 'admin' can access protected routes.
 * Non-admins are redirected to home.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { state } = useApp();

  // Check if user is admin (from context state)
  const isAdmin = state.userRole === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
