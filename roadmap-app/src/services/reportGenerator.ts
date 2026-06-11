import jsPDF from 'jspdf';
import type { PersonalizedRoadmap, AnalyticsMetrics, ReportConfig } from '../types';
import { calculateMetrics } from '../utils/analyticsEngine';
import { analyzeTrend } from './chartEngine';

/**
 * Generate weekly digest report
 */
export function generateWeeklyDigest(roadmap: PersonalizedRoadmap): {
  title: string;
  summary: string;
  metrics: Record<string, string | number>;
  highlights: string[];
  recommendations: string[];
} {
  const metrics = calculateMetrics(roadmap, 'week');

  const highlights: string[] = [];
  const recommendations: string[] = [];

  // Generate highlights
  if (metrics.projects.totalCompleted > 0) {
    highlights.push(`Completed ${metrics.projects.totalCompleted} project(s) this week`);
  }

  if (metrics.time.thisWeek > 15) {
    highlights.push(`Logged ${metrics.time.thisWeek} hours of focused work`);
  }

  if (metrics.gamification.streakCount > 3) {
    highlights.push(`${metrics.gamification.streakCount}-day learning streak active`);
  }

  // Generate recommendations
  if (metrics.time.thisWeek < 10) {
    recommendations.push('Try to increase study time to 10+ hours this week');
  }

  if (metrics.projects.completionRate < 50) {
    recommendations.push('Focus on completing one project from your current queue');
  }

  if (metrics.gamification.streakCount === 0) {
    recommendations.push('Start your streak with at least 1 hour of work today');
  }

  return {
    title: 'Weekly Learning Digest',
    summary: `You've made solid progress this week with ${metrics.projects.totalCompleted} projects completed and ${metrics.time.thisWeek} hours logged.`,
    metrics: {
      'Projects Completed': metrics.projects.totalCompleted,
      'Hours Logged': metrics.time.thisWeek.toFixed(1),
      'Completion Rate': `${metrics.projects.completionRate}%`,
      'Current Streak': metrics.gamification.streakCount,
      'XP Earned': metrics.gamification.totalXP,
    },
    highlights,
    recommendations,
  };
}

/**
 * Generate monthly summary report
 */
export function generateMonthlySummary(roadmap: PersonalizedRoadmap): {
  title: string;
  summary: string;
  metrics: Record<string, string | number>;
  skillBreakdown: Record<string, number>;
  insights: string[];
  achievements: string[];
} {
  const metrics = calculateMetrics(roadmap, 'month');

  const achievements: string[] = [];
  const insights: string[] = [];

  // Generate achievements
  if (metrics.projects.completionRate >= 75) {
    achievements.push('Excellent completion rate this month');
  }
  if (metrics.gamification.longestStreak >= 14) {
    achievements.push('Sustained a 2+ week learning streak');
  }
  if (metrics.gamification.badgesEarned > 0) {
    achievements.push(`Earned ${metrics.gamification.badgesEarned} new badges`);
  }

  // Generate insights
  const avgHours = metrics.time.thisMonth / 30;
  insights.push(`Average ${avgHours.toFixed(1)} hours per day this month`);

  if (metrics.performance.averageCompletionTime < 14) {
    insights.push('Projects are being completed quickly - maintaining good momentum');
  } else if (metrics.performance.averageCompletionTime > 20) {
    insights.push('Consider breaking larger projects into smaller milestones');
  }

  return {
    title: 'Monthly Learning Summary',
    summary: `This month you completed ${metrics.projects.totalCompleted} projects and logged ${metrics.time.thisMonth} hours of work. Your completion rate is ${metrics.projects.completionRate}%.`,
    metrics: {
      'Projects Completed': metrics.projects.totalCompleted,
      'Total Hours': metrics.time.thisMonth.toFixed(1),
      'Completion Rate': `${metrics.projects.completionRate}%`,
      'Avg Days per Project': metrics.performance.averageCompletionTime.toFixed(1),
      'Total XP': metrics.gamification.totalXP,
      'Level': metrics.gamification.currentLevel,
    },
    skillBreakdown: metrics.performance.categoryPerformance || {},
    insights,
    achievements,
  };
}

/**
 * Generate skill proficiency breakdown
 */
export function generateSkillProficiency(roadmap: PersonalizedRoadmap): {
  proficiencies: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    projectsCompleted: number;
    hoursLogged: number;
    score: number;
  }>;
  topSkills: string[];
  skillsToImprove: string[];
} {
  const metrics = calculateMetrics(roadmap);
  const categoryPerformance = metrics.performance.categoryPerformance || {};

  const totalProjects = Object.values(categoryPerformance).reduce((a, b) => a + b, 0) || 1;

  const proficiencies = Object.entries(categoryPerformance).map(([skill, projects]) => {
    const percentage = (projects / totalProjects) * 100;
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';

    if (projects >= 5) level = 'intermediate';
    if (projects >= 10) level = 'advanced';

    return {
      skill,
      level,
      projectsCompleted: projects,
      hoursLogged: projects * 5, // Estimate
      score: Math.round(percentage),
    };
  });

  const sorted = proficiencies.sort((a, b) => b.score - a.score);
  const topSkills = sorted.slice(0, 3).map(p => p.skill);
  const skillsToImprove = sorted.slice(-3).map(p => p.skill);

  return {
    proficiencies: sorted,
    topSkills,
    skillsToImprove,
  };
}

/**
 * Generate learning speed metrics
 */
export function generateLearningSpeedMetrics(roadmap: PersonalizedRoadmap): {
  projectsPerWeek: number;
  hoursPerProject: number;
  learningVelocity: 'slow' | 'steady' | 'fast';
  estimatedCompletionDate: string;
  onTrack: boolean;
  message: string;
} {
  const metrics = calculateMetrics(roadmap);

  const projectsPerWeek = metrics.projects.totalCompleted / 4; // Assume 4 weeks/month
  const hoursPerProject = metrics.time.thisMonth / Math.max(1, metrics.projects.totalCompleted);

  let learningVelocity: 'slow' | 'steady' | 'fast' = 'steady';
  if (projectsPerWeek > 2) learningVelocity = 'fast';
  if (projectsPerWeek < 1) learningVelocity = 'slow';

  const remainingProjects = roadmap.modules.length - metrics.projects.totalCompleted;
  const weeksRemaining = Math.ceil(remainingProjects / projectsPerWeek);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + weeksRemaining * 7);

  const deadline = new Date(roadmap.deadline);
  const onTrack = completionDate <= deadline;

  const message = onTrack
    ? `At your current pace, you'll complete by ${completionDate.toLocaleDateString()}`
    : `You need to increase pace by ${Math.round((completionDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))} days`;

  return {
    projectsPerWeek: Math.round(projectsPerWeek * 10) / 10,
    hoursPerProject: Math.round(hoursPerProject * 10) / 10,
    learningVelocity,
    estimatedCompletionDate: completionDate.toLocaleDateString(),
    onTrack,
    message,
  };
}

/**
 * Generate achievement timeline
 */
export function generateAchievementTimeline(roadmap: PersonalizedRoadmap): Array<{
  date: string;
  achievement: string;
  category: string;
  xpEarned: number;
}> {
  const timeline: Array<{
    date: string;
    achievement: string;
    category: string;
    xpEarned: number;
  }> = [];

  const metrics = calculateMetrics(roadmap);

  // Simulate achievement milestones
  const milestones = [
    { projectCount: 5, achievement: 'First 5 Projects', xp: 500 },
    { projectCount: 10, achievement: 'First 10 Projects', xp: 1000 },
    { projectCount: 20, achievement: 'Prolific Learner', xp: 2000 },
  ];

  milestones.forEach(milestone => {
    if (metrics.projects.totalCompleted >= milestone.projectCount) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      timeline.push({
        date: date.toLocaleDateString(),
        achievement: milestone.achievement,
        category: 'milestone',
        xpEarned: milestone.xp,
      });
    }
  });

  // Add streak milestone
  if (metrics.gamification.longestStreak >= 7) {
    timeline.push({
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      achievement: 'Week Long Streak',
      category: 'streak',
      xpEarned: 350,
    });
  }

  return timeline.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Export report as PDF
 */
export function exportReportAsPDF(
  reportData: {
    title: string;
    summary: string;
    metrics: Record<string, string | number>;
    highlights?: string[];
    recommendations?: string[];
    achievements?: string[];
  },
  filename: string = 'learning-report.pdf'
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // Title
  pdf.setFontSize(18);
  pdf.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 12;

  pdf.setTextColor(0);

  // Summary
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Summary', 10, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  const summaryLines = pdf.splitTextToSize(reportData.summary, pageWidth - 20);
  pdf.text(summaryLines, 10, yPosition);
  yPosition += summaryLines.length * 5 + 5;

  // Metrics
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Key Metrics', 10, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  Object.entries(reportData.metrics).forEach(([key, value]) => {
    pdf.text(`${key}: ${value}`, 15, yPosition);
    yPosition += 6;
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }
  });

  // Highlights
  if (reportData.highlights && reportData.highlights.length > 0) {
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Highlights', 10, yPosition);
    yPosition += 8;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    reportData.highlights.forEach(highlight => {
      pdf.text(`• ${highlight}`, 15, yPosition);
      yPosition += 6;
    });
  }

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Recommendations', 10, yPosition);
    yPosition += 8;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    reportData.recommendations.forEach(rec => {
      pdf.text(`• ${rec}`, 15, yPosition);
      yPosition += 6;
    });
  }

  // Save
  pdf.save(filename);
}

/**
 * Export report as CSV
 */
export function exportReportAsCSV(
  metrics: Record<string, string | number>,
  filename: string = 'learning-report.csv'
): void {
  const headers = ['Metric', 'Value'];
  const rows = Object.entries(metrics).map(([key, value]) => [key, value.toString()]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(
  reportData: Record<string, unknown>,
  filename: string = 'learning-report.json'
): void {
  const json = JSON.stringify(reportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a complete report based on configuration
 */
export function generateCompleteReport(
  roadmap: PersonalizedRoadmap,
  config: ReportConfig
): {
  title: string;
  generatedAt: string;
  period: string;
  summary: string;
  sections: Record<string, unknown>;
} {
  const sections: Record<string, unknown> = {};

  if (config.metrics.includes('projects')) {
    sections.projects = generateMonthlySummary(roadmap);
  }

  if (config.metrics.includes('time')) {
    sections.timeMetrics = generateLearningSpeedMetrics(roadmap);
  }

  if (config.metrics.includes('performance')) {
    sections.performance = generateSkillProficiency(roadmap);
  }

  if (config.metrics.includes('gamification')) {
    sections.achievements = generateAchievementTimeline(roadmap);
  }

  return {
    title: `${config.template.charAt(0).toUpperCase()}${config.template.slice(1)} Report`,
    generatedAt: new Date().toISOString(),
    period: `${config.startDate} to ${config.endDate}`,
    summary: 'Detailed learning analytics and performance report',
    sections,
  };
}
