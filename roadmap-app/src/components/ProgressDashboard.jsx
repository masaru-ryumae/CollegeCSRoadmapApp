import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { Clock, TrendingUp, Target, Zap } from 'lucide-react';
import './ProgressDashboard.css';

export function ProgressDashboard() {
  const { state } = useApp();
  const { user } = useAuth();
  const { progress, loading, lastSync } = useProgress(user?.id || null);
  const { roadmap } = state;
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    // Calculate time spent based on completed key points
    if (progress?.moduleProgress) {
      const totalKeyPoints = roadmap?.modules.reduce((sum, m) => sum + m.key_points.length, 0) || 0;
      const completedKeyPoints = progress.moduleProgress.reduce(
        (sum, mp) => sum + mp.completedKeyPoints.length,
        0
      );
      const hoursPerKeyPoint = (roadmap?.totalHours || 0) / totalKeyPoints || 0;
      setTimeSpent(Math.round(completedKeyPoints * hoursPerKeyPoint));
    }
  }, [progress, roadmap]);

  if (!roadmap || !user) {
    return (
      <div className="progress-dashboard empty">
        <p>Complete the assessment to see your progress dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const completedModules = progress?.moduleProgress.filter((m) => m.status === 'done').length || 0;
  const totalModules = roadmap.modules.length;
  const generatedDate = new Date(roadmap.generatedAt);
  const now = new Date();
  const currentWeek = Math.floor(
    (now.getTime() - generatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1;
  const totalWeeks = roadmap.weeklySchedule.length;

  // Calculate next milestone
  const nextMilestone = roadmap.weeklySchedule.find(
    (w) => w.week >= currentWeek && w.milestones.length > 0
  );

  return (
    <div className="progress-dashboard">
      {/* Overall Progress Card */}
      <div className="progress-card main-card">
        <div className="card-header">
          <h2>Overall Progress</h2>
          <span className="progress-percent">{progress?.overallProgress || 0}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress?.overallProgress || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-label">Modules Completed</span>
            <span className="stat-value">
              {completedModules}/{totalModules}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Week</span>
            <span className="stat-value">
              {currentWeek}/{totalWeeks}
            </span>
          </div>
        </div>
        {lastSync && (
          <div className="last-sync">
            Last synced: {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Next Milestone Card */}
      {nextMilestone && (
        <div className="progress-card milestone-card">
          <div className="card-header">
            <Target size={20} />
            <h3>Next Milestone</h3>
          </div>
          <div className="milestone-content">
            <div className="milestone-week">Week {nextMilestone.week}</div>
            <div className="milestone-list">
              {nextMilestone.milestones.map((milestone, idx) => (
                <div key={idx} className="milestone-item">
                  {milestone}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Spent Card */}
      <div className="progress-card time-card">
        <div className="card-header">
          <Clock size={20} />
          <h3>Time Spent</h3>
        </div>
        <div className="time-content">
          <div className="time-value">{timeSpent}h</div>
          <div className="time-label">out of {roadmap.totalHours}h estimated</div>
          <div className="time-bar">
            <div
              className="time-bar-fill"
              style={{ width: `${(timeSpent / roadmap.totalHours) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Pace Card */}
      <div className="progress-card pace-card">
        <div className="card-header">
          <TrendingUp size={20} />
          <h3>Pace</h3>
        </div>
        <div className="pace-content">
          <div className="pace-status on-track">On Track</div>
          <div className="pace-detail">
            {currentWeek >= Math.ceil((totalWeeks * completedModules) / totalModules)
              ? 'Ahead of schedule'
              : 'Right on schedule'}
          </div>
        </div>
      </div>

      {/* Achievements Card */}
      <div className="progress-card achievements-card">
        <div className="card-header">
          <Zap size={20} />
          <h3>Recent Achievements</h3>
        </div>
        <div className="achievements-list">
          {progress?.moduleProgress
            .filter((m) => m.completedAt)
            .slice(0, 3)
            .map((achievement) => {
              const module = roadmap.modules.find((m) => m.id === achievement.moduleId);
              return (
                <div key={achievement.moduleId} className="achievement-item">
                  <div className="achievement-name">{module?.name}</div>
                  <div className="achievement-date">
                    {new Date(achievement.completedAt!).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          {(progress?.moduleProgress.filter((m) => m.completedAt).length || 0) === 0 && (
            <p className="no-achievements">Complete modules to unlock achievements!</p>
          )}
        </div>
      </div>
    </div>
  );
}
