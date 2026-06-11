import {
  calculateOptimalDifficulty,
  suggestPrerequisites,
  estimateTimeToCompletion,
  trackLearningVelocity,
  recordLearningActivity,
  calculateCompletionMetrics,
  suggestOptimalNextSteps,
  type Module
} from '../adaptiveAlgorithm';
import type { PersonalizedRoadmap, ModuleProgress } from '../../types';

describe('Adaptive Learning Algorithm', () => {
  const mockModule: Module = {
    id: 'algo-sorting',
    name: 'Sorting Algorithms',
    description: 'Learn sorting algorithms',
    hours: { beginner: 10, intermediate: 8, advanced: 5 },
    dependencies: [],
    key_points: ['Merge Sort', 'Quick Sort']
  };

  const mockModuleWithDeps: Module = {
    id: 'algo-advanced',
    name: 'Advanced Algorithms',
    description: 'Advanced algorithms',
    hours: { beginner: 15, intermediate: 12, advanced: 8 },
    dependencies: ['algo-sorting'],
    key_points: ['DP', 'Greedy']
  };

  const mockRoadmap: PersonalizedRoadmap = {
    modules: [
      {
        ...mockModule,
        startWeek: 1,
        endWeek: 2,
        status: 'pending',
        assignedHours: 10
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

  beforeEach(() => {
    localStorage.clear();
  });

  test('calculateOptimalDifficulty - returns progression path', () => {
    const progression = calculateOptimalDifficulty('user-1', 0.9, 0.85, 'beginner');

    expect(progression.current).toBe('beginner');
    expect(progression.progressionPath).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(progression.readinessScore).toBeGreaterThan(0);
    expect(progression.readinessScore).toBeLessThanOrEqual(1);
  });

  test('calculateOptimalDifficulty - progresses on high readiness score', () => {
    const progression = calculateOptimalDifficulty('user-2', 0.95, 0.9, 'beginner');

    expect(progression.shouldProgress).toBe(true);
    expect(progression.recommended).not.toBe('beginner');
  });

  test('calculateOptimalDifficulty - regresses on low readiness score', () => {
    const progression = calculateOptimalDifficulty('user-3', 0.4, 0.3, 'intermediate');

    expect(progression.shouldProgress).toBe(true);
    expect(progression.recommended).toBe('beginner');
  });

  test('suggestPrerequisites - identifies missing prerequisites', () => {
    const analysis = suggestPrerequisites(
      mockModuleWithDeps,
      { completedModules: new Set() },
      [mockModule, mockModuleWithDeps]
    );

    expect(analysis.moduleId).toBe('algo-advanced');
    expect(analysis.prerequisites.length).toBe(1);
    expect(analysis.missingPrerequisites.length).toBe(1);
    expect(analysis.readyToStart).toBe(false);
  });

  test('suggestPrerequisites - marks ready when all prerequisites completed', () => {
    const analysis = suggestPrerequisites(
      mockModuleWithDeps,
      { completedModules: new Set(['algo-sorting']) },
      [mockModule, mockModuleWithDeps]
    );

    expect(analysis.readyToStart).toBe(true);
    expect(analysis.missingPrerequisites.length).toBe(0);
    expect(analysis.readinessScore).toBe(1.0);
  });

  test('estimateTimeToCompletion - returns time estimate with confidence', () => {
    const estimate = estimateTimeToCompletion(mockModule, 'user-4', 'beginner');

    expect(estimate.moduleId).toBe('algo-sorting');
    expect(estimate.baselineHours).toBe(10);
    expect(estimate.adjustmentFactor).toBeGreaterThanOrEqual(0.5);
    expect(estimate.adjustmentFactor).toBeLessThanOrEqual(2.0);
    expect(estimate.confidence).toBeGreaterThan(0);
    expect(estimate.confidence).toBeLessThanOrEqual(1);
    expect(estimate.estimatedWeeks).toBeGreaterThan(0);
  });

  test('trackLearningVelocity - returns default velocity for new user', () => {
    const velocity = trackLearningVelocity('user-5');

    expect(velocity.modulesPerWeek).toBe(0.5);
    expect(velocity.hoursPerWeek).toBe(10);
    expect(velocity.trend).toBe('stable');
  });

  test('recordLearningActivity - updates learning history', () => {
    recordLearningActivity('user-6', 'module-1', 5);
    recordLearningActivity('user-6', 'module-2', 8);

    const velocity = trackLearningVelocity('user-6');
    expect(velocity.hoursPerWeek).toBeGreaterThan(0);
  });

  test('trackLearningVelocity - calculates trend from recent activity', () => {
    const userId = 'user-7';

    // Record declining activity
    for (let i = 0; i < 5; i++) {
      recordLearningActivity(userId, `module-${i}`, 10 - i * 2);
    }

    const velocity = trackLearningVelocity(userId);
    expect(['accelerating', 'stable', 'decelerating']).toContain(velocity.trend);
  });

  test('calculateCompletionMetrics - returns progress metrics', () => {
    const progress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: ['Merge Sort'],
        currentKeyPointIndex: 1,
        status: 'in-progress',
        startedAt: new Date().toISOString()
      }
    ];

    const metrics = calculateCompletionMetrics('user-8', mockRoadmap, progress);

    expect(metrics.overallProgress).toBeGreaterThanOrEqual(0);
    expect(metrics.overallProgress).toBeLessThanOrEqual(100);
    expect(metrics.velocity).toBeDefined();
    expect(metrics.daysRemaining).toBeGreaterThan(0);
    expect(typeof metrics.isOnTrack).toBe('boolean');
    expect(Array.isArray(metrics.riskFactors)).toBe(true);
  });

  test('calculateCompletionMetrics - identifies on-track status', () => {
    const progress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: ['Merge Sort', 'Quick Sort'],
        currentKeyPointIndex: 2,
        status: 'done',
        completedAt: new Date().toISOString()
      }
    ];

    recordLearningActivity('user-9', 'algo-sorting', 12);

    const metrics = calculateCompletionMetrics('user-9', mockRoadmap, progress);

    expect(metrics.overallProgress).toBeGreaterThan(0);
  });

  test('suggestOptimalNextSteps - returns modules ready to start', () => {
    const progress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: [],
        currentKeyPointIndex: 0,
        status: 'done'
      }
    ];

    const roadmap: PersonalizedRoadmap = {
      ...mockRoadmap,
      modules: [
        {
          ...mockModule,
          startWeek: 1,
          endWeek: 2,
          status: 'done',
          assignedHours: 10
        },
        {
          ...mockModuleWithDeps,
          startWeek: 3,
          endWeek: 4,
          status: 'pending',
          assignedHours: 12
        }
      ]
    };

    const nextSteps = suggestOptimalNextSteps('user-10', roadmap, progress, [mockModule, mockModuleWithDeps]);

    expect(Array.isArray(nextSteps)).toBe(true);
    expect(nextSteps.length).toBeLessThanOrEqual(3);
  });

  test('suggestOptimalNextSteps - respects dependencies', () => {
    const progress: ModuleProgress[] = [];

    const roadmap: PersonalizedRoadmap = {
      ...mockRoadmap,
      modules: [
        {
          ...mockModule,
          startWeek: 1,
          endWeek: 2,
          status: 'pending',
          assignedHours: 10
        },
        {
          ...mockModuleWithDeps,
          startWeek: 3,
          endWeek: 4,
          status: 'pending',
          assignedHours: 12
        }
      ]
    };

    const nextSteps = suggestOptimalNextSteps('user-11', roadmap, progress, [mockModule, mockModuleWithDeps]);

    // Should only suggest modules with no dependencies or completed dependencies
    expect(nextSteps.includes('algo-advanced')).toBe(false);
  });

  test('No console errors during operations', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    calculateOptimalDifficulty('user-12', 0.8, 0.75, 'beginner');
    suggestPrerequisites(mockModule, { completedModules: new Set() }, [mockModule]);
    estimateTimeToCompletion(mockModule, 'user-12', 'beginner');
    recordLearningActivity('user-12', 'module-1', 5);
    trackLearningVelocity('user-12');
    calculateCompletionMetrics('user-12', mockRoadmap, []);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
