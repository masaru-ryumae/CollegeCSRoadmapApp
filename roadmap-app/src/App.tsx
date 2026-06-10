import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DecisionTree } from './components/DecisionTree';
import { TimelineView } from './components/TimelineView';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Charts } from './components/Charts';
import { ProgressTimeline } from './components/ProgressTimeline';
import { ReportBuilder } from './components/ReportBuilder';
import { Insights } from './components/Insights';
import './index.css';

function AppContent() {
  const { state } = useApp();

  if (state.activeView === 'assessment' || !state.assessmentComplete) {
    return <DecisionTree />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/timeline" element={<TimelineView />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/charts" element={<Charts />} />
      <Route path="/progress" element={<ProgressTimeline />} />
      <Route path="/reports" element={<ReportBuilder />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;