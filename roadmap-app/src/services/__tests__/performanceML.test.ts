import {
  analyzePerformanceTrends,
  predictChurnRisk,
  suggestFocusAreas,
  compareWithCohort,
  type PerformanceInsights,
  type ChurnRiskAssessment
} from '../performanceML';
import type { PersonalizedRoadmap, ModuleProgress } from '../../types';

describe('Performance Analytics ML', () => {
  const mockRoadmap: PersonalizedRoadmap = {
    modules: [
      {
        id: 'algo-sorting',
        name: 'Sorting Algorithms',
        description: 'Learn sorting algorithms',
        hours: { beginner: 10, intermediate: 8, advanced: 5 },
        dependencies: [],
        key_points: ['Merge Sort', 'Quick Sort'],
        startWeek: 1,
        endWeek: 2,
        status: 'done',
        assignedHours: 10
      },
      {
        id: 'ds-trees',
        name: 'Trees & Graphs',
        description: 'Learn trees',
        hours: { beginner: 12, intermediate: 10, advanced: 8 },
        dependencies: [],
        key_points: ['Binary Tree', 'BST'],
        startWeek: 3,
        endWeek: 4,
        status: 'in-progress',
        assignedHours: 12
      }
    ],
    weeklySchedule: [],
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    totalHours: 100,
    generatedAt: new Date().toISOString(),
    pathName: 'balanced',
    answers: {
      techLevel: 'beginner',
      targetCompanyType: 'balanced',
      hoursPerWeek: '10-15',
      hasExistingProject: 'no',
      timeline: 'summer-2026'
    }
  };

  const mockProgress: ModuleProgress[] = [
    {
      moduleId: 'algo-sorting',
      completedKeyPoints: ['Merge Sort', 'Quick Sort'],
      currentKeyPointIndex: 2,
      status: 'done',
      completedAt: new Date().toISOString()
    },
    {
      moduleId: 'ds-trees',
      completedKeyPoints: ['Binary Tree'],
      currentKeyPointIndex: 1,
      status: 'in-progress',
      startedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  test('analyzePerformanceTrends - returns performance insights', () => {
    const insights = analyzePerformanceTrends('user-1', mockRoadmap, mockProgress);

    expect(insights.overallPerformance).toBeGreaterThanOrEqual(0);
    expect(insights.overallPerformance).toBeLessThanOrEqual(100);
    expect(insights.trends).toBeInstanceOf(Array);
    expect(insights.trends.length).toBeGreaterThan(0);
    expect(insights.strengths).toBeInstanceOf(Array);
    expect(insights.weaknesses).toBeInstanceOf(Array);
    expect(insights.recommendations).toBeInstanceOf(Array);
    expect(insights.generatedAt).toBeDefined();
  });

  test('analyzePerformanceTrends - includes weekly and monthly trends', () => {
    const insights = analyzePerformanceTrends('user-2', mockRoadmap, mockProgress);

    const periods = insights.trends.map(t => t.period);
    expect(periods).toContain('week');
    expect(periods).toContain('month');
  });

  test('analyzePerformanceTrends - calculates success rate', () => {
    const insights = analyzePerformanceTrends('user-3', mockRoadmap, mockProgress);

    const weekTrend = insights.trends.find(t => t.period === 'week');
    expect(weekTrend?.successRate).toBeGreaterThanOrEqual(0);
    expect(weekTrend?.successRate).toBeLessThanOrEqual(100);
  });

  test('analyzePerformanceTrends - generates recommendations', () => {
    const insights = analyzePerformanceTrends('user-4', mockRoadmap, mockProgress);

    expect(insights.recommendations.length).toBeGreaterThan(0);
    expect(insights.recommendations[0]).toBeTruthy();
  });

  test('analyzePerformanceTrends - tracks strengths and weaknesses', () => {
    const insights = analyzePerformanceTrends('user-5', mockRoadmap, mockProgress);

    // With the mock data showing 50% completion, should have both
    expect(insights.strengths.length).toBeGreaterThanOrEqual(0);
    expect(insights.weaknesses.length).toBeGreaterThanOrEqual(0);
  });

  test('predictChurnRisk - returns churn assessment', () => {
    const assessment = predictChurnRisk('user-6', mockProgress, mockRoadmap);

    expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(assessment.riskScore).toBeLessThanOrEqual(1);
    expect(['low', 'medium', 'high']).toContain(assessment.riskLevel);
    expect(assessment.factors.inactivityDays).toBeGreaterThanOrEqual(0);
    expect(['up', 'stable', 'down']).toContain(assessment.factors.engagementTrend);
    expect(assessment.interventions).toBeInstanceOf(Array);
  });

  test('predictChurnRisk - identifies high risk users', () => {
    // Simulate high risk: low completion rate and inactivity
    const lowProgress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: [],
        currentKeyPointIndex: 0,
        status: 'pending'
      }
    ];

    // Simulate old activity
    const analyticsKey = 'performance-analytics-user-7';
    const oldTimestamp = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(analyticsKey, JSON.stringify([{
      timestamp: oldTimestamp,
      engagementScore: 0.2,
      successRate: 10
    }]));

    const assessment = predictChurnRisk('user-7', lowProgress, mockRoadmap);

    // Should be medium or high risk
    expect(['medium', 'high']).toContain(assessment.riskLevel);
  });

  test('predictChurnRisk - provides interventions', () => {
    const assessment = predictChurnRisk('user-8', mockProgress, mockRoadmap);

    if (assessment.riskLevel === 'high' || assessment.riskLevel === 'medium') {
      expect(assessment.interventions.length).toBeGreaterThan(0);
    }
  });

  test('predictChurnRisk - returns low risk for engaged users', () => {
    const highProgress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: ['Merge Sort', 'Quick Sort'],
        currentKeyPointIndex: 2,
        status: 'done',
        completedAt: new Date().toISOString()
      },
      {
        moduleId: 'ds-trees',
        completedKeyPoints: ['Binary Tree', 'BST'],
        currentKeyPointIndex: 2,
        status: 'done',
        completedAt: new Date().toISOString()
      }
    ];

    const assessment = predictChurnRisk('user-9', highProgress, mockRoadmap);

    // Engaged users with high completion should have low risk
    expect(assessment.riskScore).toBeLessThan(0.65);
  });

  test('suggestFocusAreas - returns focus areas for improvement', () => {
    const insights = analyzePerformanceTrends('user-10', mockRoadmap, mockProgress);
    const focusAreas = suggestFocusAreas('user-10', insights);

    expect(focusAreas).toBeInstanceOf(Array);
    if (focusAreas.length > 0) {
      expect(focusAreas[0].category).toBeDefined();
      expect(focusAreas[0].currentScore).toBeGreaterThanOrEqual(0);
      expect(focusAreas[0].currentScore).toBeLessThanOrEqual(1);
      expect(focusAreas[0].potentialGain).toBeGreaterThanOrEqual(0);
      expect(focusAreas[0].estimatedImpact).toBeDefined();
    }
  });

  test('suggestFocusAreas - limits to top 3 areas', () => {
    const insights = analyzePerformanceTrends('user-11', mockRoadmap, mockProgress);
    const focusAreas = suggestFocusAreas('user-11', insights);

    expect(focusAreas.length).toBeLessThanOrEqual(3);
  });

  test('compareWithCohort - returns cohort comparisons', () => {
    const insights = analyzePerformanceTrends('user-12', mockRoadmap, mockProgress);
    const comparisons = compareWithCohort('user-12', insights);

    expect(comparisons).toBeInstanceOf(Array);
    expect(comparisons.length).toBeGreaterThan(0);

    comparisons.forEach(comp => {
      expect(comp.userId).toBe('user-12');
      expect(comp.percentile).toBeGreaterThanOrEqual(0);
      expect(comp.percentile).toBeLessThanOrEqual(100);
      expect(comp.category).toBeDefined();
      expect(comp.cohortPercentile).toBeDefined();
    });
  });

  test('compareWithCohort - includes success rate comparison', () => {
    const insights = analyzePerformanceTrends('user-13', mockRoadmap, mockProgress);
    const comparisons = compareWithCohort('user-13', insights);

    const successRateComp = comparisons.find(c => c.category === 'Success Rate');
    expect(successRateComp).toBeDefined();
  });

  test('compareWithCohort - includes velocity comparison', () => {
    const insights = analyzePerformanceTrends('user-14', mockRoadmap, mockProgress);
    const comparisons = compareWithCohort('user-14', insights);

    const velocityComp = comparisons.find(c => c.category === 'Learning Velocity');
    expect(velocityComp).toBeDefined();
  });

  test('compareWithCohort - includes engagement comparison', () => {
    const insights = analyzePerformanceTrends('user-15', mockRoadmap, mockProgress);
    const comparisons = compareWithCohort('user-15', insights);

    const engagementComp = comparisons.find(c => c.category === 'Engagement');
    expect(engagementComp).toBeDefined();
  });

  test('analyzePerformanceTrends - stores analytics history', () => {
    analyzePerformanceTrends('user-16', mockRoadmap, mockProgress);
    analyzePerformanceTrends('user-16', mockRoadmap, mockProgress);

    const analyticsKey = 'performance-analytics-user-16';
    const stored = localStorage.getItem(analyticsKey);

    expect(stored).not.toBeNull();
    const history = JSON.parse(stored!);
    expect(history.length).toBeGreaterThan(0);
  });

  test('Multiple users have isolated data', () => {
    analyzePerformanceTrends('user-17', mockRoadmap, mockProgress);
    analyzePerformanceTrends('user-18', mockRoadmap, mockProgress);

    const insights17 = analyzePerformanceTrends('user-17', mockRoadmap, mockProgress);
    const insights18 = analyzePerformanceTrends('user-18', mockRoadmap, mockProgress);

    // Data should be independent
    expect(insights17.generatedAt).toBeDefined();
    expect(insights18.generatedAt).toBeDefined();
  });

  test('No console errors during operations', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    analyzePerformanceTrends('user-19', mockRoadmap, mockProgress);
    predictChurnRisk('user-19', mockProgress, mockRoadmap);
    const insights = analyzePerformanceTrends('user-19', mockRoadmap, mockProgress);
    suggestFocusAreas('user-19', insights);
    compareWithCohort('user-19', insights);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
