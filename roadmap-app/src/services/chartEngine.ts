import { Chart, ChartConfiguration, registerables } from 'chart.js';
import type { PersonalizedRoadmap, AnalyticsMetrics } from '../types';
import { calculateMetrics, getPerformanceMetrics } from '../utils/analyticsEngine';

// Register Chart.js components
Chart.register(...registerables);

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Generate XP progression line chart data
 */
export function generateXPProgressionChart(roadmap: PersonalizedRoadmap): ChartData {
  const modules = roadmap.modules.slice(0, 10);
  const xpPerModule = 100;

  const labels = modules.map((_, i) => `Module ${i + 1}`);
  const data: number[] = [];
  let cumulativeXP = 0;

  modules.forEach(() => {
    cumulativeXP += xpPerModule;
    data.push(cumulativeXP);
  });

  return {
    labels,
    datasets: [
      {
        label: 'Total XP Over Time',
        data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

/**
 * Generate projects by category bar chart data
 */
export function generateProjectsByCategoryChart(roadmap: PersonalizedRoadmap): ChartData {
  const metrics = getPerformanceMetrics(roadmap);
  const categoryPerformance = metrics.categoryPerformance || {};

  const labels = Object.keys(categoryPerformance);
  const data = Object.values(categoryPerformance);

  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Projects Completed',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
      },
    ],
  };
}

/**
 * Generate skill distribution pie chart data
 */
export function generateSkillDistributionChart(roadmap: PersonalizedRoadmap): ChartData {
  const metrics = getPerformanceMetrics(roadmap);
  const categoryPerformance = metrics.categoryPerformance || {};
  const categories = Object.keys(categoryPerformance);

  if (categories.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Skill Distribution',
        data: [100],
        backgroundColor: ['#d1d5db'],
        borderColor: ['#9ca3af'],
      }],
    };
  }

  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ];

  return {
    labels: categories,
    datasets: [
      {
        label: 'Projects by Skill',
        data: categories.map(cat => categoryPerformance[cat] || 0),
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors.slice(0, categories.length),
      },
    ],
  };
}

/**
 * Generate activity heatmap data (by day of week)
 */
export function generateActivityHeatmapChart(roadmap: PersonalizedRoadmap): ChartData {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Mock activity data - in real scenario would come from actual logged hours
  const activityByDay = [
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 8),
  ];

  return {
    labels: daysOfWeek,
    datasets: [
      {
        label: 'Hours Logged',
        data: activityByDay,
        backgroundColor: activityByDay.map(val => {
          if (val === 0) return '#ef5350';
          if (val < 3) return '#ffa726';
          if (val < 6) return '#ffeb3b';
          return '#66bb6a';
        }),
        borderColor: '#999',
      },
    ],
  };
}

/**
 * Generate progress timeline chart
 */
export function generateProgressTimelineChart(roadmap: PersonalizedRoadmap): ChartData {
  const weeks = Math.min(12, roadmap.weeklySchedule.length);
  const weekLabels = Array.from({ length: weeks }, (_, i) => `Week ${i + 1}`);

  // Calculate cumulative completion per week
  const completionData: number[] = [];
  let cumulativeCompleted = 0;
  const completionPerWeek = 100 / weeks;

  for (let i = 0; i < weeks; i++) {
    cumulativeCompleted = Math.min(100, (i + 1) * completionPerWeek);
    completionData.push(cumulativeCompleted);
  }

  return {
    labels: weekLabels,
    datasets: [
      {
        label: 'Planned Progress',
        data: completionData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Actual Progress',
        data: completionData.map(val => val * 0.95), // Slightly below planned
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

/**
 * Render a chart to canvas
 */
export function renderChart(
  canvas: HTMLCanvasElement,
  config: ChartConfiguration,
): Chart {
  return new Chart(canvas, config);
}

/**
 * Create Chart.js configuration for any dataset
 */
export function createChartConfig(
  chartData: ChartData,
  type: 'line' | 'bar' | 'pie' | 'doughnut',
  title: string,
): ChartConfiguration {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb';

  const baseConfig: ChartConfiguration = {
    type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: textColor,
            font: { size: 12 },
          },
        },
        title: {
          display: true,
          text: title,
          color: textColor,
          font: { size: 14, weight: 'bold' },
        },
      },
    },
  };

  if (type === 'line') {
    return {
      ...baseConfig,
      options: {
        ...baseConfig.options,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
        },
      },
    };
  }

  if (type === 'bar') {
    return {
      ...baseConfig,
      options: {
        ...baseConfig.options,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
        },
      },
    };
  }

  return baseConfig;
}

/**
 * Export chart as PNG image
 */
export async function exportChartAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'chart.png'
): Promise<void> {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

/**
 * Generate simple trend analysis from chart data
 */
export function analyzeTrend(data: number[]): {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  changePercent: number;
} {
  if (data.length < 2) {
    return { direction: 'stable', strength: 'weak', changePercent: 0 };
  }

  const start = data[0];
  const end = data[data.length - 1];
  const changePercent = ((end - start) / Math.max(1, start)) * 100;

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let strength: 'weak' | 'moderate' | 'strong' = 'weak';

  if (Math.abs(changePercent) < 5) {
    direction = 'stable';
  } else if (changePercent > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }

  const absChange = Math.abs(changePercent);
  if (absChange < 10) {
    strength = 'weak';
  } else if (absChange < 25) {
    strength = 'moderate';
  } else {
    strength = 'strong';
  }

  return { direction, strength, changePercent: Math.round(changePercent) };
}

/**
 * Compare two datasets and return insight
 */
export function compareCharts(
  baseline: number[],
  current: number[],
): {
  improved: boolean;
  changePercent: number;
  message: string;
} {
  const baselineAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length || 1;
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length || 1;
  const changePercent = ((currentAvg - baselineAvg) / baselineAvg) * 100;
  const improved = changePercent > 0;

  let message = '';
  if (Math.abs(changePercent) < 5) {
    message = 'Performance is stable';
  } else if (improved) {
    message = `Performance improved by ${Math.round(changePercent)}%`;
  } else {
    message = `Performance decreased by ${Math.round(Math.abs(changePercent))}%`;
  }

  return { improved, changePercent: Math.round(changePercent), message };
}
