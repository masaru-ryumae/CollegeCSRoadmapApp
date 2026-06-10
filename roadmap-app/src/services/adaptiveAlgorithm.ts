import type { Module, ScheduledModule, PersonalizedRoadmap, TechLevel, ModuleProgress } from '../types';

export interface LearningVelocity {
  modulesPerWeek: number;
  hoursPerWeek: number;
  estimatedCompletionTime: number; // in weeks
  trend: 'accelerating' | 'stable' | 'decelerating';
}

export interface DifficultyProgression {
  current: TechLevel;
  recommended: TechLevel;
  progressionPath: TechLevel[];
  shouldProgress: boolean;
  readinessScore: number; // 0-1
}

export interface PrerequisiteAnalysis {
  moduleId: string;
  prerequisites: Module[];
  missingPrerequisites: Module[];
  readyToStart: boolean;
  readinessScore: number;
}

export interface TimeEstimate {
  moduleId: string;
  estimatedHours: number;
  baselineHours: number;
  adjustmentFactor: number; // 0.5 to 2.0
  confidence: number; // 0-1
  estimatedWeeks: number;
}

export interface CompletionMetrics {
  overallProgress: number; // 0-100
  velocity: LearningVelocity;
  estimatedCompletionDate: string;
  daysRemaining: number;
  isOnTrack: boolean;
  riskFactors: string[];
}

const ANALYTICS_KEY = 'adaptive-analytics-';
const VELOCITY_KEY = 'learning-velocity-';

/**
 * Calculate optimal difficulty progression for user
 */
export const calculateOptimalDifficulty = (
  userId: string,
  currentPerformance: number, // 0-1
  completionRate: number, // 0-1
  currentDifficulty: TechLevel
): DifficultyProgression => {
  const progressionPath: TechLevel[] = ['beginner', 'intermediate', 'advanced'];
  const currentIndex = progressionPath.indexOf(currentDifficulty);

  // Calculate readiness score based on performance and completion
  const readinessScore = (currentPerformance * 0.6 + completionRate * 0.4);

  let shouldProgress = false;
  let recommended = currentDifficulty;

  // Progression rules
  if (readinessScore > 0.85 && currentIndex < 2) {
    shouldProgress = true;
    recommended = progressionPath[currentIndex + 1];
  } else if (readinessScore < 0.6 && currentIndex > 0) {
    shouldProgress = true;
    recommended = progressionPath[currentIndex - 1];
  } else if (readinessScore > 0.75 && currentIndex < 2) {
    // Progressive step for excellent performance
    shouldProgress = true;
    recommended = progressionPath[Math.min(currentIndex + 1, 2)];
  }

  // Save progression data
  const analytics = {
    timestamp: new Date().toISOString(),
    readinessScore,
    currentDifficulty,
    recommended,
    shouldProgress
  };

  const existing = localStorage.getItem(ANALYTICS_KEY + userId);
  const history = existing ? JSON.parse(existing) : [];
  history.push(analytics);
  localStorage.setItem(ANALYTICS_KEY + userId, JSON.stringify(history.slice(-100))); // Keep last 100

  return {
    current: currentDifficulty,
    recommended,
    progressionPath,
    shouldProgress,
    readinessScore
  };
};

/**
 * Suggest prerequisites for a module
 */
export const suggestPrerequisites = (
  module: Module,
  userBehavior: { completedModules: Set<string> },
  allModules: Module[]
): PrerequisiteAnalysis => {
  const prerequisites: Module[] = [];
  const missingPrerequisites: Module[] = [];

  for (const depId of module.dependencies) {
    const depModule = allModules.find(m => m.id === depId);
    if (depModule) {
      prerequisites.push(depModule);
      if (!userBehavior.completedModules.has(depId)) {
        missingPrerequisites.push(depModule);
      }
    }
  }

  const readyToStart = missingPrerequisites.length === 0;
  const readinessScore = prerequisites.length === 0
    ? 1.0
    : (prerequisites.length - missingPrerequisites.length) / prerequisites.length;

  return {
    moduleId: module.id,
    prerequisites,
    missingPrerequisites,
    readyToStart,
    readinessScore
  };
};

/**
 * Estimate time to completion using ML-based model
 */
export const estimateTimeToCompletion = (
  module: Module,
  userId: string,
  userDifficulty: TechLevel,
  historicalData?: { averageHours: number; variance: number }
): TimeEstimate => {
  const baselineHours = module.hours[userDifficulty];

  // Get user's learning velocity
  const velocity = trackLearningVelocity(userId);

  // Adjustment factor based on:
  // 1. Category familiarity (stored in behavior)
  // 2. Recent learning velocity trend
  // 3. Module complexity relative to user's history
  const categoryBonus = 0.05; // 5% faster per category familiarity
  const trendFactor = velocity.trend === 'accelerating' ? 0.9 :
                     velocity.trend === 'decelerating' ? 1.1 : 1.0;

  let adjustmentFactor = trendFactor;
  if (historicalData) {
    // If module is easier than average: faster
    if (baselineHours < historicalData.averageHours) {
      adjustmentFactor *= 0.85;
    }
    // If module is harder than average: slower
    else if (baselineHours > historicalData.averageHours * 1.2) {
      adjustmentFactor *= 1.2;
    }
  }

  adjustmentFactor = Math.max(0.5, Math.min(2.0, adjustmentFactor));

  const estimatedHours = baselineHours * adjustmentFactor;
  const estimatedWeeks = Math.ceil(estimatedHours / velocity.hoursPerWeek);

  // Confidence decreases with more adjustment
  const confidence = Math.max(0.6, 1.0 - Math.abs(adjustmentFactor - 1.0) * 0.15);

  return {
    moduleId: module.id,
    estimatedHours,
    baselineHours,
    adjustmentFactor,
    confidence,
    estimatedWeeks
  };
};

/**
 * Track and calculate user's learning velocity
 */
export const trackLearningVelocity = (userId: string): LearningVelocity => {
  const stored = localStorage.getItem(VELOCITY_KEY + userId);
  const history = stored ? JSON.parse(stored) : [];

  if (history.length === 0) {
    return {
      modulesPerWeek: 0.5,
      hoursPerWeek: 10,
      estimatedCompletionTime: 20,
      trend: 'stable'
    };
  }

  // Calculate recent velocity (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentEntries = history.filter((e: any) => new Date(e.timestamp).getTime() > thirtyDaysAgo);

  if (recentEntries.length === 0) {
    return {
      modulesPerWeek: 0.5,
      hoursPerWeek: 10,
      estimatedCompletionTime: 20,
      trend: 'stable'
    };
  }

  const totalHours = recentEntries.reduce((sum: number, e: any) => sum + (e.hoursSpent || 0), 0);
  const daysOfActivity = (Date.now() - new Date(recentEntries[0].timestamp).getTime()) / (24 * 60 * 60 * 1000);
  const weeksOfActivity = Math.max(1, daysOfActivity / 7);

  const hoursPerWeek = totalHours / weeksOfActivity;
  const modulesPerWeek = recentEntries.length / weeksOfActivity;

  // Calculate trend
  const midpoint = Math.floor(recentEntries.length / 2);
  const firstHalf = recentEntries.slice(0, midpoint);
  const secondHalf = recentEntries.slice(midpoint);

  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum: number, e: any) => sum + (e.hoursSpent || 0), 0) / firstHalf.length
    : hoursPerWeek;

  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum: number, e: any) => sum + (e.hoursSpent || 0), 0) / secondHalf.length
    : hoursPerWeek;

  let trend: 'accelerating' | 'stable' | 'decelerating' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.15) trend = 'accelerating';
  else if (secondHalfAvg < firstHalfAvg * 0.85) trend = 'decelerating';

  const estimatedCompletionTime = hoursPerWeek > 0 ? 100 / hoursPerWeek : 20; // Assume 100 hours total

  return {
    modulesPerWeek: Math.max(0, modulesPerWeek),
    hoursPerWeek: Math.max(1, hoursPerWeek),
    estimatedCompletionTime,
    trend
  };
};

/**
 * Record learning activity
 */
export const recordLearningActivity = (
  userId: string,
  moduleId: string,
  hoursSpent: number
): void => {
  const stored = localStorage.getItem(VELOCITY_KEY + userId);
  const history = stored ? JSON.parse(stored) : [];

  history.push({
    moduleId,
    hoursSpent,
    timestamp: new Date().toISOString()
  });

  // Keep last 365 days of data
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const filtered = history.filter((e: any) => new Date(e.timestamp).getTime() > yearAgo);

  localStorage.setItem(VELOCITY_KEY + userId, JSON.stringify(filtered));
};

/**
 * Calculate comprehensive completion metrics
 */
export const calculateCompletionMetrics = (
  userId: string,
  roadmap: PersonalizedRoadmap,
  currentProgress: ModuleProgress[]
): CompletionMetrics => {
  const velocity = trackLearningVelocity(userId);

  // Calculate overall progress
  const completedModules = currentProgress.filter(m => m.status === 'done').length;
  const totalModules = roadmap.modules.length;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Calculate remaining time
  const completedHours = currentProgress
    .filter(m => m.status === 'done')
    .reduce((sum, m) => sum + (roadmap.modules.find(mod => mod.id === m.moduleId)?.assignedHours || 0), 0);

  const remainingHours = roadmap.totalHours - completedHours;
  const estimatedWeeksRemaining = remainingHours > 0 ? Math.ceil(remainingHours / velocity.hoursPerWeek) : 0;

  const deadlineDate = new Date(roadmap.deadline);
  const daysRemaining = Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  // Determine if on track
  const weeksPerProgressPoint = daysRemaining / 7 / (100 - overallProgress || 1);
  const velocity_weeksPer10Percent = 10 / (velocity.hoursPerWeek / (remainingHours / 10));
  const isOnTrack = weeksPerProgressPoint >= velocity_weeksPer10Percent * 0.9;

  // Identify risk factors
  const riskFactors: string[] = [];
  if (velocity.trend === 'decelerating') riskFactors.push('Learning velocity is declining');
  if (!isOnTrack) riskFactors.push('Behind schedule');
  if (overallProgress < 25 && daysRemaining < 30) riskFactors.push('Less than 30 days with <25% progress');
  if (velocity.hoursPerWeek < 5) riskFactors.push('Very low weekly commitment');

  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedWeeksRemaining * 7);

  return {
    overallProgress: Math.round(overallProgress),
    velocity,
    estimatedCompletionDate: estimatedCompletionDate.toISOString().split('T')[0],
    daysRemaining,
    isOnTrack,
    riskFactors
  };
};

/**
 * Suggest optimal next modules based on current progress
 */
export const suggestOptimalNextSteps = (
  userId: string,
  roadmap: PersonalizedRoadmap,
  currentProgress: ModuleProgress[],
  allModules: Module[]
): string[] => {
  const completedModuleIds = new Set(currentProgress.filter(m => m.status === 'done').map(m => m.moduleId));

  // Find modules ready to start
  const readyModules = roadmap.modules.filter(mod => {
    // Not already done
    if (completedModuleIds.has(mod.id)) return false;
    // All dependencies complete
    return mod.dependencies.every(depId => completedModuleIds.has(depId));
  });

  // Sort by criticality and estimated time
  return readyModules
    .sort((a, b) => {
      // Prioritize modules with more dependents
      const aDependents = roadmap.modules.filter(m => m.dependencies.includes(a.id)).length;
      const bDependents = roadmap.modules.filter(m => m.dependencies.includes(b.id)).length;
      if (aDependents !== bDependents) return bDependents - aDependents;

      // Then by start week
      return a.startWeek - b.startWeek;
    })
    .slice(0, 3)
    .map(m => m.id);
};
