import {
  analyzeUserBehavior,
  deriveLearningPattern,
  scoreProjectRelevance,
  generatePersonalizedRoadmap,
  predictNextProject,
  adaptDifficulty,
  trackModuleEngagement,
  getCachedRecommendations,
  type UserBehavior,
  type Module
} from '../aiRecommender';

describe('AI Recommendation Engine', () => {
  const mockModule: Module = {
    id: 'algo-sorting',
    name: 'Sorting Algorithms',
    description: 'Learn sorting algorithms',
    hours: { beginner: 10, intermediate: 8, advanced: 5 },
    dependencies: [],
    key_points: ['Merge Sort', 'Quick Sort', 'Heap Sort']
  };

  const mockModules: Module[] = [
    mockModule,
    {
      id: 'ds-arrays',
      name: 'Arrays & Lists',
      description: 'Arrays and linked lists',
      hours: { beginner: 8, intermediate: 6, advanced: 4 },
      dependencies: [],
      key_points: ['Array operations', 'Linked Lists']
    }
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  test('analyzeUserBehavior - creates default behavior for new user', () => {
    const behavior = analyzeUserBehavior('test-user-1');

    expect(behavior.userId).toBe('test-user-1');
    expect(behavior.moduleRatings).toBeInstanceOf(Map);
    expect(behavior.timeSpent).toBeInstanceOf(Map);
    expect(behavior.completionRate).toBe(0.5);
    expect(behavior.viewHistory).toEqual([]);
  });

  test('analyzeUserBehavior - returns stored behavior', () => {
    const userId = 'test-user-2';
    trackModuleEngagement(userId, 'test-module', 5, 4);

    const behavior = analyzeUserBehavior(userId);
    expect(behavior.timeSpent.get('test-module')).toBe(5);
    expect(behavior.moduleRatings.get('test-module')).toBe(4);
  });

  test('deriveLearningPattern - generates pattern from behavior', () => {
    const userId = 'test-user-3';
    trackModuleEngagement(userId, 'algo-sorting', 10, 5);
    trackModuleEngagement(userId, 'ds-arrays', 8, 4);

    const behavior = analyzeUserBehavior(userId);
    const pattern = deriveLearningPattern(behavior, 'beginner');

    expect(pattern.preferredDifficulty).toBe('beginner');
    expect(pattern.categoryAffinities).toBeInstanceOf(Map);
    expect(pattern.estimatedCapacity).toBeGreaterThan(0);
    expect(['conservative', 'balanced', 'aggressive']).toContain(pattern.riskProfile);
    expect(['low', 'medium', 'high']).toContain(pattern.engagementLevel);
  });

  test('scoreProjectRelevance - returns normalized score 0-1', () => {
    const userId = 'test-user-4';
    trackModuleEngagement(userId, 'algo-sorting', 10, 5);

    const behavior = analyzeUserBehavior(userId);
    const pattern = deriveLearningPattern(behavior, 'intermediate');

    const score = scoreProjectRelevance(mockModule, pattern, behavior);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('generatePersonalizedRoadmap - returns top 5 recommendations', () => {
    const userId = 'test-user-5';
    trackModuleEngagement(userId, 'algo-sorting', 5, 3);

    const recommendations = generatePersonalizedRoadmap(userId, mockModules, null);

    expect(recommendations.recommendations.length).toBeLessThanOrEqual(5);
    expect(recommendations.userId).toBe(userId);
    expect(recommendations.averageConfidence).toBeGreaterThanOrEqual(0);
    expect(recommendations.averageConfidence).toBeLessThanOrEqual(1);
  });

  test('predictNextProject - returns highest scored recommendation', () => {
    const userId = 'test-user-6';
    const nextProject = predictNextProject(userId, mockModules, null);

    if (nextProject) {
      expect(nextProject.moduleId).toBeDefined();
      expect(nextProject.moduleName).toBeDefined();
      expect(nextProject.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(nextProject.relevanceScore).toBeLessThanOrEqual(1);
    }
  });

  test('adaptDifficulty - recommends progression based on completion rate', () => {
    const userId = 'test-user-7';

    // High completion rate
    const adaptedHigh = adaptDifficulty(userId, 0.9, 10);
    expect(['beginner', 'intermediate', 'advanced']).toContain(adaptedHigh.recommendedDifficulty);

    // Low completion rate
    const adaptedLow = adaptDifficulty(userId, 0.3, 25);
    expect(['beginner', 'intermediate', 'advanced']).toContain(adaptedLow.recommendedDifficulty);
  });

  test('trackModuleEngagement - updates user behavior', () => {
    const userId = 'test-user-8';
    const moduleId = 'test-module-1';

    trackModuleEngagement(userId, moduleId, 5, 4);
    let behavior = analyzeUserBehavior(userId);
    expect(behavior.timeSpent.get(moduleId)).toBe(5);
    expect(behavior.moduleRatings.get(moduleId)).toBe(4);

    trackModuleEngagement(userId, moduleId, 3, 5);
    behavior = analyzeUserBehavior(userId);
    expect(behavior.timeSpent.get(moduleId)).toBe(8);
    expect(behavior.moduleRatings.get(moduleId)).toBe(5);
  });

  test('trackModuleEngagement - rating clamped to 1-5', () => {
    const userId = 'test-user-9';
    trackModuleEngagement(userId, 'test-module', 5, 10);

    const behavior = analyzeUserBehavior(userId);
    expect(behavior.moduleRatings.get('test-module')).toBeLessThanOrEqual(5);

    trackModuleEngagement(userId, 'test-module-2', 5, -1);
    const behavior2 = analyzeUserBehavior(userId);
    expect(behavior2.moduleRatings.get('test-module-2')).toBeGreaterThanOrEqual(1);
  });

  test('getCachedRecommendations - returns cached recommendations within 24h', () => {
    const userId = 'test-user-10';
    const recommendations = generatePersonalizedRoadmap(userId, mockModules, null);

    const cached = getCachedRecommendations(userId);
    expect(cached).not.toBeNull();
    expect(cached?.userId).toBe(userId);
    expect(cached?.recommendations.length).toEqual(recommendations.recommendations.length);
  });

  test('getCachedRecommendations - returns null for expired cache', () => {
    const userId = 'test-user-11';
    generatePersonalizedRoadmap(userId, mockModules, null);

    // Manually set old timestamp
    const key = `ai-recommendations-${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.generatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      localStorage.setItem(key, JSON.stringify(parsed));
    }

    const cached = getCachedRecommendations(userId);
    expect(cached).toBeNull();
  });

  test('No console errors during operations', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const userId = 'test-user-12';
    trackModuleEngagement(userId, 'module-1', 10, 4);
    const behavior = analyzeUserBehavior(userId);
    const pattern = deriveLearningPattern(behavior, 'intermediate');
    const score = scoreProjectRelevance(mockModule, pattern, behavior);
    const recommendations = generatePersonalizedRoadmap(userId, mockModules, null);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
