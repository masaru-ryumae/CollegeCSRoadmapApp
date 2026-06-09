import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import type { ScheduledModule } from '../types';
import './TimelineView.css';

type ViewMode = 'weekly' | 'monthly' | 'quarterly';

const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18', 'Week 19', 'Week 20', 'Week 21', 'Week 22', 'Week 23', 'Week 24'];

export function TimelineView() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const { roadmap } = state;
  const { progress, updateProgress } = useProgress(user?.id || null);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  if (!roadmap) {
    return (
      <div className="timeline-empty">
        <div className="empty-card">
          <h2 className="empty-title">No Roadmap Generated</h2>
          <p className="empty-text">Complete the assessment to see your timeline.</p>
        </div>
      </div>
    );
  }
  
  const displayedModules = showCriticalOnly
    ? roadmap.modules.filter(m => 
        m.dependencies.length > 0 || 
        roadmap.modules.some(other => other.dependencies.includes(m.id))
      )
    : roadmap.modules;
  
  const generatedDate = new Date(roadmap.generatedAt);
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - generatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const currentWeek = Math.max(1, Math.min(weeksSinceStart, roadmap.weeklySchedule.length));
  
  const getStatusColor = (module: ScheduledModule): string => {
    if (module.status === 'done') return 'status-done';
    if (module.status === 'in-progress') return 'status-in-progress';
    if (module.endWeek < currentWeek) return 'status-overdue';
    return 'status-pending';
  };
  
  const getModulePosition = (module: ScheduledModule) => {
    const start = module.startWeek - 1;
    const end = module.endWeek - 1;
    const width = ((end - start + 1) / roadmap.weeklySchedule.length) * 100;
    const left = (start / roadmap.weeklySchedule.length) * 100;
    return { width: `${width}%`, left: `${left}%` };
  };
  
  return (
    <div className="timeline-view">
      {/* Header */}
      <header className="timeline-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'dashboard' })} className="btn btn-ghost btn-sm">
              ← Dashboard
            </button>
            <h1 className="header-title">
              Your Roadmap ({roadmap.modules.length} modules, {roadmap.weeklySchedule.length} weeks)
            </h1>
          </div>
          <div className="header-controls">
            <div className="control-group">
              <label className="control-label">View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="control-select"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <label className="control-checkbox">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="checkbox"
              />
              <span>Critical path only</span>
            </label>
          </div>
        </div>
      </header>

      {/* Error notification */}
      {updateError && (
        <div className="timeline-error" role="alert">
          <div className="error-message">{updateError}</div>
          <button
            className="error-close"
            onClick={() => setUpdateError(null)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Timeline */}
      <main className="timeline-main">
        <div className="timeline-card">
          {/* Week Header */}
          <div className="week-header">
            <div className="week-header-module">Modules</div>
            <div className="week-header-weeks">
              {roadmap.weeklySchedule.map((week, idx) => (
                <div
                  key={week.week}
                  className={`week-header-week ${idx + 1 === currentWeek ? 'current' : ''}`}
                >
                  <div className="week-label">{WEEK_LABELS[idx] || `W${week.week}`}</div>
                  <div className="week-hours">{week.hoursAllocated}h</div>
                  {idx + 1 === currentWeek && <div className="week-marker" title="Current week" />}
                </div>
              ))}
            </div>
          </div>
          
          {/* Module Rows */}
          <div className="module-rows">
            {displayedModules.map((module) => {
              const { width, left } = getModulePosition(module);
              const isCritical = module.dependencies.length > 0 || roadmap.modules.some(other => other.dependencies.includes(module.id));
              const statusClass = getStatusColor(module);
              
              return (
                <div
                  key={module.id}
                  className={`module-row ${selectedModule === module.id ? 'selected' : ''}`}
                  onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                >
                  {/* Module Sidebar */}
                  <div className="module-sidebar">
                    <div className="module-info">
                      <div className="module-header-row">
                        <h3 className="module-name">{module.name}</h3>
                        {isCritical && <span className="critical-badge">Critical</span>}
                      </div>
                      <p className="module-desc">{module.description}</p>
                      <div className="module-meta">
                        <span>{module.assignedHours}h total</span>
                        <span>W{module.startWeek}–W{module.endWeek}</span>
                      </div>
                      {module.dependencies.length > 0 && (
                        <div className="module-deps">
                          Depends on: {module.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                    <select
                      value={
                        progress?.moduleProgress.find((mp) => mp.moduleId === module.id)?.status ||
                        module.status
                      }
                      onChange={(e) => {
                        e.stopPropagation();
                        if (user && progress) {
                          const newStatus = e.target.value as 'pending' | 'in-progress' | 'done';
                          const completedAt =
                            newStatus === 'done'
                              ? new Date().toISOString()
                              : undefined;
                          updateProgress(module.id, {
                            status: newStatus,
                            completedAt,
                          }).catch((err) => {
                            setUpdateError(err instanceof Error ? err.message : 'Failed to update');
                          });
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="module-status-select"
                      disabled={!user}
                      title={!user ? 'Sign in to update progress' : ''}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  {/* Gantt Bar */}
                  <div className="gantt-track" style={{ width: `${roadmap.weeklySchedule.length * 80}px` }}>
                    {/* Grid lines */}
                    <div className="gantt-grid">
                      {roadmap.weeklySchedule.map((_, idx) => (
                        <div key={idx} className="gantt-grid-line" style={{ width: '80px' }} />
                      ))}
                    </div>
                    
                    {/* Bar */}
                    <div
                      className={`gantt-bar ${statusClass}`}
                      style={{ width, left }}
                    >
                      <span className="gantt-bar-label">{module.name}</span>
                      <span className="gantt-bar-weeks">W{module.startWeek}–{module.endWeek}</span>
                    </div>
                    
                    {/* Milestone markers */}
                    {roadmap.weeklySchedule
                      .filter(w => w.moduleIds.includes(module.id) && w.milestones.length > 0)
                      .map((week) => (
                        <div
                          key={week.week}
                          className="gantt-milestone"
                          style={{ left: `${((week.week - 1) / roadmap.weeklySchedule.length) * 100}%` }}
                          title={week.milestones.join(', ')}
                        />
                      ))}
                    
                    {/* Today marker */}
                    <div
                      className="gantt-today"
                      style={{ left: `${((currentWeek - 1) / roadmap.weeklySchedule.length) * 100}%` }}
                      title="Current week"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="legend-color status-pending"></div>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-in-progress"></div>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-done"></div>
            <span>Complete</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-overdue"></div>
            <span>Overdue</span>
          </div>
          <div className="legend-item">
            <div className="legend-color milestone"></div>
            <span>Milestone</span>
          </div>
          <div className="legend-item">
            <div className="legend-color today"></div>
            <span>Today</span>
          </div>
        </div>
        
        {/* Selected Module Detail */}
        {selectedModule && (
          <div className="module-detail card">
            <h3 className="detail-title">
              Module Details: {roadmap.modules.find(m => m.id === selectedModule)?.name}
            </h3>
            <div className="detail-grid">
              <div className="detail-section">
                <h4 className="detail-section-title">Key Points</h4>
                <ul className="detail-list">
                  {roadmap.modules.find(m => m.id === selectedModule)?.key_points.map((kp, i) => (
                    <li key={i} className="detail-list-item">
                      <span className="detail-bullet" />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detail-section">
                <h4 className="detail-section-title">Schedule</h4>
                <dl className="detail-definition-list">
                  <div className="detail-def-row">
                    <dt className="detail-term">Start Week</dt>
                    <dd className="detail-definition">
                      {roadmap.modules.find(m => m.id === selectedModule)?.startWeek}
                    </dd>
                  </div>
                  <div className="detail-def-row">
                    <dt className="detail-term">End Week</dt>
                    <dd className="detail-definition">
                      {roadmap.modules.find(m => m.id === selectedModule)?.endWeek}
                    </dd>
                  </div>
                  <div className="detail-def-row">
                    <dt className="detail-term">Hours Allocated</dt>
                    <dd className="detail-definition">
                      {roadmap.modules.find(m => m.id === selectedModule)?.assignedHours}h
                    </dd>
                  </div>
                  <div className="detail-def-row">
                    <dt className="detail-term">Dependencies</dt>
                    <dd className="detail-definition">
                      {roadmap.modules.find(m => m.id === selectedModule)?.dependencies.join(', ') || 'None'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}