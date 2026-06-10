import { useState } from 'react';
import { Module, TechLevel } from '../types/index';
import {
  suggestOptimalSchedule,
  getTimeRecommendations,
  getMilestoneSuggestions,
  getTimeAnalytics,
  ProjectTimeData,
  UserAvailability,
  TimeAnalytics,
  OptimalSchedule,
  MilestoneSuggestion,
} from '../utils/timeTracking';
import '../styles/TimeManagementDash.css';

interface TimeManagementDashProps {
  modules: Module[];
  onClose?: () => void;
}

export function TimeManagementDash({
  modules,
  onClose,
}: TimeManagementDashProps) {
  const [userLevel, setUserLevel] = useState<TechLevel>('intermediate');
  const [userAvailability, setUserAvailability] = useState<UserAvailability>({
    monday: 3,
    tuesday: 3,
    wednesday: 3,
    thursday: 3,
    friday: 3,
    saturday: 2,
    sunday: 2,
    totalPerWeek: 19,
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'schedule' | 'analytics' | 'project'
  >('schedule');

  // Mock data - in real app, would come from database
  const mockTimeData: ProjectTimeData[] = modules.map((m) => ({
    projectId: m.id,
    projectName: m.name,
    plannedHours: m.hours[userLevel],
    estimatedHoursForLevel: m.hours[userLevel],
    actualHoursSpent: Math.round(Math.random() * m.hours[userLevel] * 0.7),
    entries: [],
    blocks: [],
    completionPercentage: Math.round(Math.random() * 80),
    daysElapsed: Math.round(Math.random() * 30),
    estimatedDaysRemaining: Math.round(Math.random() * 20),
  }));

  const schedules = suggestOptimalSchedule(
    modules,
    userAvailability,
    userLevel
  );

  const analytics = getTimeAnalytics(mockTimeData);

  const selectedProject = modules.find((m) => m.id === selectedProjectId);
  const projectTimeData = mockTimeData.find(
    (p) => p.projectId === selectedProjectId
  );
  const projectRecommendation = selectedProject
    ? getTimeRecommendations(
        selectedProject,
        userLevel,
        userAvailability.totalPerWeek
      )
    : null;

  const projectMilestones = selectedProject
    ? getMilestoneSuggestions(selectedProject, userLevel)
    : [];

  const updateAvailability = (day: keyof Omit<UserAvailability, 'totalPerWeek'>, hours: number) => {
    const updated = { ...userAvailability, [day]: hours };
    updated.totalPerWeek = Object.values(updated).reduce((sum, v) => {
      return typeof v === 'number' ? sum + v : sum;
    }, 0) - userAvailability.totalPerWeek;

    // Recalculate properly
    updated.totalPerWeek =
      updated.monday +
      updated.tuesday +
      updated.wednesday +
      updated.thursday +
      updated.friday +
      updated.saturday +
      updated.sunday;

    setUserAvailability(updated);
  };

  return (
    <div className="time-management-container">
      <div className="time-header">
        <div>
          <h2>Time Management Dashboard</h2>
          <p>Plan your learning schedule and track progress</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="time-settings">
        <div className="setting-group">
          <label htmlFor="skill-level">Your Skill Level</label>
          <select
            id="skill-level"
            value={userLevel}
            onChange={(e) => setUserLevel(e.target.value as TechLevel)}
            className="select-input"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="availability-section">
          <h3>Weekly Availability ({userAvailability.totalPerWeek}h/week)</h3>
          <div className="availability-grid">
            {(
              [
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday',
              ] as const
            ).map((day) => (
              <div key={day} className="availability-item">
                <label>{day.charAt(0).toUpperCase() + day.slice(1, 3)}</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={userAvailability[day]}
                  onChange={(e) =>
                    updateAvailability(day, parseInt(e.target.value) || 0)
                  }
                  className="hour-input"
                />
                <span className="unit">h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="time-tabs">
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Optimal Schedule
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button
          className={`tab ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          📋 Project Timeline
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="tab-content">
          <div className="schedule-grid">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule.projectId} schedule={schedule} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="tab-content">
          <AnalyticsView analytics={analytics} />
        </div>
      )}

      {activeTab === 'project' && (
        <div className="tab-content project-timeline">
          <div className="project-selector">
            <h3>Select a Project</h3>
            <div className="project-list">
              {modules.map((module) => (
                <button
                  key={module.id}
                  className={`project-item ${
                    selectedProjectId === module.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedProjectId(module.id)}
                >
                  {module.name}
                </button>
              ))}
            </div>
          </div>

          {selectedProject && projectRecommendation && projectTimeData && (
            <div className="project-details">
              <h3>{selectedProject.name}</h3>

              <div className="recommendation-card">
                <p className="rec-title">Time Recommendation</p>
                <p className="rec-message">
                  {projectRecommendation.message}
                </p>
                <div className="rec-details">
                  <span>
                    {projectRecommendation.hoursPerWeek}h/week → {projectRecommendation.weeksToComplete} weeks
                  </span>
                  {!projectRecommendation.isAchievable && (
                    <span className="warning">⚠️ Challenging</span>
                  )}
                </div>
              </div>

              <div className="progress-section">
                <h4>Project Progress</h4>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${projectTimeData.completionPercentage}%`,
                    }}
                  />
                </div>
                <p className="progress-text">
                  {projectTimeData.completionPercentage}% complete
                </p>
                <div className="progress-details">
                  <span>
                    {projectTimeData.actualHoursSpent.toFixed(1)}h spent of{' '}
                    {projectTimeData.plannedHours}h
                  </span>
                  <span>
                    ~{projectTimeData.estimatedDaysRemaining} days remaining
                  </span>
                </div>
              </div>

              <div className="milestones-section">
                <h4>Recommended Milestones</h4>
                <div className="milestones-list">
                  {projectMilestones.map((milestone, idx) => (
                    <MilestoneCard key={idx} milestone={milestone} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedProject && (
            <div className="empty-state">
              <p>Select a project to see timeline and milestones</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ScheduleCardProps {
  schedule: OptimalSchedule;
}

function ScheduleCard({ schedule }: ScheduleCardProps) {
  const startDate = new Date(schedule.recommendedStartDate);
  const endDate = new Date(schedule.recommendedEndDate);
  const weeks = Math.round(
    (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const priorityColor: Record<string, string> = {
    high: '#ff6b6b',
    medium: '#ffc107',
    low: '#28a745',
  };

  return (
    <div className="schedule-card" style={{ borderLeftColor: priorityColor[schedule.priority] }}>
      <h4>{schedule.projectName}</h4>
      <div className="schedule-details">
        <div className="detail-item">
          <span className="label">Suggested Hours/Week</span>
          <span className="value">{schedule.suggestedHoursPerWeek}h</span>
        </div>
        <div className="detail-item">
          <span className="label">Duration</span>
          <span className="value">{weeks} weeks</span>
        </div>
        <div className="detail-item">
          <span className="label">Start</span>
          <span className="value">{schedule.recommendedStartDate}</span>
        </div>
      </div>
      <p className="reason">{schedule.reason}</p>
      <div className="priority-badge" style={{ backgroundColor: priorityColor[schedule.priority] }}>
        {schedule.priority.toUpperCase()} PRIORITY
      </div>
    </div>
  );
}

interface AnalyticsViewProps {
  analytics: TimeAnalytics;
}

function AnalyticsView({ analytics }: AnalyticsViewProps) {
  return (
    <div className="analytics-grid">
      <div className="analytics-card">
        <h4>Total Hours Tracked</h4>
        <div className="big-number">{analytics.totalHoursTracked}</div>
        <p className="subtext">Hours of learning</p>
      </div>

      <div className="analytics-card">
        <h4>Avg Hours/Day</h4>
        <div className="big-number">{analytics.averageHoursPerDay}</div>
        <p className="subtext">Last 30 days</p>
      </div>

      <div className="analytics-card">
        <h4>Avg Hours/Week</h4>
        <div className="big-number">{analytics.averageHoursPerWeek}</div>
        <p className="subtext">Current pace</p>
      </div>

      <div className="analytics-card">
        <h4>Projects Active</h4>
        <div className="big-number">{analytics.projectsCount}</div>
        <p className="subtext">In progress</p>
      </div>

      <div className="analytics-card full-width">
        <h4>Completion Rate</h4>
        <div className="completion-bar">
          <div
            className="completion-fill"
            style={{ width: `${analytics.completionRate}%` }}
          />
        </div>
        <p className="completion-text">
          {analytics.completionRate}% of projects completed
        </p>
      </div>

      <div className="analytics-card full-width">
        <h4>Weekly Trend</h4>
        <div className="trend-chart">
          {analytics.trends.map((trend, idx) => (
            <div key={idx} className="trend-bar-container">
              <div className="trend-bar">
                <div
                  className="trend-fill"
                  style={{
                    height: `${Math.min((trend.hoursWorked / 20) * 100, 100)}%`,
                  }}
                  title={`${trend.hoursWorked}h in ${trend.period}`}
                />
              </div>
              <label>{trend.period}</label>
              <span className="trend-value">{trend.hoursWorked}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: MilestoneSuggestion;
}

function MilestoneCard({ milestone }: MilestoneCardProps) {
  return (
    <div className="milestone-card">
      <div className="milestone-header">
        <h5>{milestone.name}</h5>
        <span className="milestone-weeks">{milestone.estimatedWeeks} weeks</span>
      </div>
      <div className="milestone-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${milestone.percentageComplete * 100}%` }}
          />
        </div>
      </div>
      <div className="milestone-activities">
        <p className="activities-label">Key Activities:</p>
        <ul>
          {milestone.keyActivities.map((activity, idx) => (
            <li key={idx}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
