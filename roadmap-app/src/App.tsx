import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DecisionTree } from './components/DecisionTree';
import { TimelineView } from './components/TimelineView';
import { Dashboard } from './components/Dashboard';
import { NotificationContainer } from './components/NotificationContainer';
import { NotificationPreferences } from './components/NotificationPreferences';
import { useScheduleNotifications } from './hooks/useScheduleNotifications';
import { setCurrentUserId } from './services/notificationService';
import './index.css';

function AppContent() {
  const { state } = useApp();

  // Initialize notifications
  useScheduleNotifications(state.roadmap);

  if (state.activeView === 'assessment' || !state.assessmentComplete) {
    return <DecisionTree />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/timeline" element={<TimelineView />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings/notifications" element={<NotificationPreferences />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  // Set a default user ID for notifications
  setCurrentUserId('default-user');

  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
        <NotificationContainer />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;