import type { PersonalizedRoadmap, Insight } from '../types';
import {
  calculateMetrics,
  getProgressMetrics,
  getEngagementMetrics,
  getPerformanceMetrics,
} from '../utils/analyticsEngine';

interface Pattern {
  name: string;
  description: string;
  confidence: number;
  data: Record<string, unknown>;
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionSteps: string[];
}

interface Prediction {
  metric: string;
  currentTrend: 'increasing' | 'decreasing' | 'stable';
  forecast: number;
  confidence: number;
}

/**
 * Identify behavioral patterns from roadmap data
 */
export function identifyPatterns(roadmap: PersonalizedRoadmap): Pattern[] {
  const patterns: Pattern[] = [];
  const metrics = calculateMetrics(roadmap);

  // Productivity pattern
  if (metrics.time.thisWeek > 0) {
    const weeklyAvg = metrics.time.thisMonth / 4;
    const trend = metrics.time.thisWeek > weeklyAvg ? 'productive-week' : 'slow-week';
    patterns.push({
      name: trend === 'productive-week' ? 'Productive Week' : 'Slow Week',
      description:
        trend === 'productive-week'
          ? `You logged ${metrics.time.thisWeek} hours this week, above your ${Math.round(weeklyAvg)} hour average.`
          : `You logged ${metrics.time.thisWeek} hours this week, below your ${Math.round(weeklyAvg)} hour average.`,
      confidence: 0.85,
      data: { thisWeek: metrics.time.thisWeek, average: weeklyAvg },
    });
  }

  // Completion speed pattern
  if (metrics.performance.averageCompletionTime > 0) {
    const speed =
      metrics.performance.averageCompletionTime < 10
        ? 'Fast Completer'
        : metrics.performance.averageCompletionTime < 20
          ? 'Average Pace'
          : 'Thorough Worker';

    patterns.push({
      name: speed,
      description: `Your projects typically take ${metrics.performance.averageCompletionTime} days to complete, indicating ${speed === 'Fast Completer' ? 'quick execution' : 'detailed, comprehensive work'}.`,
      confidence: 0.9,
      data: { averageCompletionTime: metrics.performance.averageCompletionTime },
    });
  }

  // Category strength pattern
  const categoryPerformance = metrics.performance.categoryPerformance;
  const sortedCategories = Object.entries(categoryPerformance)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length > 0) {
    patterns.push({
      name: 'Category Strength',
      description: `Your strongest area is ${sortedCategories[0][0]} with ${sortedCategories[0][1]} completed projects. ${sortedCategories.length > 1 ? `You've struggled most with ${sortedCategories[sortedCategories.length - 1][0]}.` : ''}`,
      confidence: 0.95,
      data: { topCategory: sortedCategories[0], allCategories: categoryPerformance },
    });
  }

  // Consistency pattern
  const progress = getProgressMetrics(roadmap);
  if (progress.completed > 5) {
    const consistency = progress.completed > progress.pending ? 'High' : 'Moderate';
    patterns.push({
      name: 'Consistency Level',
      description: `${consistency} consistency: ${progress.completed} projects completed vs ${progress.pending} pending.`,
      confidence: 0.85,
      data: { completed: progress.completed, pending: progress.pending },
    });
  }

  return patterns;
}

/**
 * Generate personalized recommendations
 */
export function suggestImprovements(roadmap: PersonalizedRoadmap): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const metrics = calculateMetrics(roadmap);
  const engagement = getEngagementMetrics(roadmap);
  const progress = getProgressMetrics(roadmap);

  // Time management recommendation
  if (engagement.dailyAverage < 2) {
    recommendations.push({
      title: 'Increase Daily Commitment',
      description: `You're averaging ${engagement.dailyAverage.toFixed(1)} hours per day. Aim for 3+ hours to stay on track.`,
      priority: 'high',
      actionSteps: [
        'Schedule dedicated study blocks',
        'Remove distractions during work time',
        'Use the Pomodoro technique (25 min focus + 5 min break)',
        'Track your hours in the app',
      ],
    });
  }

  // Project speed recommendation
  if (metrics.performance.averageCompletionTime > 20) {
    recommendations.push({
      title: 'Streamline Project Completion',
      description: `Projects take ${metrics.performance.averageCompletionTime} days on average. Consider breaking them into smaller milestones.`,
      priority: 'medium',
      actionSteps: [
        'Identify critical path tasks first',
        'Create weekly checkpoints',
        'Focus on quality over perfection',
        'Get code reviews from peers',
      ],
    });
  }

  // Category diversity recommendation
  const categoryCount = Object.keys(metrics.performance.categoryPerformance).length;
  if (categoryCount < 5) {
    recommendations.push({
      title: 'Diversify Your Learning',
      description: `You've focused on ${categoryCount} categories. Explore more areas to become a well-rounded engineer.`,
      priority: 'medium',
      actionSteps: [
        'Pick a new category from the roadmap',
        'Start with beginner-level projects',
        'Learn from peers in that category',
        'Build a small portfolio project',
      ],
    });
  }

  // Motivation recommendation
  if (progress.percentComplete < 25) {
    recommendations.push({
      title: 'Build Momentum',
      description: `You're ${progress.percentComplete}% through your roadmap. Small wins build confidence!`,
      priority: 'high',
      actionSteps: [
        'Complete one quick project this week',
        'Review your progress weekly',
        'Share wins with your study group',
        'Celebrate milestones',
      ],
    });
  }

  // Streak recommendation
  if (metrics.gamification.streakCount === 0) {
    recommendations.push({
      title: 'Restart Your Streak',
      description: 'You\'re not currently on a streak. Logging work today will reset your motivation!',
      priority: 'high',
      actionSteps: [
        'Start the next module',
        'Log at least 1 hour of work',
        'Set a reminder for tomorrow',
        'Track your daily progress',
      ],
    });
  }

  // Advanced track recommendation
  if (metrics.projects.completionRate > 75 && progress.percentComplete > 50) {
    recommendations.push({
      title: 'Consider Advanced Challenges',
      description: 'You\'re excelling at your current pace. Push yourself with advanced projects.',
      priority: 'low',
      actionSteps: [
        'Take on a system design project',
        'Implement optimization techniques',
        'Mentor others in your study group',
        'Contribute to open source',
      ],
    });
  }

  return recommendations;
}

/**
 * Predict future productivity
 */
export function predictProductivity(
  roadmap: PersonalizedRoadmap,
  conditions?: {
    daysAhead?: number;
    assumedDailyHours?: number;
  }
): Prediction[] {
  const predictions: Prediction[] = [];
  const metrics = calculateMetrics(roadmap);
  const daysAhead = conditions?.daysAhead || 30;
  const assumedDailyHours = conditions?.assumedDailyHours || metrics.time.averageHoursPerDay;

  // Projects completion forecast
  const completionRate = metrics.projects.completionRate / 100;
  const remainingProjects = metrics.projects.totalProjects - metrics.projects.totalCompleted;
  const completionDaysNeeded = metrics.performance.averageCompletionTime * remainingProjects;
  const daysAvailable = daysAhead;
  const feasibility = Math.min(100, Math.round((daysAvailable / completionDaysNeeded) * 100));

  predictions.push({
    metric: 'Projects Completion',
    currentTrend: feasibility > 100 ? 'increasing' : 'decreasing',
    forecast: Math.min(100, completionRate * 100 + (feasibility - 100) * 0.1),
    confidence: 0.75,
  });

  // Hours logged forecast
  const projectedHours = assumedDailyHours * daysAhead;
  const projectedLevel = Math.floor((metrics.gamification.totalXP + projectedHours * 50) / 500) + 1;

  predictions.push({
    metric: 'XP & Level Progress',
    currentTrend: projectedLevel > metrics.gamification.currentLevel ? 'increasing' : 'stable',
    forecast: projectedLevel,
    confidence: 0.8,
  });

  // Streak prediction
  const streakLikelihood = assumedDailyHours > 2 ? 0.9 : assumedDailyHours > 1 ? 0.6 : 0.3;
  const predictedStreak = Math.ceil(daysAhead * streakLikelihood / 7) * 7;

  predictions.push({
    metric: 'Weekly Streak',
    currentTrend: streakLikelihood > 0.7 ? 'increasing' : 'stable',
    forecast: predictedStreak,
    confidence: streakLikelihood,
  });

  return predictions;
}

/**
 * Generate data-driven insights summary
 */
export function analyzePerformance(roadmap: PersonalizedRoadmap): {
  summary: string;
  keyMetrics: Record<string, string | number>;
  patterns: Pattern[];
  recommendations: Recommendation[];
  predictions: Prediction[];
} {
  const metrics = calculateMetrics(roadmap);
  const progress = getProgressMetrics(roadmap);
  const patterns = identifyPatterns(roadmap);
  const recommendations = suggestImprovements(roadmap);
  const predictions = predictProductivity(roadmap);

  let summary = '';

  if (metrics.projects.completionRate > 80) {
    summary = `You're crushing your goals! At ${metrics.projects.completionRate}% completion, you're on pace to finish your roadmap ahead of schedule.`;
  } else if (metrics.projects.completionRate > 50) {
    summary = `You're making solid progress with ${metrics.projects.completionRate}% completion. Keep the momentum going!`;
  } else if (metrics.projects.completionRate > 25) {
    summary = `You're ${metrics.projects.completionRate}% through your roadmap. You've got this—one step at a time!`;
  } else {
    summary = `Getting started is the hardest part. You've got this! Focus on the first few modules and build momentum.`;
  }

  return {
    summary,
    keyMetrics: {
      completion: `${metrics.projects.completionRate}%`,
      hoursThisMonth: metrics.time.thisMonth,
      currentLevel: metrics.gamification.currentLevel,
      badges: metrics.gamification.badgesEarned,
      streak: metrics.gamification.streakCount,
    },
    patterns,
    recommendations,
    predictions,
  };
}

/**
 * Identify anomalies in performance data
 */
export function detectAnomalies(roadmap: PersonalizedRoadmap): Array<{
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}> {
  const anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }> = [];

  const metrics = calculateMetrics(roadmap);
  const progress = getProgressMetrics(roadmap);

  // Low activity detection
  if (metrics.time.thisWeek === 0) {
    anomalies.push({
      type: 'No Activity',
      severity: 'high',
      message: 'No activity logged this week. Your streak is at risk!',
    });
  }

  // Sudden drop in activity
  if (metrics.time.thisWeek < metrics.time.thisMonth / 8) {
    anomalies.push({
      type: 'Activity Drop',
      severity: 'medium',
      message: 'Your activity this week is significantly below your monthly average.',
    });
  }

  // Completion time spike
  if (metrics.performance.averageCompletionTime > 30) {
    anomalies.push({
      type: 'Slow Completion',
      severity: 'medium',
      message: 'Your average project completion time is longer than expected.',
    });
  }

  // High abandonment rate
  const abandonmentRate =
    progress.pending / (progress.modules - progress.inProgress) || 0;
  if (abandonmentRate > 0.5) {
    anomalies.push({
      type: 'High Abandonment',
      severity: 'high',
      message: `${Math.round(abandonmentRate * 100)}% of projects are pending. Consider reducing scope or asking for help.`,
    });
  }

  // Inconsistent activity
  const weeklyVariance = Math.abs(
    metrics.time.thisWeek - metrics.time.thisMonth / 4
  );
  if (weeklyVariance > metrics.time.thisMonth / 4) {
    anomalies.push({
      type: 'Inconsistent Pace',
      severity: 'low',
      message: 'Your activity varies significantly week-to-week. Try to establish a consistent routine.',
    });
  }

  return anomalies;
}

/**
 * Get performance score (0-100)
 */
export function calculatePerformanceScore(roadmap: PersonalizedRoadmap): number {
  const metrics = calculateMetrics(roadmap);
  const progress = getProgressMetrics(roadmap);
  const engagement = getEngagementMetrics(roadmap);

  const completionScore = metrics.projects.completionRate;
  const consistencyScore = Math.min(100, (engagement.activeStreak / 7) * 100); // Weekly streak
  const speedScore = Math.max(0, 100 - (metrics.performance.averageCompletionTime / 30) * 100); // Faster is better
  const engagementScore = Math.min(100, (engagement.dailyAverage / 4) * 100); // 4 hours/day = 100

  return Math.round(
    (completionScore * 0.4 + consistencyScore * 0.25 + speedScore * 0.2 + engagementScore * 0.15)
  );
}
