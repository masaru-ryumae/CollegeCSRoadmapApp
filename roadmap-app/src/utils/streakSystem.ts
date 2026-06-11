// Streak & Challenge System - Track daily building activity
export interface DailyActivity {
  date: string; // ISO date string
  completed: boolean;
  projectsCount: number;
  xpEarned: number;
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  dailyActivity: DailyActivity[];
  streakMilestones: number[];
  streakRewards: string[];
}

export interface StreakMilestone {
  days: number;
  reward: string;
  icon: string;
  bonus: number; // XP bonus
}

// Define streak milestones
const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 1, reward: 'Getting Started', icon: '🌱', bonus: 0 },
  { days: 7, reward: 'Week Warrior', icon: '💪', bonus: 100 },
  { days: 14, reward: 'Fortnight Champ', icon: '⭐', bonus: 250 },
  { days: 30, reward: 'Month Master', icon: '🏆', bonus: 500 },
  { days: 60, reward: 'Two Month Legend', icon: '👑', bonus: 1000 },
  { days: 100, reward: 'Century Streak', icon: '💯', bonus: 2000 },
  { days: 365, reward: 'Legendary Survivor', icon: '🌟', bonus: 5000 }
];

/**
 * Track daily activity and maintain streak
 */
export function trackDailyActivity(
  currentStreak: StreakData,
  projectsCompleted: number,
  xpEarned: number
): StreakData {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Check if already logged today
  const todayActivity = currentStreak.dailyActivity.find(a => a.date === today);
  if (todayActivity) {
    todayActivity.completed = true;
    todayActivity.projectsCount += projectsCompleted;
    todayActivity.xpEarned += xpEarned;
    return currentStreak;
  }

  // Create new activity for today
  const newActivity: DailyActivity = {
    date: today,
    completed: true,
    projectsCount: projectsCompleted,
    xpEarned
  };

  // Check if streak continues
  let newStreak = currentStreak.currentStreak;
  const lastActivity = currentStreak.dailyActivity[currentStreak.dailyActivity.length - 1];

  if (lastActivity && lastActivity.date === yesterday) {
    // Streak continues
    newStreak = currentStreak.currentStreak + 1;
  } else if (!lastActivity || lastActivity.date !== yesterday) {
    // Streak broken, start new one
    newStreak = 1;
  }

  // Update longest streak
  const newLongestStreak = Math.max(currentStreak.longestStreak, newStreak);

  return {
    ...currentStreak,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
    dailyActivity: [...currentStreak.dailyActivity, newActivity]
  };
}

/**
 * Calculate current streak from daily activity
 */
export function calculateCurrentStreak(dailyActivity: DailyActivity[]): number {
  if (dailyActivity.length === 0) return 0;

  let streak = 0;
  const sortedActivities = [...dailyActivity].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Start from the most recent activity
  let currentDate = sortedActivities[0]?.date;

  // Check if last activity was today or yesterday
  if (currentDate !== today && currentDate !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days backward
  let expectedDate = new Date(currentDate);
  for (const activity of sortedActivities) {
    const expectedDateString = expectedDate.toISOString().split('T')[0];

    if (activity.date === expectedDateString && activity.completed) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get longest streak from history
 */
export function getLongestStreak(dailyActivity: DailyActivity[]): number {
  if (dailyActivity.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  const sortedActivities = [...dailyActivity].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 1; i < sortedActivities.length; i++) {
    const prevDate = new Date(sortedActivities[i - 1].date);
    const currDate = new Date(sortedActivities[i].date);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);

    if (dayDiff === 1 && sortedActivities[i].completed) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Check for streak milestones
 */
export function checkStreakMilestones(streak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter(m => m.days <= streak);
}

/**
 * Get next streak milestone
 */
export function getNextStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days > streak) || null;
}

/**
 * Get streak status
 */
export function getStreakStatus(streakData: StreakData) {
  const currentDate = new Date().toISOString().split('T')[0];
  const daysSinceLastActivity = Math.floor(
    (new Date(currentDate).getTime() - new Date(streakData.lastActivityDate).getTime()) / (24 * 60 * 60 * 1000)
  );

  const isActive = daysSinceLastActivity === 0 || daysSinceLastActivity === 1;
  const daysUntilBreak = Math.max(0, 1 - daysSinceLastActivity);

  return {
    isActive,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    daysUntilBreak,
    warning: daysUntilBreak === 0 && !isActive
  };
}

/**
 * Get activity for a specific date range (for calendar view)
 */
export function getActivityInRange(
  dailyActivity: DailyActivity[],
  startDate: Date,
  endDate: Date
): Map<string, DailyActivity> {
  const map = new Map<string, DailyActivity>();

  for (const activity of dailyActivity) {
    const activityDate = new Date(activity.date);
    if (activityDate >= startDate && activityDate <= endDate) {
      map.set(activity.date, activity);
    }
  }

  return map;
}

/**
 * Get activity calendar (last N days)
 */
export function getActivityCalendar(dailyActivity: DailyActivity[], days: number = 90) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const activityMap = getActivityInRange(dailyActivity, startDate, endDate);
  const calendar: DailyActivity[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const activity = activityMap.get(dateStr);

    calendar.push(
      activity || {
        date: dateStr,
        completed: false,
        projectsCount: 0,
        xpEarned: 0
      }
    );
  }

  return calendar;
}

/**
 * Calculate weekly summary
 */
export function getWeeklySummary(dailyActivity: DailyActivity[]) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyActivities = dailyActivity.filter(a => {
    const date = new Date(a.date);
    return date >= startDate && date <= endDate && a.completed;
  });

  return {
    daysActive: weeklyActivities.length,
    projectsCompleted: weeklyActivities.reduce((sum, a) => sum + a.projectsCount, 0),
    totalXP: weeklyActivities.reduce((sum, a) => sum + a.xpEarned, 0),
    consistency: (weeklyActivities.length / 7) * 100
  };
}

/**
 * Get streak milestone notifications
 */
export function getStreakNotifications(streak: number, previousStreak: number): string[] {
  const notifications: string[] = [];

  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone.days && previousStreak < milestone.days) {
      notifications.push(`🔥 ${milestone.reward} - ${milestone.days} days! +${milestone.bonus} XP`);
    }
  }

  return notifications;
}

/**
 * Calculate streak XP bonus
 */
export function getStreakXPBonus(streak: number): number {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_MILESTONES[i].days) {
      return STREAK_MILESTONES[i].bonus;
    }
  }
  return 0;
}

/**
 * Format streak display
 */
export function formatStreakDisplay(streak: number): string {
  if (streak === 0) return 'Start your streak!';
  if (streak === 1) return '🔥 1 day streak';
  return `🔥 ${streak} day streak`;
}
