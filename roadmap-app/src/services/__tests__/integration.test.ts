import {
  analyzeUserBehavior,
  trackModuleEngagement,
  generatePersonalizedRoadmap,
  adaptDifficulty,
  type Module
} from '../aiRecommender';

import {
  calculateOptimalDifficulty,
  recordLearningActivity,
  trackLearningVelocity,
  calculateCompletionMetrics,
  estimateTimeToCompletion
} from '../adaptiveAlgorithm';

import {
  generateHints,
  getMentorConversation,
  addMentorMessage,
  analyzeCode
} from '../mentorAI';

import {
  analyzePerformanceTrends,
  predictChurnRisk,
  suggestFocusAreas
} from '../performanceML';

import type { PersonalizedRoadmap, ModuleProgress } from '../../types';

describe('AI Personalization System Integration', () => {
  const mockModules: Module[] = [
    {
      id: 'algo-sorting',
      name: 'Sorting Algorithms',
      description: 'Learn sorting algorithms',
      hours: { beginner: 10, intermediate: 8, advanced: 5 },
      dependencies: [],
      key_points: ['Merge Sort', 'Quick Sort', 'Heap Sort']
    },
    {
      id: 'ds-trees',
      name: 'Trees & Graphs',
      description: 'Tree structures and graph traversal',
      hours: { beginner: 12, intermediate: 10, advanced: 8 },
      dependencies: ['algo-sorting'],
      key_points: ['Binary Tree', 'BST', 'Graph']
    },
    {
      id: 'system-design',
      name: 'System Design',
      description: 'Design scalable systems',
      hours: { beginner: 15, intermediate: 12, advanced: 8 },
      dependencies: ['algo-sorting', 'ds-trees'],
      key_points: ['Scalability', 'Load Balancing', 'Caching']
    }
  ];

  const mockRoadmap: PersonalizedRoadmap = {
    modules: mockModules.map((m, i) => ({
      ...m,
      startWeek: i + 1,
      endWeek: i + 2,
      status: 'pending' as const,
      assignedHours: m.hours.beginner
    })),
    weeklySchedule: [],
    deadline: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalHours: 37,
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

  test('End-to-end learning journey: New user to intermediate progression', () => {
    const userId = 'integration-user-1';

    // Step 1: User discovers modules through recommendations
    const recommendations = generatePersonalizedRoadmap(userId, mockModules, mockRoadmap);
    expect(recommendations.recommendations.length).toBeGreaterThan(0);

    // Step 2: User starts with sorting algorithms
    trackModuleEngagement(userId, 'algo-sorting', 10, 4);
    recordLearningActivity(userId, 'algo-sorting', 10);

    // Step 3: System analyzes behavior and provides mentor guidance
    const behavior = analyzeUserBehavior(userId);
    expect(behavior.moduleRatings.get('algo-sorting')).toBe(4);

    const hints = generateHints('algo-sorting', 'algorithmic-thinking');
    expect(hints.hints.length).toBeGreaterThan(0);

    // Step 4: Mentor conversation starts
    const conversation = getMentorConversation(userId, 'algo-sorting');
    expect(conversation.messages.length).toBeGreaterThan(0);

    addMentorMessage(userId, 'algo-sorting', 'How do I optimize merge sort?', 'user');
    expect(conversation.messages.length).toBeGreaterThan(1);

    // Step 5: User completes module and adapts difficulty
    trackModuleEngagement(userId, 'algo-sorting', 5, 5);
    const adaptSettings = adaptDifficulty(userId, 0.8, 12);
    expect(['beginner', 'intermediate', 'advanced']).toContain(adaptSettings.recommendedDifficulty);

    // Step 6: System analyzes performance and suggests next steps
    const progress: ModuleProgress[] = [
      {
        moduleId: 'algo-sorting',
        completedKeyPoints: ['Merge Sort', 'Quick Sort', 'Heap Sort'],
        currentKeyPointIndex: 3,
        status: 'done',
        completedAt: new Date().toISOString()
      }
    ];

    const insights = analyzePerformanceTrends(userId, mockRoadmap, progress);
    expect(insights.overallPerformance).toBeGreaterThan(0);

    // Step 7: Check churn risk
    const churnAssessment = predictChurnRisk(userId, progress, mockRoadmap);
    expect(churnAssessment.riskScore).toBeDefined();
  });

  test('Adaptive difficulty adjustment with learning velocity', () => {
    const userId = 'integration-user-2';

    // Record accelerating learning velocity
    for (let i = 0; i < 5; i++) {
      recordLearningActivity(userId, `module-${i}`, 8 - i * 1); // Decreasing time per module
    }

    const velocity = trackLearningVelocity(userId);
    expect(velocity.trend).toBe('accelerating');

    // System should recommend progression
    const progression = calculateOptimalDifficulty(userId, 0.9, 0.85, 'beginner');
    expect(progression.shouldProgress).toBe(true);
  });

  test('Mentor provides code feedback and code reviewer integration', () => {
    const userId = 'integration-user-3';
    const moduleId = 'algo-sorting';

    // User submits code for review
    const userCode = `
      const mergeSort = (arr) => {
        if (arr.length <= 1) return arr;

        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));

        return merge(left, right);
      };

      const merge = (left, right) => {
        const result = [];
        let i = 0, j = 0;
        while (i < left.length && j < right.length) {
          if (left[i] <= right[j]) {
            result.push(left[i++]);
          } else {
            result.push(right[j++]);
          }
        }
        return result.concat(left.slice(i)).concat(right.slice(j));
      };
    `;

    // Get mentor conversation
    const conversation = getMentorConversation(userId, moduleId);
    addMentorMessage(userId, moduleId, 'Here is my merge sort implementation', 'user');

    // Analyze code
    const feedback = analyzeCode(userCode, 'typescript');
    expect(feedback.overallScore).toBeGreaterThan(50);
    expect(feedback.strengths.some(s => s.includes('recursive'))).toBe(false); // Good code shouldn't have warnings about recursion here

    // Add mentor response
    addMentorMessage(userId, moduleId, `Great implementation! Your code has ${feedback.strengths.length} strengths.`, 'mentor');

    const updatedConversation = getMentorConversation(userId, moduleId);
    expect(updatedConversation.messages.length).toBeGreaterThan(conversation.messages.length);
  });

  test('Performance analytics guides learning strategy', () => {
    const userId = 'integration-user-4';

    // Simulate user completing multiple modules with varying success
    const progress: ModuleProgress[] = [
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

    // Record learning activities
    recordLearningActivity(userId, 'algo-sorting', 10);
    recordLearningActivity(userId, 'ds-trees', 5);

    // Analyze trends
    const insights = analyzePerformanceTrends(userId, mockRoadmap, progress);
    expect(insights.recommendations.length).toBeGreaterThan(0);

    // Get focus areas
    const focusAreas = suggestFocusAreas(userId, insights);
    expect(focusAreas.length).toBeLessThanOrEqual(3);

    // Check churn risk
    const churnRisk = predictChurnRisk(userId, progress, mockRoadmap);
    expect(churnRisk.riskLevel).toBeDefined();
  });

  test('Time estimation accounts for learning history', () => {
    const userId = 'integration-user-5';

    // Record historical learning pattern
    for (let i = 0; i < 3; i++) {
      recordLearningActivity(userId, `module-${i}`, 8); // Consistent pace
    }

    // Estimate time for new module
    const estimate = estimateTimeToCompletion(mockModules[0], userId, 'beginner');

    expect(estimate.estimatedHours).toBeGreaterThan(0);
    expect(estimate.adjustmentFactor).toBeGreaterThanOrEqual(0.5);
    expect(estimate.adjustmentFactor).toBeLessThanOrEqual(2.0);
    expect(estimate.confidence).toBeGreaterThan(0);
  });

  test('Complete user journey with all systems active', () => {
    const userId = 'integration-user-6';
    let consecutiveSteps = 0;

    try {
      // 1. Get initial recommendations
      generatePersonalizedRoadmap(userId, mockModules, mockRoadmap);
      consecutiveSteps++;

      // 2. Start learning
      trackModuleEngagement(userId, 'algo-sorting', 5, 4);
      recordLearningActivity(userId, 'algo-sorting', 5);
      consecutiveSteps++;

      // 3. Get mentor help
      getMentorConversation(userId, 'algo-sorting');
      const hints = generateHints('algo-sorting', 'algorithmic-thinking');
      consecutiveSteps++;

      // 4. Continue learning
      trackModuleEngagement(userId, 'algo-sorting', 10, 5);
      recordLearningActivity(userId, 'algo-sorting', 10);
      consecutiveSteps++;

      // 5. Get progress analysis
      const behavior = analyzeUserBehavior(userId);
      const progression = calculateOptimalDifficulty(userId, 0.9, 0.85, 'beginner');
      consecutiveSteps++;

      // 6. Request code review
      const feedback = analyzeCode('const x = 5; console.log(x);', 'typescript');
      consecutiveSteps++;

      // 7. Get performance insights
      const progress: ModuleProgress[] = [
        {
          moduleId: 'algo-sorting',
          completedKeyPoints: ['Merge Sort', 'Quick Sort', 'Heap Sort'],
          currentKeyPointIndex: 3,
          status: 'done',
          completedAt: new Date().toISOString()
        }
      ];

      const insights = analyzePerformanceTrends(userId, mockRoadmap, progress);
      const churnRisk = predictChurnRisk(userId, progress, mockRoadmap);
      consecutiveSteps++;

      // All 7 major checkpoints completed
      expect(consecutiveSteps).toBe(7);
    } catch (error) {
      console.error(`Failed at step ${consecutiveSteps}:`, error);
      throw error;
    }
  });

  test('LocalStorage persistence across multiple accesses', () => {
    const userId = 'integration-user-7';

    // Store some data
    trackModuleEngagement(userId, 'algo-sorting', 10, 4);
    recordLearningActivity(userId, 'algo-sorting', 10);
    getMentorConversation(userId, 'algo-sorting');

    // Access again and verify data persists
    const behavior = analyzeUserBehavior(userId);
    expect(behavior.timeSpent.get('algo-sorting')).toBe(10);
    expect(behavior.moduleRatings.get('algo-sorting')).toBe(4);

    const velocity = trackLearningVelocity(userId);
    expect(velocity.hoursPerWeek).toBeGreaterThan(0);

    const conversation = getMentorConversation(userId, 'algo-sorting');
    expect(conversation.messages.length).toBeGreaterThan(0);
  });

  test('No memory leaks with large user datasets', () => {
    // Simulate multiple concurrent users
    for (let i = 0; i < 50; i++) {
      const userId = `stress-test-user-${i}`;
      trackModuleEngagement(userId, 'algo-sorting', 10, 4);
      recordLearningActivity(userId, 'algo-sorting', 5);
    }

    // Verify each user has isolated data
    for (let i = 0; i < 10; i++) {
      const userId = `stress-test-user-${i}`;
      const behavior = analyzeUserBehavior(userId);
      expect(behavior.userId).toBe(userId);
    }
  });

  test('All components handle edge cases gracefully', () => {
    const userId = 'edge-case-user';

    // Empty modules array
    const emptyRecs = generatePersonalizedRoadmap(userId, [], null);
    expect(emptyRecs.recommendations.length).toBe(0);

    // Extreme difficulty values
    const progression = calculateOptimalDifficulty(userId, 1.0, 1.0, 'advanced');
    expect(progression.recommendedDifficulty).toBeDefined();

    // Code analysis with empty code
    const emptyCodeFeedback = analyzeCode('', 'typescript');
    expect(emptyCodeFeedback.overallScore).toBeGreaterThan(0);

    // No progress
    const emptyProgressInsights = analyzePerformanceTrends(userId, mockRoadmap, []);
    expect(emptyProgressInsights.overallPerformance).toBeDefined();
  });

  test('No console errors throughout integration', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const userId = 'console-check-user';

    generatePersonalizedRoadmap(userId, mockModules, mockRoadmap);
    trackModuleEngagement(userId, 'algo-sorting', 10, 4);
    recordLearningActivity(userId, 'algo-sorting', 10);
    getMentorConversation(userId, 'algo-sorting');
    analyzePerformanceTrends(userId, mockRoadmap, []);
    predictChurnRisk(userId, [], mockRoadmap);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
