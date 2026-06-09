import React, { useMemo } from 'react';
import { useApp } from '../context/hooks';
import { ExportButton } from './ExportButton';
import { getCriticalPath } from '../utils/roadmapGenerator';
import './Dashboard.css';

export function Dashboard() {
  const { state, dispatch } = useApp();
  const { roadmap, answers } = state;
  
  const progress = useMemo(() => {
    if (!roadmap) return { overall: 0, criticalLeft: 0, totalModules: 0, completed: 0 };
    const completed = roadmap.modules.filter(m => m.status === 'done').length;
    const total = roadmap.modules.length;
    const critical = getCriticalPath(roadmap);
    const criticalLeft = critical.filter(m => m.status !== 'done').length;
    return {
      overall: total > 0 ? Math.round((completed / total) * 100) : 0,
      criticalLeft,
      totalModules: total,
      completed
    };
  }, [roadmap]);
  
  const nextMilestones = useMemo(() => {
    if (!roadmap || !answers.timeline) return [];
    const now = new Date();
    const generatedDate = new Date(roadmap.generatedAt);
    const currentWeek = Math.max(1, Math.floor((now.getTime() - generatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
    
    return roadmap.modules
      .filter(m => m.status !== 'done' && m.startWeek >= currentWeek)
      .sort((a, b) => a.startWeek - b.startWeek)
      .slice(0, 3);
  }, [roadmap, answers.timeline]);
  
  const [activity] = React.useState<Array<{type: string, message: string, time: string}>>(() => {
    const saved = localStorage.getItem('cs-roadmap-activity');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Silently fail on parse error
        return [];
      }
    }
    return [];
  });
  
  const handleGenerateRoadmap = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view: 'assessment' });
    dispatch({ type: 'RESET' });
  };
  
  const handleViewTimeline = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view: 'timeline' });
  };
  
  const getWeeksLeft = () => {
    if (!roadmap) return '—';
    const deadline = new Date(roadmap.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
  };
  
  if (!roadmap) {
    return (
      <div className="dashboard-empty">
        <div className="empty-card">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="empty-title">Start Your Roadmap</h2>
          <p className="empty-text">
            Answer 5 quick questions and get a personalized, week-by-week plan to land your CS internship.
          </p>
          <button
            onClick={handleGenerateRoadmap}
            className="btn btn-primary btn-lg"
          >
            Generate My Roadmap
          </button>
          <p className="empty-note">
            Based on the College CS Internship Playbook • 3 tracks • 12 modules
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">CS Internship Roadmap</h1>
            <span className="header-badge">{roadmap.pathName}</span>
          </div>
          <div className="header-right">
            <ExportButton />
          </div>
        </div>
      </header>
      
      {/* Profile Bar */}
      <div className="profile-bar">
        <div className="profile-info">
          <div className="profile-avatar">
            {(answers.targetCompanyType || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <p className="profile-main">
              {answers.techLevel} • {answers.timeline?.replace('-', ' ').toUpperCase() || '—'}
            </p>
            <p className="profile-sub">
              {answers.hoursPerWeek}/week • {answers.hasExistingProject === 'yes' ? 'Has project' : 'No project'}
            </p>
          </div>
        </div>
        <button onClick={handleGenerateRoadmap} className="btn btn-secondary btn-sm">
          Edit Profile
        </button>
      </div>
      
      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-progress-ring">
              <svg className="progress-ring-svg" viewBox="0 0 36 36">
                <circle className="progress-ring-bg" cx="18" cy="18" r="15.9155" />
                <circle 
                  className="progress-ring-fill" 
                  cx="18" cy="18" r="15.9155" 
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress.overall}
                />
              </svg>
              <span className="progress-ring-value">{progress.overall}%</span>
            </div>
            <p className="stat-label">Overall Progress</p>
            <p className="stat-detail">
              {progress.completed} of {progress.totalModules} modules complete
            </p>
          </div>
          
          <div className="stat-card">
            <p className="stat-label">Weeks Until Deadline</p>
            <p className="stat-value">{getWeeksLeft()}</p>
            <p className="stat-detail">
              Deadline: {new Date(roadmap.deadline).toLocaleDateString()}
            </p>
          </div>
          
          <div className="stat-card">
            <p className="stat-label">Critical Path Remaining</p>
            <p className="stat-value">{progress.criticalLeft}</p>
            <p className="stat-detail">
              {getCriticalPath(roadmap).length} critical modules total
            </p>
          </div>
        </div>
        
        {/* Section: Next Milestones */}
        <section className="section">
          <header className="section-header">
            <h3 className="section-title">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Next Milestones
            </h3>
          </header>
          <div className="milestones-grid">
            {nextMilestones.length > 0 ? (
              nextMilestones.map((module) => (
                <div key={module.id} className="milestone-card">
                  <div className="milestone-header">
                    <h4 className="milestone-name">{module.name}</h4>
                    <span className="milestone-week">Week {module.startWeek}</span>
                  </div>
                  <p className="milestone-desc">{module.description}</p>
                  <div className="milestone-meta">
                    <span>{module.assignedHours}h</span>
                    <span>W{module.startWeek}–W{module.endWeek}</span>
                  </div>
                  <button className="btn btn-primary btn-block">Start Module</button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p>All caught up! Check the timeline for future milestones.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Quick Actions + Activity Feed */}
        <div className="actions-activity-grid">
          <aside className="actions-panel">
            <h3 className="panel-title">Quick Actions</h3>
            <div className="actions-list">
              <button onClick={handleViewTimeline} className="btn btn-secondary btn-full">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                View Full Timeline
              </button>
              <ExportButton />
              <button onClick={handleGenerateRoadmap} className="btn btn-ghost btn-full text-red-600 hover:text-red-700">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Roadmap
              </button>
            </div>
          </aside>
          
          <section className="activity-panel">
            <h3 className="panel-title">Recent Activity</h3>
            {activity.length > 0 ? (
              <div className="activity-list">
                {activity.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="activity-item">
                    <div className={`activity-dot ${item.type}`}></div>
                    <p className="activity-message">{item.message}</p>
                    <span className="activity-time">{item.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No activity yet. Start your first module to see progress here!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}