import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportMetrics {
  weekStart: Date;
  weekEnd: Date;
  projectsCompleted: number;
  xpEarned: number;
  totalHours: number;
  completionRate: number;
  averageTimePerProject: number;
  skillsImproved: string[];
  newSkillsLearned: string[];
  streakDays: number;
}

export interface MonthlyReportData {
  month: string;
  year: number;
  totalProjects: number;
  totalXp: number;
  totalHours: number;
  categories: { [key: string]: number };
  topSkills: Array<{ name: string; proficiency: number }>;
  achievements: string[];
  comparisonToPreviousMonth: {
    projectsChange: number;
    xpChange: number;
  };
}

export interface SkillReport {
  skillName: string;
  proficiency: number;
  hoursSpent: number;
  projectsCompleted: number;
  lastPracticedDate: Date;
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
}

export interface LearningSpeedAnalysis {
  averageTimePerProject: number;
  completionVelocity: number; // projects per week
  skillAcquisitionRate: number; // new skills per month
  comparisonToUserAverage: {
    faster: boolean;
    percentage: number;
    message: string;
  };
  recommendations: string[];
}

class ReportGenerator {
  /**
   * Generate weekly digest report
   */
  generateWeeklyDigest(metrics: ReportMetrics): string {
    const { weekStart, weekEnd } = metrics;
    const weekFormat = (date: Date) =>
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    let report = `WEEKLY DIGEST REPORT\n`;
    report += `${weekFormat(weekStart)} - ${weekFormat(weekEnd)}\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `SUMMARY METRICS\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Projects Completed: ${metrics.projectsCompleted}\n`;
    report += `XP Earned: ${metrics.xpEarned}\n`;
    report += `Total Hours: ${metrics.totalHours.toFixed(1)}\n`;
    report += `Completion Rate: ${metrics.completionRate}%\n`;
    report += `Average Time per Project: ${metrics.averageTimePerProject.toFixed(1)} hours\n`;
    report += `Current Streak: ${metrics.streakDays} days\n\n`;

    report += `SKILL IMPROVEMENTS\n`;
    report += `${'='.repeat(50)}\n`;
    if (metrics.skillsImproved.length > 0) {
      metrics.skillsImproved.forEach((skill) => {
        report += `✓ ${skill}\n`;
      });
    } else {
      report += `No significant improvements this week.\n`;
    }
    report += '\n';

    report += `NEW SKILLS LEARNED\n`;
    report += `${'='.repeat(50)}\n`;
    if (metrics.newSkillsLearned.length > 0) {
      metrics.newSkillsLearned.forEach((skill) => {
        report += `• ${skill}\n`;
      });
    } else {
      report += `No new skills learned this week.\n`;
    }

    return report;
  }

  /**
   * Generate monthly summary report
   */
  generateMonthlySummary(data: MonthlyReportData): string {
    let report = `MONTHLY SUMMARY REPORT\n`;
    report += `${data.month} ${data.year}\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `OVERVIEW\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Total Projects Completed: ${data.totalProjects}\n`;
    report += `Total XP Earned: ${data.totalXp}\n`;
    report += `Total Hours Invested: ${data.totalHours}\n\n`;

    report += `BREAKDOWN BY CATEGORY\n`;
    report += `${'='.repeat(50)}\n`;
    Object.entries(data.categories).forEach(([category, count]) => {
      report += `${category}: ${count} projects\n`;
    });
    report += '\n';

    report += `TOP 5 SKILLS\n`;
    report += `${'='.repeat(50)}\n`;
    data.topSkills.slice(0, 5).forEach((skill, index) => {
      report += `${index + 1}. ${skill.name} - ${skill.proficiency}%\n`;
    });
    report += '\n';

    report += `ACHIEVEMENTS UNLOCKED\n`;
    report += `${'='.repeat(50)}\n`;
    if (data.achievements.length > 0) {
      data.achievements.forEach((achievement) => {
        report += `🏆 ${achievement}\n`;
      });
    } else {
      report += `No new achievements this month.\n`;
    }
    report += '\n';

    report += `COMPARISON TO PREVIOUS MONTH\n`;
    report += `${'='.repeat(50)}\n`;
    const projectChange = data.comparisonToPreviousMonth.projectsChange;
    const xpChange = data.comparisonToPreviousMonth.xpChange;

    const projectSymbol = projectChange >= 0 ? '▲' : '▼';
    const xpSymbol = xpChange >= 0 ? '▲' : '▼';

    report += `Projects: ${projectSymbol} ${Math.abs(projectChange)} projects\n`;
    report += `XP: ${xpSymbol} ${Math.abs(xpChange)} XP\n`;

    return report;
  }

  /**
   * Generate skill proficiency report
   */
  generateSkillReport(skills: SkillReport[]): string {
    let report = `SKILL PROFICIENCY REPORT\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    report += `${'='.repeat(50)}\n\n`;

    const sortedSkills = [...skills].sort(
      (a, b) => b.proficiency - a.proficiency
    );

    sortedSkills.forEach((skill, index) => {
      report += `${index + 1}. ${skill.skillName.toUpperCase()}\n`;
      report += `   Proficiency: ${skill.proficiency}%\n`;
      report += `   Hours Spent: ${skill.hoursSpent}\n`;
      report += `   Projects Completed: ${skill.projectsCompleted}\n`;
      report += `   Trend: ${skill.trend} (${skill.trendPercentage >= 0 ? '+' : ''}${skill.trendPercentage}%)\n`;
      report += `   Last Practiced: ${skill.lastPracticedDate.toLocaleDateString()}\n\n`;
    });

    return report;
  }

  /**
   * Generate learning speed analysis
   */
  generateLearningSpeedAnalysis(analysis: LearningSpeedAnalysis): string {
    let report = `LEARNING SPEED ANALYSIS\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `METRICS\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Average Time per Project: ${analysis.averageTimePerProject.toFixed(1)} hours\n`;
    report += `Completion Velocity: ${analysis.completionVelocity.toFixed(1)} projects/week\n`;
    report += `Skill Acquisition Rate: ${analysis.skillAcquisitionRate.toFixed(1)} skills/month\n\n`;

    report += `COMPARISON TO USER AVERAGE\n`;
    report += `${'='.repeat(50)}\n`;
    report += `${analysis.comparisonToUserAverage.message}\n`;
    report += `Difference: ${analysis.comparisonToUserAverage.percentage}%\n\n`;

    report += `RECOMMENDATIONS\n`;
    report += `${'='.repeat(50)}\n`;
    analysis.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }

  /**
   * Export report as PDF
   */
  async generatePDF(
    title: string,
    reportContent: string,
    filename: string
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const lineHeight = 7;
    const maxWidth = pageWidth - 2 * margin;

    // Add title
    pdf.setFontSize(18);
    pdf.setFont('Arial', 'bold');
    pdf.text(title, margin, margin + 10);

    // Add timestamp
    pdf.setFontSize(10);
    pdf.setFont('Arial', 'normal');
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      margin + 20
    );

    // Add horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, margin + 25, pageWidth - margin, margin + 25);

    // Add content
    const lines = pdf.splitTextToSize(reportContent, maxWidth);
    let yPosition = margin + 35;

    pdf.setFontSize(11);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    // Save PDF
    pdf.save(filename);
  }

  /**
   * Generate PDF from HTML element
   */
  async generatePDFFromHTML(
    element: HTMLElement,
    filename: string
  ): Promise<void> {
    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  }

  /**
   * Email delivery support (mock)
   */
  async emailReport(
    recipientEmail: string,
    reportContent: string,
    reportType: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // In a real application, this would call a backend API
      console.log(`Report "${reportType}" would be sent to ${recipientEmail}`);

      // Store in localStorage for demo purposes
      const emailHistory = JSON.parse(
        localStorage.getItem('emailHistory') || '[]'
      );
      emailHistory.push({
        to: recipientEmail,
        type: reportType,
        content: reportContent,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem('emailHistory', JSON.stringify(emailHistory));

      return {
        success: true,
        message: `Report sent to ${recipientEmail}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send report: ${error}`,
      };
    }
  }

  /**
   * Generate comparison metrics between two periods
   */
  compareReports(
    report1: ReportMetrics,
    report2: ReportMetrics
  ): {
    projectsDelta: number;
    xpDelta: number;
    timeChange: number;
    velocityImprovement: number;
  } {
    return {
      projectsDelta: report2.projectsCompleted - report1.projectsCompleted,
      xpDelta: report2.xpEarned - report1.xpEarned,
      timeChange: report2.totalHours - report1.totalHours,
      velocityImprovement:
        report2.completionRate - report1.completionRate,
    };
  }

  /**
   * Generate achievement timeline
   */
  generateAchievementTimeline(
    achievements: Array<{
      name: string;
      unlockedAt: Date;
      description: string;
    }>
  ): string {
    let report = `ACHIEVEMENT TIMELINE\n`;
    report += `${'='.repeat(50)}\n\n`;

    const sorted = [...achievements].sort(
      (a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime()
    );

    sorted.forEach((achievement) => {
      const dateStr = achievement.unlockedAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      report += `${dateStr} - ${achievement.name}\n`;
      report += `         ${achievement.description}\n\n`;
    });

    return report;
  }
}

export default new ReportGenerator();
