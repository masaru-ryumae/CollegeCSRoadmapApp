import React, { useState, useEffect } from 'react';
import {
  getActivityCalendar,
  getStreakStatus,
  getNextStreakMilestone,
  getWeeklySummary,
  formatStreakDisplay
} from '../utils/streakSystem';
import './StreakTracker.css';

/**
 * StreakTracker Component - Display building streaks with calendar view
 */
export function StreakTracker({ streakData = {}, onCheckIn = null }) {
  const [calendar, setCalendar] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [streakStatus, setStreakStatus] = useState(null);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const defaultStreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date().toISOString().split('T')[0],
    dailyActivity: [],
    streakMilestones: [],
    streakRewards: []
  };

  const safeStreakData = { ...defaultStreakData, ...streakData };

  useEffect(() => {
    // Build activity calendar (last 90 days)
    const activityCalendar = getActivityCalendar(safeStreakData.dailyActivity, 90);
    setCalendar(activityCalendar);

    // Get streak status
    const status = getStreakStatus(safeStreakData);
    setStreakStatus(status);

    // Get weekly summary
    const summary = getWeeklySummary(safeStreakData.dailyActivity);
    setWeeklySummary(summary);

    // Check if checked in today
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = safeStreakData.dailyActivity.find(a => a.date === today && a.completed);
    setCheckedInToday(!!todayActivity);
  }, [safeStreakData]);

  const handleCheckIn = () => {
    if (onCheckIn) {
      onCheckIn();
      setCheckedInToday(true);
    }
  };

  const nextMilestone = getNextStreakMilestone(safeStreakData.currentStreak);

  // Organize calendar into weeks for display
  const weeks: any[] = [];
  for (let i = 0; i < calendar.length; i += 7) {
    weeks.push(calendar.slice(i, i + 7));
  }

  return (
    <div className="streak-tracker">
      {/* Main Streak Display */}
      <div className="streak-display">
        <div className="streak-card">
          <div className="streak-number">
            <span className="fire-emoji">🔥</span>
            <span className="number">{safeStreakData.currentStreak}</span>
          </div>
          <div className="streak-label">Current Streak</div>
          <div className="streak-detail">{formatStreakDisplay(safeStreakData.currentStreak)}</div>
        </div>

        <div className="streak-card longest">
          <div className="streak-number">
            <span className="trophy-emoji">👑</span>
            <span className="number">{safeStreakData.longestStreak}</span>
          </div>
          <div className="streak-label">Longest Streak</div>
          <div className="streak-detail">Personal record</div>
        </div>

        {streakStatus && (
          <div className={`streak-card status ${streakStatus.warning ? 'warning' : ''}`}>
            <div className="status-info">
              <div className="status-label">
                {streakStatus.isActive ? '✅ Active' : '⚠️ At Risk'}
              </div>
              {streakStatus.daysUntilBreak > 0 && (
                <div className="days-until-break">
                  {streakStatus.daysUntilBreak === 1
                    ? 'Check in today to keep your streak!'
                    : `${streakStatus.daysUntilBreak} days until break`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Check-in Button */}
      {!checkedInToday && (
        <button className="checkin-button" onClick={handleCheckIn}>
          ✓ Check In Today
        </button>
      )}
      {checkedInToday && (
        <div className="checkin-complete">✅ Checked in today!</div>
      )}

      {/* Weekly Summary */}
      {weeklySummary && (
        <div className="weekly-summary">
          <h3>This Week</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-icon">📅</div>
              <div className="summary-label">Days Active</div>
              <div className="summary-value">{weeklySummary.daysActive}/7</div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">✓</div>
              <div className="summary-label">Projects</div>
              <div className="summary-value">{weeklySummary.projectsCompleted}</div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">⭐</div>
              <div className="summary-label">XP Earned</div>
              <div className="summary-value">{weeklySummary.totalXP}</div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">📊</div>
              <div className="summary-label">Consistency</div>
              <div className="summary-value">{Math.round(weeklySummary.consistency)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="next-milestone">
          <div className="milestone-icon">{nextMilestone.icon}</div>
          <div className="milestone-info">
            <div className="milestone-reward">{nextMilestone.reward}</div>
            <div className="milestone-progress">
              {nextMilestone.days - safeStreakData.currentStreak} days away • +{nextMilestone.bonus} XP
            </div>
          </div>
        </div>
      )}

      {/* Activity Calendar (Last 90 Days) */}
      <div className="calendar-section">
        <h3>Activity Calendar (Last 90 Days)</h3>
        <div className="calendar-grid">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`calendar-day ${day.completed ? 'active' : 'inactive'}`}
                  title={`${day.date}: ${day.projectsCount} projects, ${day.xpEarned} XP`}
                >
                  <div className="day-dot" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot active"></div>
            <span>Active</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot inactive"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="milestones-section">
        <h3>🎯 Streak Milestones</h3>
        <div className="milestones-list">
          {[7, 14, 30, 60, 100, 365].map((days) => {
            const reached = safeStreakData.currentStreak >= days;
            const nextUnreached = !reached && (nextMilestone ? days === nextMilestone.days : false);

            return (
              <div key={days} className={`milestone-item ${reached ? 'unlocked' : 'locked'} ${nextUnreached ? 'next' : ''}`}>
                <div className="milestone-marker">
                  {reached ? '✓' : days}
                </div>
                <div className="milestone-details">
                  <div className="milestone-days">{days} Day Streak</div>
                  <div className="milestone-reward">
                    {days === 7 && 'Week Warrior Badge'}
                    {days === 14 && 'Fortnight Champ Badge'}
                    {days === 30 && 'Month Master Badge + 500 XP'}
                    {days === 60 && 'Two Month Legend + 1000 XP'}
                    {days === 100 && 'Century Streak Badge + 2000 XP'}
                    {days === 365 && 'Legendary Survivor Badge + 5000 XP'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="streak-tips">
        <h4>💡 Tips to Maintain Your Streak</h4>
        <ul>
          <li>Check in daily to keep your streak alive</li>
          <li>Even small projects count - any activity counts</li>
          <li>Set a reminder to check in before midnight</li>
          <li>Share your streak progress with friends for motivation</li>
          <li>Longer streaks earn bonus XP multipliers</li>
        </ul>
      </div>
    </div>
  );
}

export default StreakTracker;
