import type { PersonalizedRoadmap, ModuleProgress } from '../types';

export interface PerformanceTrend {
  period: string;
  successRate: number; // percentage
  velocity: number; // modules per week
  engagementScore: number; // 0-1
  consistencyScore: number; // 0-1
}

export interface StrengthWeakness {
  category: string;
  strengthScore: number; // 0-1
  moduleCount: number;
  topSkills: string[];
  areasForImprovement: string[];
}

export interface PerformanceInsights {
  overallPerformance: number; // 0-100
  trends: PerformanceTrend[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  recommendations: string[];
  generatedAt: string;
}

export interface ChurnRiskAssessment {
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    inactivityDays: number;
    declineRate: number; // negative value indicating decline
    incompletionRate: number;
    engagementTrend: 'up' | 'stable' | 'down';
  };
  interventions: string[];
  predictedChurnDate?: string;
}

export interface CohortComparison {
  userId: string;
  percentile: number; // 0-100
  userMetric: number;
  cohortMedian: number;
  cohortPercentile: { [key: number]: number };
  category: string;
}

export interface FocusArea {
  category: string;
  currentScore: number; // 0-1
  potentialGain: number; // how much improvement is possible
  recommendedTimeAllocation: number; // percentage of effort
  estimatedImpact: string;
}

const ANALYTICS_KEY = 'performance-analytics-';
const COHORT_KEY = 'cohort-analytics-';

/**
 * Analyze performance trends over time
 */
export const analyzePerformanceTrends = (
  userId: string,
  roadmap: PersonalizedRoadmap,
  currentProgress: ModuleProgress[]
): PerformanceInsights => {
  // Fetch historical analytics
  const analyticsKey = `${ANALYTICS_KEY}${userId}`;
  const stored = localStorage.getItem(analyticsKey);
  const history = stored ? JSON.parse(stored) : [];

  // Calculate trends for different periods
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const month = 30 * 24 * 60 * 60 * 1000;

  // Weekly trend
  const weekAgo = now - week;
  const weekData = history.filter((h: any) => new Date(h.timestamp).getTime() > weekAgo);

  const monthAgo = now - month;
  const monthData = history.filter((h: any) => new Date(h.timestamp).getTime() > monthAgo);

  // Calculate success rate (completion rate)
  const completedCount = currentProgress.filter(p => p.status === 'done').length;
  const totalCount = currentProgress.length;
  const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate velocity (modules per week)
  const completedThisWeek = weekData.filter((h: any) => h.status === 'done').length || 0;
  const weeklyVelocity = completedThisWeek / 1; // modules per week

  // Calculate engagement score
  const activeDays = new Set(weekData.map((h: any) => new Date(h.timestamp).toDateString())).size;
  const engagementScore = Math.min(1, activeDays / 7);

  // Calculate consistency score
  const monthActiveDays = new Set(monthData.map((h: any) => new Date(h.timestamp).toDateString())).size;
  const consistencyScore = Math.min(1, monthActiveDays / 30);

  const trends: PerformanceTrend[] = [
    {
      period: 'week',
      successRate: weekData.length > 0 ? (weekData.filter((h: any) => h.status === 'done').length / weekData.length) * 100 : successRate,
      velocity: weeklyVelocity,
      engagementScore,
      consistencyScore
    },
    {
      period: 'month',
      successRate: monthData.length > 0 ? (monthData.filter((h: any) => h.status === 'done').length / monthData.length) * 100 : successRate,
      velocity: monthData.length > 0 ? (monthData.filter((h: any) => h.status === 'done').length / 4.3) : weeklyVelocity, // ~4.3 weeks per month
      engagementScore: Math.min(1, activeDays / 30),
      consistencyScore
    }
  ];

  // Categorize modules and analyze strengths/weaknesses
  const categoryMap = new Map<string, ModuleProgress[]>();
  currentProgress.forEach(progress => {
    const category = progress.moduleId.split('-')[0] || 'general';
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(progress);
  });

  const strengths: StrengthWeakness[] = [];
  const weaknesses: StrengthWeakness[] = [];

  categoryMap.forEach((progresses, category) => {
    const completedInCategory = progresses.filter(p => p.status === 'done').length;
    const completionRate = progresses.length > 0 ? completedInCategory / progresses.length : 0;

    const analysis: StrengthWeakness = {
      category,
      strengthScore: completionRate,
      moduleCount: progresses.length,
      topSkills: [`${category} Fundamentals`, `${category} Problem Solving`],
      areasForImprovement: [`Advanced ${category}`, `${category} Optimization`]
    };

    if (completionRate > 0.7) {
      strengths.push(analysis);
    } else if (completionRate < 0.5) {
      weaknesses.push(analysis);
    }
  });

  // Sort by strength/weakness score
  strengths.sort((a, b) => b.strengthScore - a.strengthScore);
  weaknesses.sort((a, b) => a.strengthScore - b.strengthScore);

  // Generate recommendations
  const recommendations = generatePerformanceRecommendations(
    successRate,
    engagementScore,
    strengths,
    weaknesses
  );

  const overallPerformance = Math.round(
    successRate * 0.4 + engagementScore * 100 * 0.3 + consistencyScore * 100 * 0.3
  );

  const insights: PerformanceInsights = {
    overallPerformance,
    trends,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    recommendations,
    generatedAt: new Date().toISOString()
  };

  // Save to history
  history.push({
    timestamp: new Date().toISOString(),
    successRate,
    velocity: weeklyVelocity,
    engagementScore,
    overallPerformance
  });

  localStorage.setItem(analyticsKey, JSON.stringify(history.slice(-90))); // Keep last 90 days

  return insights;
};

/**
 * Predict churn risk for user
 */
export const predictChurnRisk = (
  userId: string,
  currentProgress: ModuleProgress[],
  roadmap: PersonalizedRoadmap
): ChurnRiskAssessment => {
  const analyticsKey = `${ANALYTICS_KEY}${userId}`;
  const stored = localStorage.getItem(analyticsKey);
  const history = stored ? JSON.parse(stored) : [];

  if (history.length === 0) {
    return {
      riskScore: 0.2,
      riskLevel: 'low',
      factors: {
        inactivityDays: 0,
        declineRate: 0,
        incompletionRate: 0.5,
        engagementTrend: 'stable'
      },
      interventions: ['Encourage regular check-ins']
    };
  }

  // Calculate inactivity
  const lastActivity = new Date(history[history.length - 1].timestamp);
  const inactivityDays = Math.floor((Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate decline rate
  const recentData = history.slice(-14); // Last 2 weeks
  const olderData = history.slice(-28, -14);

  const recentAvgEngagement = recentData.length > 0
    ? recentData.reduce((sum: number, h: any) => sum + (h.engagementScore || 0), 0) / recentData.length
    : 0;

  const olderAvgEngagement = olderData.length > 0
    ? olderData.reduce((sum: number, h: any) => sum + (h.engagementScore || 0), 0) / olderData.length
    : 0;

  const declineRate = olderAvgEngagement > 0 ? (recentAvgEngagement - olderAvgEngagement) / olderAvgEngagement : 0;

  // Calculate incompletion rate
  const completedCount = currentProgress.filter(p => p.status === 'done').length;
  const startedCount = currentProgress.filter(p => p.status !== 'pending').length;
  const incompletionRate = startedCount > 0 ? (startedCount - completedCount) / startedCount : 0.3;

  // Determine engagement trend
  let engagementTrend: 'up' | 'stable' | 'down' = 'stable';
  if (declineRate < -0.15) engagementTrend = 'down';
  else if (declineRate > 0.15) engagementTrend = 'up';

  // Calculate risk score (0-1)
  const inactivityFactor = Math.min(1, inactivityDays / 14); // High risk if inactive >2 weeks
  const declineFactor = Math.min(1, Math.max(0, -declineRate * 2)); // Positive decline = lower risk
  const incompletionFactor = incompletionRate;

  const riskScore = (inactivityFactor * 0.5 + declineFactor * 0.3 + incompletionFactor * 0.2);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore > 0.65) riskLevel = 'high';
  else if (riskScore > 0.35) riskLevel = 'medium';

  // Generate interventions
  const interventions: string[] = [];
  if (inactivityDays > 7) interventions.push('Resume learning with a small, achievable goal');
  if (declineFactor < 0.4) interventions.push('Adjust difficulty to match current capacity');
  if (incompletionFactor > 0.5) interventions.push('Try completing one module before starting another');
  if (riskLevel === 'high') interventions.push('Schedule a check-in with a mentor or peer');

  // Predict churn date
  let predictedChurnDate: string | undefined;
  if (riskLevel === 'high') {
    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() + 14); // 2 weeks
    predictedChurnDate = churnDate.toISOString().split('T')[0];
  }

  return {
    riskScore,
    riskLevel,
    factors: {
      inactivityDays,
      declineRate,
      incompletionRate,
      engagementTrend
    },
    interventions,
    predictedChurnDate
  };
};

/**
 * Suggest focus areas for improvement
 */
export const suggestFocusAreas = (userId: string, insights: PerformanceInsights): FocusArea[] => {
  const focusAreas: FocusArea[] = [];

  insights.weaknesses.forEach(weakness => {
    const potentialGain = 1.0 - weakness.strengthScore; // How much room for improvement
    const focusArea: FocusArea = {
      category: weakness.category,
      currentScore: weakness.strengthScore,
      potentialGain,
      recommendedTimeAllocation: potentialGain * 100 * 0.5, // Up to 50% effort
      estimatedImpact: `Improving ${weakness.category} could boost overall performance by ${(potentialGain * 20).toFixed(0)}%`
    };
    focusAreas.push(focusArea);
  });

  // Sort by potential gain
  focusAreas.sort((a, b) => b.potentialGain - a.potentialGain);

  return focusAreas.slice(0, 3);
};

/**
 * Compare user performance with anonymized cohort
 */
export const compareWithCohort = (
  userId: string,
  insights: PerformanceInsights,
  cohortSize: number = 100
): CohortComparison[] => {
  const cohortKey = COHORT_KEY + 'general';
  const stored = localStorage.getItem(cohortKey);

  // Mock cohort data (in production, would be aggregated from real users)
  const cohortMetrics = stored ? JSON.parse(stored) : {
    successRate: [25, 40, 50, 60, 70, 80, 85],
    velocity: [0.3, 0.5, 0.75, 1.0, 1.2, 1.5],
    engagementScore: [0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  };

  // Calculate user's percentiles
  const comparisons: CohortComparison[] = [];

  // Success rate comparison
  const successRatePercentile = calculatePercentile(
    insights.trends[0]?.successRate || 0,
    cohortMetrics.successRate
  );
  comparisons.push({
    userId,
    percentile: successRatePercentile,
    userMetric: insights.trends[0]?.successRate || 0,
    cohortMedian: cohortMetrics.successRate[Math.floor(cohortMetrics.successRate.length / 2)],
    cohortPercentile: {
      25: cohortMetrics.successRate[Math.floor(cohortMetrics.successRate.length * 0.25)],
      50: cohortMetrics.successRate[Math.floor(cohortMetrics.successRate.length * 0.5)],
      75: cohortMetrics.successRate[Math.floor(cohortMetrics.successRate.length * 0.75)]
    },
    category: 'Success Rate'
  });

  // Velocity comparison
  const velocityPercentile = calculatePercentile(
    insights.trends[0]?.velocity || 0,
    cohortMetrics.velocity
  );
  comparisons.push({
    userId,
    percentile: velocityPercentile,
    userMetric: insights.trends[0]?.velocity || 0,
    cohortMedian: cohortMetrics.velocity[Math.floor(cohortMetrics.velocity.length / 2)],
    cohortPercentile: {
      25: cohortMetrics.velocity[Math.floor(cohortMetrics.velocity.length * 0.25)],
      50: cohortMetrics.velocity[Math.floor(cohortMetrics.velocity.length * 0.5)],
      75: cohortMetrics.velocity[Math.floor(cohortMetrics.velocity.length * 0.75)]
    },
    category: 'Learning Velocity'
  });

  // Engagement comparison
  const engagementPercentile = calculatePercentile(
    insights.trends[0]?.engagementScore || 0,
    cohortMetrics.engagementScore
  );
  comparisons.push({
    userId,
    percentile: engagementPercentile,
    userMetric: insights.trends[0]?.engagementScore || 0,
    cohortMedian: cohortMetrics.engagementScore[Math.floor(cohortMetrics.engagementScore.length / 2)],
    cohortPercentile: {
      25: cohortMetrics.engagementScore[Math.floor(cohortMetrics.engagementScore.length * 0.25)],
      50: cohortMetrics.engagementScore[Math.floor(cohortMetrics.engagementScore.length * 0.5)],
      75: cohortMetrics.engagementScore[Math.floor(cohortMetrics.engagementScore.length * 0.75)]
    },
    category: 'Engagement'
  });

  // Update cohort data
  if (stored) {
    cohortMetrics.successRate.push(insights.trends[0]?.successRate || 0);
    cohortMetrics.velocity.push(insights.trends[0]?.velocity || 0);
    cohortMetrics.engagementScore.push(insights.trends[0]?.engagementScore || 0);

    // Keep sorted
    cohortMetrics.successRate.sort((a: number, b: number) => a - b);
    cohortMetrics.velocity.sort((a: number, b: number) => a - b);
    cohortMetrics.engagementScore.sort((a: number, b: number) => a - b);

    localStorage.setItem(cohortKey, JSON.stringify(cohortMetrics));
  }

  return comparisons;
};

/**
 * Helper: Calculate percentile
 */
const calculatePercentile = (value: number, sortedArray: number[]): number => {
  if (sortedArray.length === 0) return 50;
  const count = sortedArray.filter(v => v <= value).length;
  return Math.round((count / sortedArray.length) * 100);
};

/**
 * Generate personalized performance recommendations
 */
const generatePerformanceRecommendations = (
  successRate: number,
  engagementScore: number,
  strengths: StrengthWeakness[],
  weaknesses: StrengthWeakness[]
): string[] => {
  const recommendations: string[] = [];

  if (successRate > 80) {
    recommendations.push('Excellent progress! Maintain this momentum and consider tackling harder projects.');
  } else if (successRate > 60) {
    recommendations.push('Good progress. Focus on completing started modules before starting new ones.');
  } else {
    recommendations.push('Consider adjusting difficulty or seeking additional help on challenging topics.');
  }

  if (engagementScore > 0.8) {
    recommendations.push('Excellent consistency. Your regular engagement is key to your success!');
  } else if (engagementScore < 0.5) {
    recommendations.push('Try to establish a regular study schedule. Even 30 minutes daily is better than sporadic sessions.');
  }

  if (strengths.length > 0) {
    recommendations.push(`Leverage your strength in ${strengths[0].category} to help others and deepen your understanding.`);
  }

  if (weaknesses.length > 0) {
    recommendations.push(`Allocate focused time to ${weaknesses[0].category}. Break it into smaller chunks if needed.`);
  }

  return recommendations;
};
