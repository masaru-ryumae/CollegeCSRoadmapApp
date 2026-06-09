import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DecisionTree } from './components/DecisionTree';
import { TimelineView } from './components/TimelineView';
import { Dashboard } from './components/Dashboard';
import { NotificationBell } from './components/NotificationBell';
import { ProgressDashboard } from './components/ProgressDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminGuard } from './components/AdminGuard';
import './index.css';

function AppContent() {
  const { state } = useApp();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (state.activeView === 'assessment' || !state.assessmentComplete) {
    return <DecisionTree />;
  }

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      {session && (
        <nav className="app-nav">
          <div className="nav-content">
            <div className="nav-left">
              <h1 className="nav-title">CS Internship Roadmap</h1>
            </div>
            <div className="nav-right">
              <NotificationBell />
              {session.user?.email && (
                <span className="nav-user">{session.user.email.split('@')[0]}</span>
              )}
            </div>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/timeline" element={<TimelineView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/progress" element={<ProgressDashboard />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;