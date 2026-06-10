import type {
  PersonalizedRoadmap,
  ReportConfig,
  AnalyticsMetrics,
  ScheduledReport,
} from '../types';
import { calculateMetrics } from './analyticsEngine';

interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  metrics: AnalyticsMetrics | null;
  summary: string;
  charts?: Record<string, unknown>;
}

/**
 * Generate a report in the specified format
 */
export function generateReport(
  roadmap: PersonalizedRoadmap,
  config: ReportConfig
): ReportData {
  const metrics = calculateMetrics(roadmap, 'month');

  const title =
    config.template === 'weekly'
      ? 'Weekly Progress Report'
      : config.template === 'monthly'
        ? 'Monthly Progress Report'
        : config.template === 'annual'
          ? 'Annual Review Report'
          : 'Custom Report';

  const period = `${config.startDate} to ${config.endDate}`;

  const summary = generateSummary(roadmap, metrics, config);

  return {
    title,
    period,
    generatedAt: new Date().toISOString(),
    metrics: config.metrics.includes('projects') ||
      config.metrics.includes('time') ||
      config.metrics.includes('performance') ||
      config.metrics.includes('gamification')
      ? metrics
      : null,
    summary,
  };
}

/**
 * Generate a text summary of the report
 */
function generateSummary(
  roadmap: PersonalizedRoadmap,
  metrics: AnalyticsMetrics,
  config: ReportConfig
): string {
  const parts: string[] = [];

  if (config.metrics.includes('projects')) {
    parts.push(
      `Projects: ${metrics.projects.totalCompleted} completed out of ${metrics.projects.totalProjects} total (${metrics.projects.completionRate}% complete)`
    );
  }

  if (config.metrics.includes('time')) {
    parts.push(
      `Time Tracking: ${metrics.time.thisMonth} hours logged this month, averaging ${metrics.time.averageHoursPerDay} hours per day`
    );
  }

  if (config.metrics.includes('performance')) {
    parts.push(
      `Performance: ${metrics.performance.successRate}% success rate with an average project completion time of ${metrics.performance.averageCompletionTime} days`
    );
  }

  if (config.metrics.includes('gamification')) {
    parts.push(
      `Gamification: ${metrics.gamification.totalXP} total XP earned, currently level ${metrics.gamification.currentLevel} with a ${metrics.gamification.streakCount}-day streak`
    );
  }

  return parts.join('\n');
}

/**
 * Format report data as PDF (simplified - actual PDF generation would use a library)
 */
export function formatReportAsPDF(data: ReportData): string {
  const lines = [
    '='.repeat(50),
    data.title,
    '='.repeat(50),
    '',
    `Period: ${data.period}`,
    `Generated: ${new Date(data.generatedAt).toLocaleDateString()}`,
    '',
    data.summary,
    '',
    '='.repeat(50),
  ];

  return lines.join('\n');
}

/**
 * Format report data as CSV
 */
export function formatReportAsCSV(data: ReportData): string {
  const rows: string[] = [];

  // Header
  rows.push('CS Internship Roadmap Report');
  rows.push(`Report Title,${data.title}`);
  rows.push(`Period,${data.period}`);
  rows.push(`Generated,${new Date(data.generatedAt).toLocaleDateString()}`);
  rows.push('');

  // Metrics
  if (data.metrics) {
    rows.push('Projects Metrics');
    rows.push(`Total Completed,${data.metrics.projects.totalCompleted}`);
    rows.push(`In Progress,${data.metrics.projects.inProgress}`);
    rows.push(`Total Projects,${data.metrics.projects.totalProjects}`);
    rows.push(`Completion Rate,${data.metrics.projects.completionRate}%`);
    rows.push(`Average Completion Time,${data.metrics.projects.averageCompletionTime} days`);
    rows.push('');

    rows.push('Time Metrics');
    rows.push(`This Month,${data.metrics.time.thisMonth} hours`);
    rows.push(`Average Per Day,${data.metrics.time.averageHoursPerDay} hours`);
    rows.push('');

    rows.push('Performance Metrics');
    rows.push(`Success Rate,${data.metrics.performance.successRate}%`);
    rows.push(
      `Average Completion Time,${data.metrics.performance.averageCompletionTime} days`
    );
    rows.push('');

    rows.push('Gamification Metrics');
    rows.push(`Total XP,${data.metrics.gamification.totalXP}`);
    rows.push(`Current Level,${data.metrics.gamification.currentLevel}`);
    rows.push(`Badges Earned,${data.metrics.gamification.badgesEarned}`);
    rows.push(`Current Streak,${data.metrics.gamification.streakCount}`);
  }

  return rows.join('\n');
}

/**
 * Format report data as JSON
 */
export function formatReportAsJSON(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format report data as PNG (simplified - actual PNG generation would use canvas)
 */
export function formatReportAsPNG(data: ReportData): string {
  return `[PNG Image]\n${data.title}\n${data.period}`;
}

/**
 * Schedule email reports
 */
export function scheduleEmailReport(
  config: ReportConfig,
  emailTo: string,
  frequency: 'weekly' | 'monthly' | 'never' = 'never'
): ScheduledReport {
  const report: ScheduledReport = {
    id: `report-${Date.now()}`,
    config,
    frequency,
    emailTo,
    lastRun: undefined,
  };

  // Set next run based on frequency
  if (frequency !== 'never') {
    const now = new Date();
    const nextRun = new Date(now);

    if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }

    report.nextRun = nextRun.toISOString();
  }

  // Store in localStorage
  const reports = getScheduledReports();
  reports.push(report);
  localStorage.setItem('scheduled-reports', JSON.stringify(reports));

  return report;
}

/**
 * Get all scheduled reports
 */
export function getScheduledReports(): ScheduledReport[] {
  try {
    const stored = localStorage.getItem('scheduled-reports');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Cancel a scheduled report
 */
export function cancelScheduledReport(reportId: string): void {
  const reports = getScheduledReports().filter((r) => r.id !== reportId);
  localStorage.setItem('scheduled-reports', JSON.stringify(reports));
}

/**
 * Execute report generation with the specified format
 */
export function executeReportGeneration(
  roadmap: PersonalizedRoadmap,
  config: ReportConfig
): { data: ReportData; formatted: string } {
  const reportData = generateReport(roadmap, config);

  let formatted: string;
  switch (config.format) {
    case 'pdf':
      formatted = formatReportAsPDF(reportData);
      break;
    case 'csv':
      formatted = formatReportAsCSV(reportData);
      break;
    case 'json':
      formatted = formatReportAsJSON(reportData);
      break;
    case 'png':
      formatted = formatReportAsPNG(reportData);
      break;
    default:
      formatted = formatReportAsJSON(reportData);
  }

  return { data: reportData, formatted };
}

/**
 * Download report to file
 */
export function downloadReport(
  data: ReportData,
  formatted: string,
  format: 'pdf' | 'csv' | 'json' | 'png',
  filename?: string
): void {
  const name = filename || `roadmap-report-${Date.now()}`;
  const element = document.createElement('a');
  const fileExtension = format === 'png' ? 'txt' : format;

  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(formatted)}`);
  element.setAttribute('download', `${name}.${fileExtension}`);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Share report via email (simplified - actual implementation would need backend)
 */
export function shareReportViaEmail(
  data: ReportData,
  formatted: string,
  recipientEmail: string,
  senderEmail?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate email sending
    console.log('Sending report to:', recipientEmail);
    console.log('Content:', formatted);

    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

/**
 * Generate insights summary for report
 */
export function generateReportInsights(
  roadmap: PersonalizedRoadmap,
  metrics: AnalyticsMetrics
): string[] {
  const insights: string[] = [];

  if (metrics.projects.completionRate > 75) {
    insights.push(
      `Outstanding progress! You're ${metrics.projects.completionRate}% complete.`
    );
  } else if (metrics.projects.completionRate > 50) {
    insights.push(`You're making solid progress at ${metrics.projects.completionRate}% completion.`);
  }

  if (metrics.time.averageHoursPerDay > 3) {
    insights.push('You\'re putting in strong daily effort.');
  } else if (metrics.time.averageHoursPerDay < 1) {
    insights.push('Consider increasing your daily study hours.');
  }

  if (metrics.performance.averageCompletionTime > 20) {
    insights.push('Your projects are taking longer than average. Try breaking them into smaller tasks.');
  }

  if (metrics.gamification.streakCount > 7) {
    insights.push(`Excellent! You have a ${metrics.gamification.streakCount}-day streak!`);
  }

  return insights;
}
