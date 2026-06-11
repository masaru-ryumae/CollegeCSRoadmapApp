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

// Chart Engine exports
export {
  default as chartEngine,
  type ChartDataPoint,
  type LineChartConfig,
  type BarChartConfig,
  type PieChartConfig,
  type RadarChartConfig,
  type HeatmapData
} from './chartEngine';

// Report Generator exports
export {
  default as reportGenerator,
  type ReportMetrics,
  type MonthlyReportData,
  type SkillReport,
  type LearningSpeedAnalysis
} from './reportGenerator';

// Insights Engine exports
export {
  default as insightEngine,
  type UserMetrics,
  type Insight,
  type TrendData
} from './insightEngine';
