/**
 * Project Advisor Service - Provides project guidance and planning advice
 */

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'blocked' | 'completed';
  completedModules?: string[];
  currentModule?: string;
  goals?: string[];
  timeline?: number; // weeks
  skills?: string[];
}

interface NextSteps {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  rationale: string;
}

interface BlockerAnalysis {
  blockers: Array<{
    title: string;
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  summary: string;
}

interface ResourceRecommendation {
  title: string;
  type: 'tutorial' | 'documentation' | 'course' | 'book' | 'practice';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

class ProjectAdvisor {
  /**
   * Suggest next steps for a project
   */
  suggestNextSteps(projectData: ProjectData): NextSteps {
    const completed = projectData.completedModules?.length || 0;
    const progress = completed > 0 ? Math.round((completed / (completed + 5)) * 100) : 0;

    const immediate = this.getImmediateSteps(projectData, progress);
    const shortTerm = this.getShortTermSteps(projectData);
    const longTerm = this.getLongTermSteps(projectData);

    const rationale = this.generateRationale(projectData, progress);

    return { immediate, shortTerm, longTerm, rationale };
  }

  /**
   * Identify blockers in project
   */
  identifyBlockers(projectData: ProjectData): BlockerAnalysis {
    const blockers = [];

    // Check for common blockers
    if (projectData.status === 'blocked') {
      blockers.push({
        title: 'Project Status',
        impact: 'high' as const,
        suggestion: 'This project is marked as blocked. What\'s preventing progress? Identify and resolve the root cause.'
      });
    }

    if (!projectData.skills || projectData.skills.length === 0) {
      blockers.push({
        title: 'Missing Skills',
        impact: 'high' as const,
        suggestion: 'You haven\'t identified required skills. Document what skills you need to learn.'
      });
    }

    if (!projectData.timeline) {
      blockers.push({
        title: 'No Timeline',
        impact: 'medium' as const,
        suggestion: 'Set a realistic timeline. Break the project into phases with specific deadlines.'
      });
    }

    if (projectData.completedModules && projectData.completedModules.length === 0 && projectData.status === 'in-progress') {
      blockers.push({
        title: 'No Progress',
        impact: 'medium' as const,
        suggestion: 'Start with the foundational modules. Begin with simple concepts before advancing.'
      });
    }

    if (!projectData.description || projectData.description.length < 20) {
      blockers.push({
        title: 'Vague Goals',
        impact: 'low' as const,
        suggestion: 'Clarify your project goals. What exactly are you trying to build or learn?'
      });
    }

    const summary = this.generateBlockerSummary(blockers, projectData);

    return { blockers, summary };
  }

  /**
   * Recommend learning resources
   */
  recommendResources(projectData: ProjectData): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];

    // Based on project type and skills needed
    const skills = projectData.skills || [];

    if (skills.includes('web-development') || projectData.description.toLowerCase().includes('web')) {
      recommendations.push({
        title: 'MDN Web Docs',
        type: 'documentation',
        description: 'Comprehensive reference for web technologies (HTML, CSS, JavaScript)',
        difficulty: 'beginner',
        estimatedTime: 'Self-paced'
      });

      recommendations.push({
        title: 'Interactive Coding Tutorials',
        type: 'tutorial',
        description: 'Hands-on projects to learn web development fundamentals',
        difficulty: 'beginner',
        estimatedTime: '4-6 weeks'
      });
    }

    if (skills.includes('algorithms') || projectData.description.toLowerCase().includes('algorithm')) {
      recommendations.push({
        title: 'Algorithm Design Manual',
        type: 'book',
        description: 'Deep dive into algorithm design, analysis, and optimization',
        difficulty: 'advanced',
        estimatedTime: '8-12 weeks'
      });

      recommendations.push({
        title: 'LeetCode / HackerRank',
        type: 'practice',
        description: 'Practice coding problems with increasing difficulty',
        difficulty: 'intermediate',
        estimatedTime: '30 min daily'
      });
    }

    if (skills.includes('data-structures') || projectData.description.toLowerCase().includes('data')) {
      recommendations.push({
        title: 'Data Structures Visualization',
        type: 'tutorial',
        description: 'Visual explanations of arrays, linked lists, trees, graphs, etc.',
        difficulty: 'beginner',
        estimatedTime: '3-4 weeks'
      });
    }

    if (skills.includes('system-design') || projectData.description.toLowerCase().includes('system')) {
      recommendations.push({
        title: 'System Design Course',
        type: 'course',
        description: 'Learn how to design scalable systems and architectures',
        difficulty: 'advanced',
        estimatedTime: '6-8 weeks'
      });
    }

    // Add general recommendations
    recommendations.push({
      title: 'GitHub Repository',
      type: 'practice',
      description: 'Create a repository and commit your work regularly',
      difficulty: 'beginner',
      estimatedTime: 'Ongoing'
    });

    recommendations.push({
      title: 'Project Documentation',
      type: 'documentation',
      description: 'Write clear README files and code comments',
      difficulty: 'beginner',
      estimatedTime: 'Ongoing'
    });

    return recommendations;
  }

  /**
   * Estimate project complexity
   */
  estimateComplexity(projectDescription: string): {
    level: 'low' | 'medium' | 'high' | 'expert';
    factors: string[];
    estimatedTime: string;
    skillsNeeded: string[];
  } {
    const desc = projectDescription.toLowerCase();
    const factors: string[] = [];
    const skillsNeeded: string[] = [];
    let complexity = 0;

    // Analyze description for complexity indicators
    if (desc.includes('api') || desc.includes('backend') || desc.includes('server')) {
      complexity += 2;
      factors.push('Backend/API development required');
      skillsNeeded.push('Backend programming', 'Databases');
    }

    if (desc.includes('database') || desc.includes('sql')) {
      complexity += 1;
      factors.push('Database design and management');
      skillsNeeded.push('SQL', 'Database design');
    }

    if (desc.includes('authentication') || desc.includes('security')) {
      complexity += 2;
      factors.push('Security implementation');
      skillsNeeded.push('Security best practices');
    }

    if (desc.includes('real-time') || desc.includes('websocket')) {
      complexity += 2;
      factors.push('Real-time communication');
      skillsNeeded.push('WebSockets', 'Async programming');
    }

    if (desc.includes('mobile') || desc.includes('app')) {
      complexity += 2;
      factors.push('Mobile platform considerations');
      skillsNeeded.push('Mobile development', 'Cross-platform compatibility');
    }

    if (desc.includes('machine learning') || desc.includes('ai')) {
      complexity += 3;
      factors.push('ML/AI components');
      skillsNeeded.push('Machine learning', 'Mathematics', 'Data science');
    }

    if (desc.includes('scalable') || desc.includes('distributed')) {
      complexity += 2;
      factors.push('Scalability considerations');
      skillsNeeded.push('System design', 'Performance optimization');
    }

    if (desc.includes('test') || desc.includes('test-driven')) {
      complexity += 1;
      factors.push('Testing requirements');
      skillsNeeded.push('Testing frameworks', 'Test design');
    }

    // Determine level
    let level: 'low' | 'medium' | 'high' | 'expert';
    let estimatedTime: string;

    if (complexity <= 1) {
      level = 'low';
      estimatedTime = '2-4 weeks';
    } else if (complexity <= 2) {
      level = 'medium';
      estimatedTime = '4-8 weeks';
    } else if (complexity <= 3) {
      level = 'high';
      estimatedTime = '8-12 weeks';
    } else {
      level = 'expert';
      estimatedTime = '3-6 months';
    }

    if (skillsNeeded.length === 0) {
      skillsNeeded.push('Problem solving', 'Programming fundamentals');
    }

    return { level, factors, estimatedTime, skillsNeeded };
  }

  /**
   * Suggest alternative approaches
   */
  suggestAlternativeApproach(projectData: ProjectData): Array<{
    approach: string;
    pros: string[];
    cons: string[];
    timeline: string;
  }> {
    const alternatives = [];

    const currentApproach = projectData.description.toLowerCase();

    // Suggest alternative tech stacks or approaches
    if (currentApproach.includes('javascript') || currentApproach.includes('react')) {
      alternatives.push({
        approach: 'Vue.js or Angular',
        pros: [
          'Different learning experience',
          'May be easier for some developers',
          'Good alternative if stuck with React'
        ],
        cons: [
          'Need to learn new framework',
          'Ecosystem is smaller than React',
          'May be harder to find jobs'
        ],
        timeline: '4-6 weeks to learn'
      });
    }

    if (currentApproach.includes('sql')) {
      alternatives.push({
        approach: 'NoSQL/MongoDB',
        pros: [
          'Flexible schema',
          'Good for rapid development',
          'Easier scaling'
        ],
        cons: [
          'Less structure can lead to issues',
          'Not ideal for complex queries',
          'Different learning curve'
        ],
        timeline: '2-3 weeks to learn'
      });
    }

    // General alternatives
    alternatives.push({
      approach: 'Start with simplified version',
      pros: [
        'Build MVP faster',
        'Validate core concept',
        'Easier debugging',
        'Can refactor later'
      ],
      cons: [
        'May need significant rework',
        'Quick fixes can become tech debt',
        'May limit future features'
      ],
      timeline: 'Reduce timeline by 30-50%'
    });

    alternatives.push({
      approach: 'Use existing libraries/frameworks',
      pros: [
        'Faster development',
        'Better tested code',
        'Less to learn',
        'Community support'
      ],
      cons: [
        'Less control',
        'May include unnecessary features',
        'Dependency management',
        'Updates can break things'
      ],
      timeline: 'Reduce timeline by 40-60%'
    });

    return alternatives;
  }

  // Private helper methods

  private getImmediateSteps(projectData: ProjectData, progress: number): string[] {
    if (progress === 0) {
      return [
        'Define clear, measurable goals for your project',
        'Break the project into smaller, manageable modules',
        'Identify prerequisite skills you need to learn',
        'Set up your development environment'
      ];
    }

    if (projectData.status === 'blocked') {
      return [
        'Identify what\'s blocking progress',
        'Break the blocker into smaller sub-problems',
        'Seek help or resources for the blocker',
        'Create an action plan to unblock'
      ];
    }

    return [
      `Continue with the next module after "${projectData.currentModule || 'current module'}"`,
      'Review what you\'ve learned so far',
      'Build a small project using your new skills',
      'Document your progress and learnings'
    ];
  }

  private getShortTermSteps(projectData: ProjectData): string[] {
    return [
      `Complete the ${projectData.timeline || 2}-week sprint on current skills`,
      'Build mini-projects to reinforce learning',
      'Join a study group or find a learning partner',
      'Start contributing code to your main project'
    ];
  }

  private getLongTermSteps(projectData: ProjectData): string[] {
    return [
      'Build a complete portfolio project',
      'Contribute to open-source projects',
      'Teach what you\'ve learned to others',
      'Plan your next learning objective'
    ];
  }

  private generateRationale(projectData: ProjectData, progress: number): string {
    let rationale = `You're ${progress}% through your current path. `;

    if (progress < 25) {
      rationale += 'Focus on building strong foundations before moving to advanced topics. ';
    } else if (progress < 50) {
      rationale += 'You\'ve got a good foundation. Now focus on deeper understanding and practice. ';
    } else if (progress < 75) {
      rationale += 'You\'re in the middle stretch. Keep momentum and start building real projects. ';
    } else {
      rationale += 'You\'re almost there! Time to polish skills and prepare for real-world challenges. ';
    }

    if (projectData.skills && projectData.skills.length > 0) {
      rationale += `Focus on mastering: ${projectData.skills.slice(0, 2).join(', ')}. `;
    }

    rationale += 'Stay consistent, review regularly, and don\'t hesitate to ask for help.';
    return rationale;
  }

  private generateBlockerSummary(blockers: any[], projectData: ProjectData): string {
    if (blockers.length === 0) {
      return `Great! No major blockers detected. ${projectData.name} is on track. Continue with the current plan.`;
    }

    const highImpact = blockers.filter(b => b.impact === 'high').length;
    const mediumImpact = blockers.filter(b => b.impact === 'medium').length;

    let summary = `Found ${blockers.length} potential issues: ${highImpact} high-priority, ${mediumImpact} medium-priority. `;

    if (highImpact > 0) {
      summary += 'Address high-priority items first before continuing. ';
    }

    summary += 'Work through each blocker methodically.';

    return summary;
  }
}

export const projectAdvisor = new ProjectAdvisor();
export type { ProjectData, NextSteps, BlockerAnalysis, ResourceRecommendation };
