export interface UserMetrics {
  projectsCompleted: number;
  xpEarned: number;
  completionRate: number;
  averageTimePerProject: number;
  streakDays: number;
  skills: Array<{
    name: string;
    proficiency: number;
    timeSpent: number;
  }>;
  recentProjects: Array<{
    title: string;
    category: string;
    difficulty: string;
    timeSpent: number;
    completedAt: Date;
  }>;
}

export interface Insight {
  type: 'achievement' | 'suggestion' | 'warning' | 'celebration';
  title: string;
  message: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
}

export interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  message: string;
}

class InsightEngine {
  private averageCompletionTime = 5.2; // hours
  private averageCompletionRate = 75; // percentage
  private averageSkillsPerMonth = 2;

  /**
   * Generate smart recommendations based on performance
   */
  generateRecommendations(metrics: UserMetrics): Insight[] {
    const insights: Insight[] = [];

    // Check if progressing faster than average
    if (
      metrics.averageTimePerProject <
      this.averageCompletionTime * 0.7
    ) {
      insights.push({
        type: 'celebration',
        title: "You're a Speed Demon! 🚀",
        message: `You're completing projects ${(
          (this.averageCompletionTime /
            metrics.averageTimePerProject) *
          100 -
          100
        ).toFixed(0)}% faster than average!`,
        icon: '⚡',
        priority: 'medium',
        actionLabel: 'Try Advanced Projects',
        actionUrl: '/projects?difficulty=advanced',
      });
    }

    // Check completion rate
    if (metrics.completionRate > this.averageCompletionRate + 15) {
      insights.push({
        type: 'achievement',
        title: 'Exceptional Completion Rate',
        message: `${metrics.completionRate}% - You're consistently finishing projects. Consider increasing difficulty!`,
        icon: '🎯',
        priority: 'high',
        actionLabel: 'Increase Difficulty',
        actionUrl: '/projects?sort=difficulty',
      });
    }

    // Check streak
    if (metrics.streakDays >= 7) {
      insights.push({
        type: 'celebration',
        title: `${metrics.streakDays}-Day Streak! 🔥`,
        message: `You've been learning consistently. Keep up the momentum!`,
        icon: '🔥',
        priority: 'low',
      });
    }

    return insights;
  }

  /**
   * Identify weaknesses in skill set
   */
  identifyWeaknesses(metrics: UserMetrics): Insight[] {
    const insights: Insight[] = [];
    const weakSkills = metrics.skills
      .filter((s) => s.proficiency < 50)
      .sort((a, b) => a.proficiency - b.proficiency)
      .slice(0, 3);

    weakSkills.forEach((skill) => {
      const projectsInSkill = metrics.recentProjects.filter((p) =>
        p.category.toLowerCase().includes(skill.name.toLowerCase())
      );

      const avgTime =
        projectsInSkill.length > 0
          ? projectsInSkill.reduce((sum, p) => sum + p.timeSpent, 0) /
            projectsInSkill.length
          : 0;

      insights.push({
        type: 'suggestion',
        title: `Strengthen Your ${skill.name} Skills`,
        message:
          avgTime > this.averageCompletionTime
            ? `${skill.name} projects take ${(
                (avgTime / this.averageCompletionTime) *
                100 -
                100
              ).toFixed(0)}% longer than average. Consider more practice!`
            : `Your ${skill.name} proficiency is at ${skill.proficiency}%. Let's improve this!`,
        icon: '💡',
        priority: 'medium',
        actionLabel: `Practice ${skill.name}`,
        actionUrl: `/projects?category=${skill.name.toLowerCase()}`,
      });
    });

    return insights;
  }

  /**
   * Analyze motivation and suggest encouragement
   */
  analyzeMotivation(metrics: UserMetrics): Insight[] {
    const insights: Insight[] = [];

    // Low streak alert
    if (metrics.streakDays === 0) {
      insights.push({
        type: 'warning',
        title: 'Break Your New Streak',
        message: 'No activities today. Start a new project to build your streak!',
        icon: '⏰',
        priority: 'high',
        actionLabel: 'Find a Project',
        actionUrl: '/projects',
      });
    } else if (metrics.streakDays === 1) {
      insights.push({
        type: 'suggestion',
        title: 'Great Start! Keep Going',
        message: 'One day down. Can you make it to 7 days?',
        icon: '🌱',
        priority: 'low',
      });
    }

    // Low completion rate warning
    if (metrics.completionRate < this.averageCompletionRate - 20) {
      insights.push({
        type: 'warning',
        title: 'Completion Rate Below Average',
        message: `Your completion rate is ${metrics.completionRate}%. Try starting with easier projects.`,
        icon: '📊',
        priority: 'high',
        actionLabel: 'View Beginner Projects',
        actionUrl: '/projects?difficulty=beginner',
      });
    }

    return insights;
  }

  /**
   * Generate trend detection insights
   */
  detectTrends(
    currentMetrics: UserMetrics,
    previousMetrics: UserMetrics | null
  ): TrendData[] {
    const trends: TrendData[] = [];

    if (!previousMetrics) {
      return trends;
    }

    // XP trend
    const xpChange =
      ((currentMetrics.xpEarned - previousMetrics.xpEarned) /
        previousMetrics.xpEarned) *
      100;
    trends.push({
      metric: 'XP Earned',
      direction: xpChange > 5 ? 'up' : xpChange < -5 ? 'down' : 'stable',
      percentage: Math.round(Math.abs(xpChange)),
      message:
        xpChange > 0
          ? `+${Math.round(xpChange)}% more XP this period`
          : `-${Math.round(Math.abs(xpChange))}% less XP this period`,
    });

    // Completion rate trend
    const rateChange = currentMetrics.completionRate - previousMetrics.completionRate;
    trends.push({
      metric: 'Completion Rate',
      direction: rateChange > 2 ? 'up' : rateChange < -2 ? 'down' : 'stable',
      percentage: Math.round(Math.abs(rateChange)),
      message:
        rateChange > 0
          ? `${Math.round(rateChange)}% improvement in completion rate`
          : `${Math.round(Math.abs(rateChange))}% decline in completion rate`,
    });

    // Time efficiency trend
    const timeChange =
      ((currentMetrics.averageTimePerProject -
        previousMetrics.averageTimePerProject) /
        previousMetrics.averageTimePerProject) *
      100;
    trends.push({
      metric: 'Time Efficiency',
      direction: timeChange < -5 ? 'up' : timeChange > 5 ? 'down' : 'stable',
      percentage: Math.round(Math.abs(timeChange)),
      message:
        timeChange < 0
          ? `${Math.round(Math.abs(timeChange))}% faster at completing projects`
          : `${Math.round(timeChange)}% slower at completing projects`,
    });

    return trends;
  }

  /**
   * Generate peer comparison insights
   */
  generatePeerComparison(userMetrics: UserMetrics): Insight[] {
    const insights: Insight[] = [];

    // Comparison vs average completion rate
    const rateMultiplier =
      userMetrics.completionRate / this.averageCompletionRate;
    if (rateMultiplier > 1.2) {
      insights.push({
        type: 'achievement',
        title: 'Above Average Completion Rate',
        message: `You're ${Math.round((rateMultiplier - 1) * 100)}% more reliable than average users!`,
        icon: '⭐',
        priority: 'low',
      });
    }

    // Comparison vs average speed
    const speedMultiplier =
      this.averageCompletionTime /
      userMetrics.averageTimePerProject;
    if (speedMultiplier > 1.5) {
      insights.push({
        type: 'celebration',
        title: 'Lightning Fast',
        message: `You're ${Math.round((speedMultiplier - 1) * 100)}% faster than typical users!`,
        icon: '⚡',
        priority: 'medium',
      });
    }

    return insights;
  }

  /**
   * Get next project suggestion based on performance
   */
  suggestNextProject(metrics: UserMetrics): {
    title: string;
    reason: string;
    difficulty: string;
  } {
    const sortedSkills = [...metrics.skills].sort(
      (a, b) => b.proficiency - a.proficiency
    );

    const strongestSkill = sortedSkills[0];
    const secondSkill = sortedSkills[1];

    // If mastering one skill, try combining it with another
    if (strongestSkill && strongestSkill.proficiency > 80) {
      return {
        title: `Advanced ${strongestSkill.name} with ${secondSkill.name}`,
        reason: `You've mastered ${strongestSkill.name}. Time to combine it with ${secondSkill.name}!`,
        difficulty: 'Advanced',
      };
    }

    // If completing projects quickly, increase difficulty
    if (
      metrics.averageTimePerProject <
      this.averageCompletionTime * 0.8
    ) {
      return {
        title: 'Expert Level Challenge',
        reason: 'You complete projects faster than most. Ready for an expert challenge?',
        difficulty: 'Expert',
      };
    }

    // Default recommendation
    return {
      title: `Improve Your ${secondSkill.name} Skills`,
      reason: `Next step is to strengthen ${secondSkill.name} to match your ${strongestSkill.name} proficiency.`,
      difficulty: 'Intermediate',
    };
  }

  /**
   * Generate learning path suggestions
   */
  suggestLearningPath(metrics: UserMetrics): Array<{
    phase: number;
    title: string;
    skills: string[];
    estimatedWeeks: number;
    reason: string;
  }> {
    const weakSkills = metrics.skills
      .filter((s) => s.proficiency < 60)
      .map((s) => s.name)
      .slice(0, 3);

    const strongSkills = metrics.skills
      .filter((s) => s.proficiency > 75)
      .map((s) => s.name)
      .slice(0, 2);

    return [
      {
        phase: 1,
        title: 'Strengthen Foundations',
        skills: weakSkills,
        estimatedWeeks: 4,
        reason: 'Focus on improving weaker skills first',
      },
      {
        phase: 2,
        title: 'Advanced Integration',
        skills: strongSkills,
        estimatedWeeks: 3,
        reason: 'Combine your strongest skills in advanced projects',
      },
      {
        phase: 3,
        title: 'Specialization',
        skills: ['Full-Stack Architecture', 'System Design'],
        estimatedWeeks: 6,
        reason: 'Build expertise in specialized areas',
      },
    ];
  }

  /**
   * Calculate motivation score (0-100)
   */
  calculateMotivationScore(metrics: UserMetrics): number {
    let score = 50; // base score

    // Streak bonus
    score += Math.min(metrics.streakDays * 2, 20);

    // Completion rate bonus
    if (metrics.completionRate > this.averageCompletionRate) {
      score += Math.min(
        ((metrics.completionRate - this.averageCompletionRate) / 50) * 20,
        20
      );
    }

    // Speed bonus
    if (
      metrics.averageTimePerProject <
      this.averageCompletionTime
    ) {
      score += Math.min(
        ((this.averageCompletionTime -
          metrics.averageTimePerProject) /
          this.averageCompletionTime) *
          10,
        10
      );
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Get motivational message based on metrics
   */
  getMotivationalMessage(metrics: UserMetrics): string {
    const motivationScore = this.calculateMotivationScore(metrics);

    if (motivationScore >= 90) {
      return "🚀 You're absolutely crushing it! Keep this momentum going!";
    } else if (motivationScore >= 75) {
      return '⭐ Great progress! You\'re on fire!';
    } else if (motivationScore >= 60) {
      return '💪 Good work! Keep pushing forward!';
    } else if (motivationScore >= 45) {
      return '🌱 You\'re growing! Let\'s pick up the pace!';
    } else {
      return '📚 Starting strong! Every step counts!';
    }
  }

  /**
   * Batch generate all insights
   */
  generateAllInsights(
    metrics: UserMetrics,
    previousMetrics?: UserMetrics
  ): {
    recommendations: Insight[];
    weaknesses: Insight[];
    motivation: Insight[];
    peerComparison: Insight[];
    allInsights: Insight[];
  } {
    const recommendations = this.generateRecommendations(metrics);
    const weaknesses = this.identifyWeaknesses(metrics);
    const motivation = this.analyzeMotivation(metrics);
    const peerComparison = this.generatePeerComparison(metrics);

    const allInsights = [
      ...recommendations,
      ...weaknesses,
      ...motivation,
      ...peerComparison,
    ].sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    return {
      recommendations,
      weaknesses,
      motivation,
      peerComparison,
      allInsights,
    };
  }
}

export default new InsightEngine();
