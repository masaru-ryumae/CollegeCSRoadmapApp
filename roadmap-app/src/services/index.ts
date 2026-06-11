// Analytics Services Index

// Chart Engine
export {
  generateXPProgressionChart,
  generateProjectsByCategoryChart,
  generateSkillDistributionChart,
  generateActivityHeatmapChart,
  generateProgressTimelineChart,
  renderChart,
  createChartConfig,
  exportChartAsPNG,
  analyzeTrend,
  compareCharts,
  type ChartData,
  type ChartDataset,
} from './chartEngine';

// Report Generator
export {
  generateWeeklyDigest,
  generateMonthlySummary,
  generateSkillProficiency,
  generateLearningSpeedMetrics,
  generateAchievementTimeline,
  exportReportAsPDF,
  exportReportAsCSV,
  exportReportAsJSON,
  generateCompleteReport,
} from './reportGenerator';

// Insight Engine
export {
  identifyPatterns,
  suggestImprovements,
  predictProductivity,
  analyzePerformance,
  detectAnomalies,
  calculatePerformanceScore,
} from './insightEngine';
