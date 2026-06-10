import type { Module, ScheduledModule, PersonalizedRoadmap, TechLevel } from '../types';

// User behavior and profile types
export interface UserBehavior {
  userId: string;
  moduleRatings: Map<string, number>; // module ID to rating (1-5)
  timeSpent: Map<string, number>; // module ID to hours spent
  completionRate: number; // percentage of started modules completed
  preferredCategories: string[];
  learningVelocity: number; // hours per week average
  lastActivityDate: string;
  viewHistory: string[]; // module IDs viewed
}

export interface LearningPattern {
  preferredDifficulty: TechLevel;
  categoryAffinities: Map<string, number>; // category to affinity score (0-1)
  estimatedCapacity: number; // hours per week they can handle
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface ProjectRecommendation {
  moduleId: string;
  moduleName: string;
  relevanceScore: number; // 0-1
  confidenceScore: number; // 0-1
  reasoning: string;
  estimatedHours: number;
  skillsGained: string[];
  difficulty: TechLevel;
}

export interface RecommendationSet {
  recommendations: ProjectRecommendation[];
  generatedAt: string;
  userId: string;
  averageConfidence: number;
}

export interface AdaptiveSettings {
  currentDifficulty: TechLevel;
  recommendedDifficulty: TechLevel;
  shouldAdjust: boolean;
  reason: string;
}

// Local storage keys
const BEHAVIOR_KEY = 'ai-user-behavior-';
const RECOMMENDATION_KEY = 'ai-recommendations-';
const ANALYTICS_KEY = 'ai-analytics-';

/**
 * Analyze user behavior from activity history
 */
export const analyzeUserBehavior = (userId: string): UserBehavior => {
  const stored = localStorage.getItem(BEHAVIOR_KEY + userId);
  let behavior: Partial<UserBehavior> = stored ? JSON.parse(stored) : {};

  // Convert Maps back from JSON if needed
  const moduleRatings = new Map(
    behavior.moduleRatings instanceof Map
      ? behavior.moduleRatings.entries()
      : Object.entries(behavior.moduleRatings || {}).map(([k, v]) => [k, v as number])
  );

  const timeSpent = new Map(
    behavior.timeSpent instanceof Map
      ? behavior.timeSpent.entries()
      : Object.entries(behavior.timeSpent || {}).map(([k, v]) => [k, v as number])
  );

  return {
    userId,
    moduleRatings,
    timeSpent,
    completionRate: behavior.completionRate || 0.5,
    preferredCategories: behavior.preferredCategories || [],
    learningVelocity: behavior.learningVelocity || 10,
    lastActivityDate: behavior.lastActivityDate || new Date().toISOString(),
    viewHistory: behavior.viewHistory || []
  };
};

/**
 * Derive learning patterns from user behavior
 */
export const deriveLearningPattern = (behavior: UserBehavior, currentDifficulty: TechLevel): LearningPattern => {
  // Calculate category affinities based on ratings
  const categoryAffinities = new Map<string, number>();
  const categoryCount = new Map<string, number>();

  behavior.moduleRatings.forEach((rating, moduleId) => {
    // In real scenario, modules would have category metadata
    const category = moduleId.split('-')[0] || 'general';
    const currentScore = categoryAffinities.get(category) || 0;
    const count = (categoryCount.get(category) || 0) + 1;
    categoryAffinities.set(category, (currentScore + rating / 5) / count);
    categoryCount.set(category, count);
  });

  // Estimate capacity based on completion rate and time spent
  const estimatedCapacity = behavior.learningVelocity * (0.8 + behavior.completionRate * 0.2);

  // Determine risk profile based on completion rate
  let riskProfile: 'conservative' | 'balanced' | 'aggressive' = 'balanced';
  if (behavior.completionRate > 0.8) riskProfile = 'aggressive';
  else if (behavior.completionRate < 0.5) riskProfile = 'conservative';

  // Determine engagement level
  let engagementLevel: 'low' | 'medium' | 'high' = 'medium';
  const daysSinceActivity = (Date.now() - new Date(behavior.lastActivityDate).getTime()) / (24 * 60 * 60 * 1000);
  if (daysSinceActivity < 2) engagementLevel = 'high';
  else if (daysSinceActivity > 14) engagementLevel = 'low';

  return {
    preferredDifficulty: currentDifficulty,
    categoryAffinities,
    estimatedCapacity,
    riskProfile,
    engagementLevel
  };
};

/**
 * Score project relevance based on user profile
 */
export const scoreProjectRelevance = (
  module: Module,
  userProfile: LearningPattern,
  behavior: UserBehavior
): number => {
  let score = 0;

  // Category affinity score (30%)
  const category = module.id.split('-')[0] || 'general';
  const categoryScore = userProfile.categoryAffinities.get(category) || 0.5;
  score += categoryScore * 0.3;

  // Difficulty match (25%)
  const targetDifficulty = userProfile.preferredDifficulty;
  const difficultyMatch = targetDifficulty === 'beginner' ? 0.9 :
                          targetDifficulty === 'intermediate' ? 1.0 : 0.85;
  score += difficultyMatch * 0.25;

  // Relevance to career goals (20%)
  const careerRelevance = userProfile.riskProfile === 'conservative' ? 0.7 :
                         userProfile.riskProfile === 'balanced' ? 0.85 : 1.0;
  score += careerRelevance * 0.2;

  // Dependency chain completion (15%)
  const dependenciesCompleted = module.dependencies.length === 0 ? 1.0 :
                               module.dependencies.every(dep => !behavior.moduleRatings.has(dep)) ? 0.4 : 0.8;
  score += dependenciesCompleted * 0.15;

  // Engagement bonus (10%)
  const engagementBonus = userProfile.engagementLevel === 'high' ? 1.0 :
                         userProfile.engagementLevel === 'medium' ? 0.7 : 0.4;
  score += engagementBonus * 0.1;

  return Math.min(1, Math.max(0, score));
};

/**
 * Generate personalized recommendations for user
 */
export const generatePersonalizedRoadmap = (
  userId: string,
  availableModules: Module[],
  roadmap: PersonalizedRoadmap | null
): RecommendationSet => {
  const behavior = analyzeUserBehavior(userId);
  const currentDifficulty = roadmap?.answers.techLevel || 'beginner';
  const pattern = deriveLearningPattern(behavior, currentDifficulty);

  // Filter modules not yet rated
  const unratedModules = availableModules.filter(m => !behavior.moduleRatings.has(m.id));

  // Score and sort
  const recommendations = unratedModules
    .map(module => {
      const relevanceScore = scoreProjectRelevance(module, pattern, behavior);
      const confidenceScore = Math.min(0.95, relevanceScore + (Math.random() * 0.1 - 0.05));

      return {
        moduleId: module.id,
        moduleName: module.name,
        relevanceScore,
        confidenceScore,
        reasoning: generateReasoningText(module, pattern, behavior),
        estimatedHours: module.hours[currentDifficulty],
        skillsGained: module.key_points || [],
        difficulty: currentDifficulty
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5); // Top 5 recommendations

  const averageConfidence = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.confidenceScore, 0) / recommendations.length
    : 0;

  const result: RecommendationSet = {
    recommendations,
    generatedAt: new Date().toISOString(),
    userId,
    averageConfidence
  };

  // Cache recommendations
  localStorage.setItem(RECOMMENDATION_KEY + userId, JSON.stringify(result));

  return result;
};

/**
 * Predict next project based on learning patterns
 */
export const predictNextProject = (
  userId: string,
  availableModules: Module[],
  roadmap: PersonalizedRoadmap | null
): ProjectRecommendation | null => {
  const recommendations = generatePersonalizedRoadmap(userId, availableModules, roadmap);
  return recommendations.recommendations.length > 0 ? recommendations.recommendations[0] : null;
};

/**
 * Adapt difficulty based on user performance
 */
export const adaptDifficulty = (
  userId: string,
  recentCompletionRate: number,
  averageTimePerModule: number
): AdaptiveSettings => {
  const behavior = analyzeUserBehavior(userId);
  const currentDifficulty = behavior.completionRate > 0.85
    ? 'advanced'
    : behavior.completionRate > 0.6
    ? 'intermediate'
    : 'beginner';

  // Calculate recommended difficulty based on recent performance
  let recommendedDifficulty: TechLevel = 'intermediate';
  let shouldAdjust = false;
  let reason = '';

  if (recentCompletionRate > 0.85 && averageTimePerModule < 15) {
    recommendedDifficulty = 'advanced';
    shouldAdjust = currentDifficulty !== 'advanced';
    reason = 'Excellent completion rate and efficiency. Ready for advanced challenges.';
  } else if (recentCompletionRate > 0.65 && averageTimePerModule < 20) {
    recommendedDifficulty = 'intermediate';
    shouldAdjust = currentDifficulty !== 'intermediate';
    reason = 'Good progress on intermediate modules. Maintain current difficulty.';
  } else if (recentCompletionRate < 0.5) {
    recommendedDifficulty = 'beginner';
    shouldAdjust = currentDifficulty !== 'beginner';
    reason = 'Lower completion rate detected. Stepping back to beginner modules.';
  }

  return {
    currentDifficulty,
    recommendedDifficulty,
    shouldAdjust,
    reason
  };
};

/**
 * Track module engagement and update behavior data
 */
export const trackModuleEngagement = (
  userId: string,
  moduleId: string,
  hoursSpent: number,
  rating: number
): void => {
  const behavior = analyzeUserBehavior(userId);

  // Update time spent
  const currentTime = behavior.timeSpent.get(moduleId) || 0;
  behavior.timeSpent.set(moduleId, currentTime + hoursSpent);

  // Update rating
  behavior.moduleRatings.set(moduleId, Math.max(1, Math.min(5, rating)));

  // Update activity date
  behavior.lastActivityDate = new Date().toISOString();

  // Track view
  if (!behavior.viewHistory.includes(moduleId)) {
    behavior.viewHistory.push(moduleId);
  }

  // Save back to localStorage
  const toSave = {
    ...behavior,
    moduleRatings: Object.fromEntries(behavior.moduleRatings),
    timeSpent: Object.fromEntries(behavior.timeSpent)
  };
  localStorage.setItem(BEHAVIOR_KEY + userId, JSON.stringify(toSave));
};

/**
 * Generate human-readable reasoning for recommendations
 */
const generateReasoningText = (
  module: Module,
  pattern: LearningPattern,
  behavior: UserBehavior
): string => {
  const category = module.id.split('-')[0] || 'general';
  const categoryScore = pattern.categoryAffinities.get(category) || 0.5;

  if (categoryScore > 0.7) {
    return `You've shown strong interest in ${category} modules with an average rating of ${(categoryScore * 5).toFixed(1)}/5. This project aligns well with your learning style.`;
  } else if (behavior.completionRate > 0.8) {
    return `Based on your high completion rate, you're ready for ${module.name}. This will expand your ${category} expertise.`;
  } else if (pattern.engagementLevel === 'high') {
    return `Recent activity shows consistent engagement. This ${category} module will complement your recent progress.`;
  } else {
    return `This module is well-suited to your skill level and learning pace.`;
  }
};

/**
 * Get cached recommendations for user
 */
export const getCachedRecommendations = (userId: string): RecommendationSet | null => {
  const cached = localStorage.getItem(RECOMMENDATION_KEY + userId);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  // Invalidate cache after 24 hours
  const generatedTime = new Date(parsed.generatedAt).getTime();
  const now = Date.now();
  if (now - generatedTime > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(RECOMMENDATION_KEY + userId);
    return null;
  }

  return parsed;
};

export interface Module {
  id: string;
  name: string;
  description: string;
  hours: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  dependencies: string[];
  key_points: string[];
}
