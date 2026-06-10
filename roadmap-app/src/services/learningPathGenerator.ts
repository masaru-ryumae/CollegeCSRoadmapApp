/**
 * Learning Path Generator Service - Creates personalized learning paths
 */

interface LearningPath {
  id: string;
  goal: string;
  steps: LearningStep[];
  estimatedDuration: string;
  prerequisites: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
}

interface LearningStep {
  id: string;
  order: number;
  title: string;
  description: string;
  resources: Resource[];
  exercises: Exercise[];
  estimatedHours: number;
  difficulty: string;
  completed: boolean;
}

interface Resource {
  title: string;
  type: 'tutorial' | 'documentation' | 'video' | 'article' | 'book' | 'course';
  url?: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

interface Exercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  keywords: string[];
}

interface Milestone {
  step: number;
  title: string;
  description: string;
  criteria: string[];
  reward?: string;
}

class LearningPathGenerator {
  private commonGoals = [
    'web-development',
    'mobile-development',
    'machine-learning',
    'data-science',
    'system-design',
    'algorithms',
    'devops',
    'cloud-computing'
  ];

  /**
   * Generate a learning path for a goal
   */
  generateLearningPath(goal: string): LearningPath {
    const normalizedGoal = goal.toLowerCase();
    const matchedGoal = this.commonGoals.find(g => normalizedGoal.includes(g.replace('-', ' '))) || normalizedGoal;

    const steps = this.createStepsForGoal(matchedGoal);
    const prerequisites = this.getPrerequisites(matchedGoal);
    const difficulty = this.estimateDifficulty(matchedGoal);
    const estimatedDuration = this.estimateDuration(steps);

    return {
      id: `path-${Date.now()}`,
      goal: matchedGoal,
      steps,
      estimatedDuration,
      prerequisites,
      difficulty,
      description: this.generateDescription(matchedGoal)
    };
  }

  /**
   * Suggest prerequisites for a skill
   */
  suggestPrerequisites(skill: string): Array<{
    skill: string;
    why: string;
    estimatedTime: string;
  }> {
    const prerequisites = [];
    const skillLower = skill.toLowerCase();

    // Programming fundamentals
    if (!skillLower.includes('python') && !skillLower.includes('javascript') && !skillLower.includes('java')) {
      prerequisites.push({
        skill: 'Programming Fundamentals',
        why: 'Foundation for all software development',
        estimatedTime: '3-4 weeks'
      });
    }

    // Language-specific
    if (skillLower.includes('web')) {
      prerequisites.push(
        {
          skill: 'HTML & CSS',
          why: 'Foundation for web development',
          estimatedTime: '2-3 weeks'
        },
        {
          skill: 'JavaScript',
          why: 'Required for interactive web development',
          estimatedTime: '4-6 weeks'
        }
      );
    }

    if (skillLower.includes('react') || skillLower.includes('vue') || skillLower.includes('angular')) {
      prerequisites.push(
        {
          skill: 'JavaScript ES6+',
          why: 'Modern JavaScript is required for modern frameworks',
          estimatedTime: '2-3 weeks'
        },
        {
          skill: 'HTML & CSS',
          why: 'Basic web structure and styling',
          estimatedTime: '1-2 weeks'
        }
      );
    }

    if (skillLower.includes('backend') || skillLower.includes('node') || skillLower.includes('python')) {
      prerequisites.push(
        {
          skill: 'Programming Fundamentals',
          why: 'Core programming concepts',
          estimatedTime: '3-4 weeks'
        },
        {
          skill: 'Databases (SQL)',
          why: 'Most backends interact with databases',
          estimatedTime: '2-3 weeks'
        }
      );
    }

    if (skillLower.includes('machine learning') || skillLower.includes('ai')) {
      prerequisites.push(
        {
          skill: 'Mathematics (Linear Algebra, Calculus, Statistics)',
          why: 'Foundation for ML algorithms',
          estimatedTime: '6-8 weeks'
        },
        {
          skill: 'Python',
          why: 'Standard language for ML',
          estimatedTime: '3-4 weeks'
        },
        {
          skill: 'Data Structures & Algorithms',
          why: 'Important for efficient ML implementations',
          estimatedTime: '4-5 weeks'
        }
      );
    }

    if (skillLower.includes('devops') || skillLower.includes('kubernetes')) {
      prerequisites.push(
        {
          skill: 'Linux/Unix Fundamentals',
          why: 'Most DevOps work is on Linux systems',
          estimatedTime: '2-3 weeks'
        },
        {
          skill: 'Docker',
          why: 'Container basics before orchestration',
          estimatedTime: '1-2 weeks'
        }
      );
    }

    return prerequisites;
  }

  /**
   * Create milestones for a project
   */
  createMilestones(projectDescription: string): Milestone[] {
    const milestones: Milestone[] = [];
    const totalSteps = 10; // Assume 10-step project

    const milestone25: Milestone = {
      step: Math.ceil(totalSteps * 0.25),
      title: 'Foundation Mastery',
      description: 'You\'ve completed the foundational concepts',
      criteria: [
        'Understand core concepts',
        'Can explain key principles',
        'Completed 25% of the project'
      ],
      reward: '🎯 Quarter way there!'
    };

    const milestone50: Milestone = {
      step: Math.ceil(totalSteps * 0.5),
      title: 'Halfway Through!',
      description: 'You\'ve reached the midpoint of your learning journey',
      criteria: [
        'Can apply concepts independently',
        'Working on intermediate challenges',
        'Completed 50% of the project'
      ],
      reward: '🏆 Momentum is yours!'
    };

    const milestone75: Milestone = {
      step: Math.ceil(totalSteps * 0.75),
      title: 'Advanced Skills Achieved',
      description: 'You\'re in the advanced phase of learning',
      criteria: [
        'Can solve complex problems',
        'Understanding edge cases',
        'Completed 75% of the project'
      ],
      reward: '⭐ Almost there!'
    };

    const milestone100: Milestone = {
      step: totalSteps,
      title: 'Master Level',
      description: 'You\'ve completed your learning path!',
      criteria: [
        'Can teach others',
        'Solved all challenges',
        'Completed 100% of the project'
      ],
      reward: '🎉 You are a master!'
    };

    return [milestone25, milestone50, milestone75, milestone100];
  }

  /**
   * Estimate time to mastery
   */
  estimateTimeToMastery(skill: string): {
    beginner: string;
    intermediate: string;
    advanced: string;
    master: string;
    tips: string[];
  } {
    const skillLower = skill.toLowerCase();

    let baseDays = 30; // Default 1 month to beginner

    // Adjust based on skill complexity
    if (skillLower.includes('machine learning') || skillLower.includes('system design')) {
      baseDays = 60; // 2 months
    } else if (skillLower.includes('framework') || skillLower.includes('platform')) {
      baseDays = 45; // 1.5 months
    } else if (skillLower.includes('language')) {
      baseDays = 45; // 1.5 months
    }

    return {
      beginner: `${baseDays} days (${Math.round(baseDays / 7)} weeks)`,
      intermediate: `${baseDays * 2}-${baseDays * 3} days (${Math.round(baseDays * 2 / 7)}-${Math.round(baseDays * 3 / 7)} weeks)`,
      advanced: `${baseDays * 4}-${baseDays * 6} days (${Math.round(baseDays * 4 / 7)}-${Math.round(baseDays * 6 / 7)} weeks)`,
      master: `${baseDays * 6}-${baseDays * 12} days (${Math.round(baseDays * 6 / 7)}-${Math.round(baseDays * 12 / 7)} weeks)`,
      tips: [
        'Practice consistently - 1-2 hours daily is better than 10 hours once a week',
        'Build real projects - theory alone won\'t make you proficient',
        'Teach others - explaining concepts solidifies your understanding',
        'Review and refactor - revisit old projects with new knowledge',
        'Read code - study how experienced developers solve problems',
        'Join communities - get feedback and learn from peers'
      ]
    };
  }

  // Private helper methods

  private createStepsForGoal(goal: string): LearningStep[] {
    const stepsMap: Record<string, LearningStep[]> = {
      'web-development': [
        this.createStep(1, 'HTML Fundamentals', 'Learn HTML basics and document structure'),
        this.createStep(2, 'CSS Styling', 'Master CSS for styling and layouts'),
        this.createStep(3, 'JavaScript Basics', 'Learn JavaScript fundamentals'),
        this.createStep(4, 'DOM Manipulation', 'Learn to interact with web pages dynamically'),
        this.createStep(5, 'ES6+ Features', 'Master modern JavaScript features'),
        this.createStep(6, 'React Framework', 'Build UIs with React'),
        this.createStep(7, 'Backend Basics', 'Learn server-side development'),
        this.createStep(8, 'Databases', 'Work with databases'),
        this.createStep(9, 'Full Stack Project', 'Build a complete web application'),
        this.createStep(10, 'Deployment', 'Deploy your application to production')
      ],
      'mobile-development': [
        this.createStep(1, 'Mobile Fundamentals', 'Understand mobile development concepts'),
        this.createStep(2, 'Choose Framework', 'Select React Native, Flutter, or native'),
        this.createStep(3, 'Language Basics', 'Learn the required programming language'),
        this.createStep(4, 'UI Components', 'Master mobile UI components'),
        this.createStep(5, 'Navigation', 'Implement app navigation'),
        this.createStep(6, 'State Management', 'Handle app state'),
        this.createStep(7, 'APIs & Backend', 'Connect to backend services'),
        this.createStep(8, 'Storage', 'Local and remote data storage'),
        this.createStep(9, 'Testing', 'Test mobile applications'),
        this.createStep(10, 'App Store', 'Publish to app stores')
      ],
      'machine-learning': [
        this.createStep(1, 'Mathematics Foundation', 'Linear algebra, calculus, statistics'),
        this.createStep(2, 'Python for ML', 'Learn Python and its ML libraries'),
        this.createStep(3, 'Data Preprocessing', 'Prepare data for ML'),
        this.createStep(4, 'Supervised Learning', 'Regression and classification'),
        this.createStep(5, 'Unsupervised Learning', 'Clustering and dimensionality reduction'),
        this.createStep(6, 'Neural Networks', 'Deep learning fundamentals'),
        this.createStep(7, 'NLP Basics', 'Natural language processing'),
        this.createStep(8, 'ML Projects', 'Build real ML projects'),
        this.createStep(9, 'Model Deployment', 'Deploy ML models'),
        this.createStep(10, 'Advanced Topics', 'Specialized ML domains')
      ],
      'algorithms': [
        this.createStep(1, 'Algorithm Basics', 'Understand algorithm analysis and notation'),
        this.createStep(2, 'Sorting Algorithms', 'Master sorting techniques'),
        this.createStep(3, 'Searching Algorithms', 'Learn search strategies'),
        this.createStep(4, 'Dynamic Programming', 'Solve optimization problems'),
        this.createStep(5, 'Graph Algorithms', 'Work with graphs and networks'),
        this.createStep(6, 'Greedy Algorithms', 'Learn greedy approaches'),
        this.createStep(7, 'String Algorithms', 'Pattern matching and manipulation'),
        this.createStep(8, 'Math Algorithms', 'Number theory and combinatorics'),
        this.createStep(9, 'Advanced Techniques', 'Advanced algorithmic paradigms'),
        this.createStep(10, 'Problem Solving', 'Apply algorithms to real problems')
      ]
    };

    const normalizedGoal = goal.toLowerCase().replace(' ', '-');
    return stepsMap[normalizedGoal] || this.createGenericSteps();
  }

  private createStep(order: number, title: string, description: string): LearningStep {
    return {
      id: `step-${order}`,
      order,
      title,
      description,
      resources: this.generateResourcesForStep(title),
      exercises: this.generateExercisesForStep(title),
      estimatedHours: 10 + order,
      difficulty: this.getDifficulty(order),
      completed: false
    };
  }

  private createGenericSteps(): LearningStep[] {
    return Array.from({ length: 10 }, (_, i) => {
      const order = i + 1;
      return this.createStep(order, `Step ${order}: Core Concepts`, `Learn fundamental concepts for this skill`);
    });
  }

  private generateResourcesForStep(stepTitle: string): Resource[] {
    return [
      {
        title: `${stepTitle} Documentation`,
        type: 'documentation',
        description: 'Official documentation and references',
        difficulty: 'beginner'
      },
      {
        title: `${stepTitle} Tutorial`,
        type: 'tutorial',
        description: 'Step-by-step guided tutorial',
        difficulty: 'beginner',
        duration: '2-3 hours'
      },
      {
        title: `${stepTitle} Video Course`,
        type: 'video',
        description: 'Video explanations and walkthroughs',
        difficulty: 'beginner',
        duration: '4-6 hours'
      },
      {
        title: `${stepTitle} Best Practices`,
        type: 'article',
        description: 'Industry best practices and patterns',
        difficulty: 'intermediate'
      }
    ];
  }

  private generateExercisesForStep(stepTitle: string): Exercise[] {
    return [
      {
        title: `Basic ${stepTitle} Exercise`,
        description: 'Simple exercise to practice the concept',
        difficulty: 'easy',
        estimatedTime: 30,
        keywords: ['practice', 'basic']
      },
      {
        title: `Intermediate ${stepTitle} Challenge`,
        description: 'More complex problem requiring problem-solving',
        difficulty: 'medium',
        estimatedTime: 60,
        keywords: ['challenge', 'problem-solving']
      },
      {
        title: `Advanced ${stepTitle} Project`,
        description: 'Real-world application of the concept',
        difficulty: 'hard',
        estimatedTime: 120,
        keywords: ['project', 'application']
      }
    ];
  }

  private getPrerequisites(goal: string): string[] {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('web')) {
      return ['HTML', 'CSS', 'JavaScript Basics'];
    }
    if (goalLower.includes('mobile')) {
      return ['Programming Fundamentals', 'Mobile Concepts'];
    }
    if (goalLower.includes('machine learning')) {
      return ['Mathematics', 'Python', 'Statistics'];
    }
    if (goalLower.includes('algorithms')) {
      return ['Programming Fundamentals', 'Data Structures'];
    }
    if (goalLower.includes('system')) {
      return ['Networking', 'Database Basics', 'Architecture Concepts'];
    }

    return ['Programming Fundamentals'];
  }

  private estimateDifficulty(goal: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('beginner') || goalLower.includes('basic') || goalLower.includes('fundamentals')) {
      return 'beginner';
    }
    if (goalLower.includes('advanced') || goalLower.includes('system') || goalLower.includes('machine learning')) {
      return 'advanced';
    }
    if (goalLower.includes('expert') || goalLower.includes('master')) {
      return 'expert';
    }

    return 'intermediate';
  }

  private estimateDuration(steps: LearningStep[]): string {
    const totalHours = steps.reduce((sum, step) => sum + step.estimatedHours, 0);
    const weeks = Math.ceil(totalHours / 15); // Assuming 15 hours per week

    if (weeks <= 4) {
      return `${weeks} weeks`;
    }
    if (weeks <= 12) {
      return `${Math.round(weeks / 4)} months`;
    }
    return `${Math.round(weeks / 52)} years`;
  }

  private getDifficulty(stepNumber: number): string {
    if (stepNumber <= 3) return 'Beginner';
    if (stepNumber <= 6) return 'Intermediate';
    if (stepNumber <= 8) return 'Advanced';
    return 'Expert';
  }

  private generateDescription(goal: string): string {
    const goalFormatted = goal.replace('-', ' ').toUpperCase();
    return `Comprehensive learning path to master ${goalFormatted}. This path covers foundational concepts through advanced techniques with hands-on exercises and real-world projects.`;
  }
}

export const learningPathGenerator = new LearningPathGenerator();
export type { LearningPath, LearningStep, Resource, Exercise, Milestone };
