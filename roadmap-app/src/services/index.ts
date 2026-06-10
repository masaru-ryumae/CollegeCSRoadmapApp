// AI Recommendation Engine exports
export {
  analyzeUserBehavior,
  deriveLearningPattern,
  scoreProjectRelevance,
  generatePersonalizedRoadmap,
  predictNextProject,
  adaptDifficulty,
  trackModuleEngagement,
  getCachedRecommendations,
  type UserBehavior,
  type LearningPattern,
  type ProjectRecommendation,
  type RecommendationSet,
  type AdaptiveSettings
} from './aiRecommender';

// Adaptive Learning Algorithm exports
export {
  calculateOptimalDifficulty,
  suggestPrerequisites,
  estimateTimeToCompletion,
  trackLearningVelocity,
  recordLearningActivity,
  calculateCompletionMetrics,
  suggestOptimalNextSteps,
  type LearningVelocity,
  type DifficultyProgression,
  type PrerequisiteAnalysis,
  type TimeEstimate,
  type CompletionMetrics
} from './adaptiveAlgorithm';

// Smart Mentoring System exports
export {
  generateHints,
  analyzeCode,
  suggestDebugSteps,
  explainConcept,
  getMentorConversation,
  addMentorMessage,
  generateMentorResponse,
  clearMentorConversation,
  type ConceptExplanation,
  type HintProgression,
  type CodeFeedback,
  type CodeIssue,
  type DebugGuidance,
  type MentorConversation,
  type ChatMessage
} from './mentorAI';

// Performance Analytics exports
export {
  analyzePerformanceTrends,
  predictChurnRisk,
  suggestFocusAreas,
  compareWithCohort,
  type PerformanceTrend,
  type StrengthWeakness,
  type PerformanceInsights,
  type ChurnRiskAssessment,
  type CohortComparison,
  type FocusArea
} from './performanceML';
