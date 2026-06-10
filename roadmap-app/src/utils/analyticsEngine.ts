import type {
  PersonalizedRoadmap,
  AnalyticsMetrics,
  ProjectMetrics,
  TimeMetrics,
  PerformanceMetrics,
  GamificationMetrics,
  ActivityEvent,
  Insight,
} from '../types';

/**
 * Calculate project-related metrics
 */
export function calculateProjectMetrics(
  roadmap: PersonalizedRoadmap,
  period: 'week' | 'month' | '3-months' | 'year' | 'all-time'
): ProjectMetrics {
  if (!roadmap) {
    return {
      totalCompleted: 0,
      inProgress: 0,
      totalProjects: 0,
      completionRate: 0,
      averageCompletionTime: 0,
    };
  }

  const now = new Date();
  const generatedDate = new Date(roadmap.generatedAt);
  let startDate = new Date(generatedDate);

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3-months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all-time':
      startDate = new Date(generatedDate);
  }

  const relevantModules = roadmap.modules.filter((m) => {
    if (!m.completedAt) return false;
    const completedDate = new Date(m.completedAt);
    return completedDate >= startDate && completedDate <= now;
  });

  const totalCompleted = roadmap.modules.filter((m) => m.status === 'done').length;
  const inProgress = roadmap.modules.filter((m) => m.status === 'in-progress').length;
  const totalProjects = roadmap.modules.length;

  const completionTimes = relevantModules
    .filter((m) => m.completedAt && m.startedAt)
    .map((m) => {
      const start = new Date(m.startedAt!);
      const end = new Date(m.completedAt!);
      return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    });

  return {
    totalCompleted,
    inProgress,
    totalProjects,
    completionRate: totalProjects > 0 ? Math.round((totalCompleted / totalProjects) * 100) : 0,
    averageCompletionTime:
      completionTimes.length > 0
        ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
        : 0,
  };
}

/**
 * Calculate time-related metrics
 */
export function calculateTimeMetrics(
  roadmap: PersonalizedRoadmap,
  period: 'week' | 'month' | '3-months' | 'year' | 'all-time'
): TimeMetrics {
  if (!roadmap) {
    return {
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
      totalHours: 0,
      averageHoursPerDay: 0,
    };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const getHoursBetween = (start: Date, end: Date): number => {
    return roadmap.modules
      .filter((m) => {
        if (!m.startedAt || !m.completedAt) return false;
        const startDate = new Date(m.startedAt);
        const endDate = new Date(m.completedAt);
        return startDate >= start && endDate <= end;
      })
      .reduce((total, m) => total + m.assignedHours, 0);
  };

  const thisWeek = getHoursBetween(weekAgo, now);
  const thisMonth = getHoursBetween(monthAgo, now);
  const thisYear = getHoursBetween(yearAgo, now);
  const totalHours = roadmap.totalHours || 0;

  return {
    thisWeek,
    thisMonth,
    thisYear,
    totalHours,
    averageHoursPerDay: thisWeek > 0 ? Math.round((thisWeek / 7) * 10) / 10 : 0,
  };
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(roadmap: PersonalizedRoadmap): PerformanceMetrics {
  if (!roadmap) {
    return {
      successRate: 0,
      averageCompletionTime: 0,
      projectsAboveAverage: 0,
      categoryPerformance: {},
    };
  }

  const completedModules = roadmap.modules.filter((m) => m.status === 'done');
  const successRate =
    roadmap.modules.length > 0
      ? Math.round((completedModules.length / roadmap.modules.length) * 100)
      : 0;

  const completionTimes = completedModules
    .filter((m) => m.completedAt && m.startedAt)
    .map((m) => {
      const start = new Date(m.startedAt!);
      const end = new Date(m.completedAt!);
      return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    });

  const averageCompletionTime =
    completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

  // Simulate category performance (would come from more detailed data)
  const categoryPerformance: Record<string, number> = {};
  completedModules.forEach((m) => {
    const category = m.name.split(' ')[0]; // Simple categorization
    categoryPerformance[category] = (categoryPerformance[category] || 0) + 1;
  });

  const projectsAboveAverage = completedModules.filter((m) => {
    if (!m.completedAt || !m.startedAt) return false;
    const start = new Date(m.startedAt);
    const end = new Date(m.completedAt);
    const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    return days < averageCompletionTime;
  }).length;

  return {
    successRate,
    averageCompletionTime,
    projectsAboveAverage,
    categoryPerformance,
  };
}

/**
 * Calculate gamification metrics
 */
export function calculateGamificationMetrics(roadmap: PersonalizedRoadmap): GamificationMetrics {
  if (!roadmap) {
    return {
      totalXP: 0,
      currentLevel: 1,
      nextLevelProgress: 0,
      badgesEarned: 0,
      streakCount: 0,
      longestStreak: 0,
    };
  }

  // Base XP: 100 per completed module + bonus for speed
  const baseXP = roadmap.modules.filter((m) => m.status === 'done').length * 100;

  // Speed bonus: 50 XP for modules completed faster than average
  const completionTimes = roadmap.modules
    .filter((m) => m.status === 'done' && m.completedAt && m.startedAt)
    .map((m) => {
      const start = new Date(m.startedAt!);
      const end = new Date(m.completedAt!);
      return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    });

  const avgTime = completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b) / completionTimes.length : 0;
  const speedBonus = completionTimes.filter((t) => t < avgTime).length * 50;

  const totalXP = baseXP + speedBonus;

  // Level progression: 500 XP per level
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const nextLevelProgress = (totalXP % 500) / 5; // 0-100%

  // Calculate badges (achievements)
  const badgesEarned = Math.min(
    Math.floor(roadmap.modules.filter((m) => m.status === 'done').length / 3),
    10
  );

  // Calculate streak (simplified - would need timestamped data)
  const streakCount = Math.min(roadmap.modules.filter((m) => m.status === 'done').length, 7);
  const longestStreak = Math.min(roadmap.modules.filter((m) => m.status === 'done').length, 14);

  return {
    totalXP,
    currentLevel,
    nextLevelProgress,
    badgesEarned,
    streakCount,
    longestStreak,
  };
}

/**
 * Compare metrics between two periods
 */
export function compareMetrics(
  current: AnalyticsMetrics,
  previous: AnalyticsMetrics
): AnalyticsMetrics['compareToPrevious'] {
  return {
    projectsChange: current.projects.totalCompleted - previous.projects.totalCompleted,
    hoursChange: current.time.thisMonth - previous.time.thisMonth,
    xpChange: current.gamification.totalXP - previous.gamification.totalXP,
    streakChange: current.gamification.streakCount - previous.gamification.streakCount,
  };
}

/**
 * Generate all metrics for a given period
 */
export function calculateMetrics(
  roadmap: PersonalizedRoadmap,
  period: 'week' | 'month' | '3-months' | 'year' | 'all-time' = 'month'
): AnalyticsMetrics {
  const projects = calculateProjectMetrics(roadmap, period);
  const time = calculateTimeMetrics(roadmap, period);
  const performance = calculatePerformanceMetrics(roadmap);
  const gamification = calculateGamificationMetrics(roadmap);

  return {
    projects,
    time,
    performance,
    gamification,
    period,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate progress metrics
 */
export function getProgressMetrics(roadmap: PersonalizedRoadmap) {
  const modules = roadmap.modules.length;
  const completed = roadmap.modules.filter((m) => m.status === 'done').length;
  const inProgress = roadmap.modules.filter((m) => m.status === 'in-progress').length;

  return {
    modules,
    completed,
    inProgress,
    pending: modules - completed - inProgress,
    percentComplete: modules > 0 ? Math.round((completed / modules) * 100) : 0,
  };
}

/**
 * Generate engagement metrics
 */
export function getEngagementMetrics(roadmap: PersonalizedRoadmap) {
  const metrics = calculateMetrics(roadmap, 'month');
  const dailyAverage = metrics.time.averageHoursPerDay;
  const weeklyAverage = metrics.time.thisWeek / 7;

  return {
    lastWeekHours: metrics.time.thisWeek,
    lastMonthHours: metrics.time.thisMonth,
    dailyAverage,
    weeklyAverage,
    activeStreak: metrics.gamification.streakCount,
  };
}

/**
 * Generate performance metrics
 */
export function getPerformanceMetrics(roadmap: PersonalizedRoadmap) {
  const metrics = calculateMetrics(roadmap);
  return {
    successRate: metrics.performance.successRate,
    averageCompletionTime: metrics.performance.averageCompletionTime,
    totalCompleted: metrics.projects.totalCompleted,
    categoryPerformance: metrics.performance.categoryPerformance,
  };
}

/**
 * Extract insights from data
 */
export function generateInsights(roadmap: PersonalizedRoadmap): Insight[] {
  const metrics = calculateMetrics(roadmap);
  const insights: Insight[] = [];

  // Productivity insight
  if (metrics.time.thisWeek > metrics.time.thisMonth / 4) {
    insights.push({
      id: 'productivity-1',
      category: 'productivity',
      title: 'You\'re in a productive streak!',
      description: `You've logged ${metrics.time.thisWeek} hours this week, which is above your monthly average.`,
      severity: 'success',
      actionable: false,
    });
  }

  // Speed insight
  if (metrics.performance.averageCompletionTime > 14) {
    insights.push({
      id: 'pattern-1',
      category: 'pattern',
      title: 'Your projects take longer than average',
      description: `Average completion time is ${metrics.performance.averageCompletionTime} days. Consider breaking projects into smaller milestones.`,
      severity: 'info',
      actionable: true,
      suggestedAction: 'Create weekly checkpoints for large projects',
    });
  }

  // Achievement insight
  if (metrics.gamification.badgesEarned > 5) {
    insights.push({
      id: 'achievement-1',
      category: 'achievement',
      title: 'You\'re collecting badges!',
      description: `You've earned ${metrics.gamification.badgesEarned} badges. Keep up the great work!`,
      severity: 'success',
      actionable: false,
    });
  }

  // Streak warning
  if (metrics.gamification.streakCount === 0) {
    insights.push({
      id: 'warning-1',
      category: 'warning',
      title: 'Your streak is at risk',
      description: 'You haven\'t worked on any projects in 3+ days. Pick up where you left off!',
      severity: 'critical',
      actionable: true,
      suggestedAction: 'Start the next module on your roadmap',
    });
  }

  // Category strength
  const categories = Object.entries(metrics.performance.categoryPerformance)
    .sort(([, a], [, b]) => b - a);

  if (categories.length > 0) {
    insights.push({
      id: 'pattern-2',
      category: 'pattern',
      title: `Your strongest category: ${categories[0][0]}`,
      description: `You've completed ${categories[0][1]} projects in this category.`,
      severity: 'info',
      actionable: false,
    });
  }

  // Recommendation
  if (metrics.projects.completionRate > 75) {
    insights.push({
      id: 'recommendation-1',
      category: 'recommendation',
      title: 'Great completion rate!',
      description: 'You\'re on track to exceed your goals. Consider increasing difficulty.',
      severity: 'info',
      actionable: true,
      suggestedAction: 'Take on an advanced module',
    });
  }

  return insights.slice(0, 5); // Return top 5 insights
}

/**
 * Get timeline events from roadmap
 */
export function getTimelineEvents(roadmap: PersonalizedRoadmap): Array<{
  date: string;
  events: ActivityEvent[];
}> {
  const eventMap: Record<string, ActivityEvent[]> = {};

  roadmap.modules.forEach((m) => {
    if (m.completedAt) {
      const date = new Date(m.completedAt).toISOString().split('T')[0];
      if (!eventMap[date]) eventMap[date] = [];

      eventMap[date].push({
        id: `module-${m.id}`,
        type: 'project-completed',
        title: `Completed: ${m.name}`,
        description: `Finished ${m.name} in ${m.assignedHours} hours`,
        timestamp: m.completedAt,
      });
    }
  });

  return Object.entries(eventMap)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, events]) => ({
      date,
      events,
    }));
}
