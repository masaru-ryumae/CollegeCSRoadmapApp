// Skill progression utilities for tracking skill development

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  projectsTeach: string[];
  estimatedHours: number;
  icon?: string;
}

export interface SkillProgress {
  skillId: string;
  userId: string;
  level: 'not-started' | 'learning' | 'proficient' | 'expert';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  projectsCompleted: string[];
}

// Skills database
const SKILLS_DATABASE: Record<string, Skill> = {
  // Programming Fundamentals
  'fundamentals-js': {
    id: 'fundamentals-js',
    name: 'JavaScript Fundamentals',
    category: 'Programming',
    description: 'Core JavaScript concepts: variables, functions, objects, arrays',
    level: 'beginner',
    prerequisites: [],
    projectsTeach: ['proj_1', 'proj_2'],
    estimatedHours: 20,
    icon: '📘'
  },
  'fundamentals-python': {
    id: 'fundamentals-python',
    name: 'Python Fundamentals',
    category: 'Programming',
    description: 'Core Python concepts and syntax',
    level: 'beginner',
    prerequisites: [],
    projectsTeach: ['proj_5', 'proj_6'],
    estimatedHours: 20,
    icon: '🐍'
  },

  // Web Development
  'web-html-css': {
    id: 'web-html-css',
    name: 'HTML & CSS',
    category: 'Web Development',
    description: 'Markup and styling for web applications',
    level: 'beginner',
    prerequisites: [],
    projectsTeach: ['proj_1', 'proj_2'],
    estimatedHours: 15,
    icon: '🎨'
  },
  'web-react': {
    id: 'web-react',
    name: 'React.js',
    category: 'Web Development',
    description: 'Building modern UIs with React',
    level: 'intermediate',
    prerequisites: ['fundamentals-js', 'web-html-css'],
    projectsTeach: ['proj_3', 'proj_4'],
    estimatedHours: 30,
    icon: '⚛️'
  },
  'web-backend': {
    id: 'web-backend',
    name: 'Backend Development',
    category: 'Web Development',
    description: 'Server-side development, APIs, databases',
    level: 'intermediate',
    prerequisites: ['fundamentals-js', 'fundamentals-python'],
    projectsTeach: ['proj_3'],
    estimatedHours: 40,
    icon: '🔧'
  },

  // Data Structures & Algorithms
  'dsa-basics': {
    id: 'dsa-basics',
    name: 'Data Structures Basics',
    category: 'DSA',
    description: 'Arrays, linked lists, stacks, queues',
    level: 'intermediate',
    prerequisites: ['fundamentals-js', 'fundamentals-python'],
    projectsTeach: ['proj_7'],
    estimatedHours: 25,
    icon: '🏗️'
  },
  'dsa-advanced': {
    id: 'dsa-advanced',
    name: 'Advanced Algorithms',
    category: 'DSA',
    description: 'Trees, graphs, dynamic programming',
    level: 'advanced',
    prerequisites: ['dsa-basics'],
    projectsTeach: ['proj_8'],
    estimatedHours: 40,
    icon: '🎯'
  },

  // Systems & Architecture
  'systems-design': {
    id: 'systems-design',
    name: 'System Design',
    category: 'Architecture',
    description: 'Large-scale system design patterns',
    level: 'advanced',
    prerequisites: ['web-backend', 'dsa-basics'],
    projectsTeach: ['proj_9'],
    estimatedHours: 35,
    icon: '🏛️'
  },

  // Data Science & ML
  'ml-basics': {
    id: 'ml-basics',
    name: 'Machine Learning Basics',
    category: 'Data Science',
    description: 'Supervised learning, classification, regression',
    level: 'intermediate',
    prerequisites: ['fundamentals-python'],
    projectsTeach: ['proj_5', 'proj_6'],
    estimatedHours: 30,
    icon: '🤖'
  },

  // DevOps & Tools
  'devops-git': {
    id: 'devops-git',
    name: 'Git & Version Control',
    category: 'DevOps',
    description: 'Version control, branching, collaboration',
    level: 'beginner',
    prerequisites: [],
    projectsTeach: ['proj_1'],
    estimatedHours: 8,
    icon: '📦'
  },
  'devops-ci-cd': {
    id: 'devops-ci-cd',
    name: 'CI/CD Pipelines',
    category: 'DevOps',
    description: 'Continuous integration and deployment',
    level: 'intermediate',
    prerequisites: ['devops-git'],
    projectsTeach: ['proj_9'],
    estimatedHours: 20,
    icon: '⚙️'
  }
};

const SKILL_PROGRESS_KEY = 'cs-roadmap-skill-progress';

// Get all available skills
export function getAllSkills(): Skill[] {
  return Object.values(SKILLS_DATABASE);
}

// Get skills by category
export function getSkillsByCategory(category: string): Skill[] {
  return Object.values(SKILLS_DATABASE).filter(skill => skill.category === category);
}

// Get skill by ID
export function getSkill(skillId: string): Skill | null {
  return SKILLS_DATABASE[skillId] || null;
}

// Initialize user skill progress
export function initializeUserSkillProgress(userId: string): void {
  const existing = localStorage.getItem(SKILL_PROGRESS_KEY);
  if (existing) {
    const parsed = JSON.parse(existing);
    if (parsed[userId]) return; // Already initialized
  }

  const progressMap: Record<string, SkillProgress> = {};

  Object.keys(SKILLS_DATABASE).forEach(skillId => {
    progressMap[skillId] = {
      skillId,
      userId,
      level: 'not-started',
      progress: 0,
      projectsCompleted: []
    };
  });

  const allProgress = existing ? JSON.parse(existing) : {};
  allProgress[userId] = progressMap;

  localStorage.setItem(SKILL_PROGRESS_KEY, JSON.stringify(allProgress));
}

// Get user skill progress
export function getUserSkillProgress(userId: string): SkillProgress[] {
  try {
    const stored = localStorage.getItem(SKILL_PROGRESS_KEY);
    if (!stored) {
      initializeUserSkillProgress(userId);
      return getUserSkillProgress(userId);
    }

    const allProgress = JSON.parse(stored);
    return Object.values(allProgress[userId] || {}) as SkillProgress[];
  } catch (error) {
    console.error('Error loading skill progress:', error);
    return [];
  }
}

// Update skill progress
export function updateSkillProgress(
  userId: string,
  skillId: string,
  updates: Partial<SkillProgress>
): SkillProgress | null {
  try {
    const stored = localStorage.getItem(SKILL_PROGRESS_KEY);
    if (!stored) return null;

    const allProgress = JSON.parse(stored);
    if (!allProgress[userId] || !allProgress[userId][skillId]) return null;

    const progress = allProgress[userId][skillId];
    Object.assign(progress, updates, {
      skillId,
      userId
    });

    // Auto-set level based on progress
    if (progress.progress >= 100 && progress.level !== 'expert') {
      progress.level = 'expert';
      progress.completedAt = new Date().toISOString();
    } else if (progress.progress > 0 && progress.level === 'not-started') {
      progress.level = 'learning';
      progress.startedAt = new Date().toISOString();
    } else if (progress.progress >= 50 && progress.level === 'learning') {
      progress.level = 'proficient';
    }

    localStorage.setItem(SKILL_PROGRESS_KEY, JSON.stringify(allProgress));
    return progress;
  } catch (error) {
    console.error('Error updating skill progress:', error);
    return null;
  }
}

// Track skill completion
export function trackSkillCompletion(userId: string, skillId: string): SkillProgress | null {
  return updateSkillProgress(userId, skillId, {
    level: 'expert',
    progress: 100,
    completedAt: new Date().toISOString()
  });
}

// Add completed project to skill
export function addProjectToSkill(
  userId: string,
  skillId: string,
  projectId: string
): SkillProgress | null {
  const progress = getUserSkillProgress(userId).find(sp => sp.skillId === skillId);
  if (!progress) return null;

  if (!progress.projectsCompleted.includes(projectId)) {
    progress.projectsCompleted.push(projectId);
  }

  const newProgress = Math.min(100, progress.progress + 10);
  return updateSkillProgress(userId, skillId, {
    progress: newProgress,
    projectsCompleted: progress.projectsCompleted
  });
}

// Calculate overall skill level percentage
export function calculateSkillLevel(userId: string): number {
  const allProgress = getUserSkillProgress(userId);
  if (allProgress.length === 0) return 0;

  const totalProgress = allProgress.reduce((sum, sp) => sum + sp.progress, 0);
  return Math.round(totalProgress / allProgress.length);
}

// Get next recommended skills
export function getNextSkills(userId: string): Skill[] {
  const userProgress = getUserSkillProgress(userId);
  const completedSkills = userProgress
    .filter(sp => sp.level === 'expert' || sp.progress >= 75)
    .map(sp => sp.skillId);

  const nextSkills = Object.values(SKILLS_DATABASE)
    .filter(skill => {
      // Skill not yet started
      const progress = userProgress.find(sp => sp.skillId === skill.id);
      if (progress && progress.level !== 'not-started') return false;

      // All prerequisites met
      const prereqsMet = skill.prerequisites.every(prereq =>
        completedSkills.includes(prereq)
      );

      return prereqsMet;
    })
    .sort((a, b) => a.estimatedHours - b.estimatedHours);

  return nextSkills.slice(0, 5);
}

// Get skill prerequisites
export function getSkillPrerequisites(skillId: string): Skill[] {
  const skill = getSkill(skillId);
  if (!skill) return [];

  return skill.prerequisites
    .map(prereqId => getSkill(prereqId))
    .filter((skill): skill is Skill => skill !== null);
}

// Get skills that teach a specific project
export function getSkillsForProject(projectId: string): Skill[] {
  return Object.values(SKILLS_DATABASE).filter(skill =>
    skill.projectsTeach.includes(projectId)
  );
}

// Calculate skill proficiency for milestone tracking
export interface Milestone {
  name: string;
  skillsRequired: string[];
  description: string;
  earned: boolean;
}

export function getMilestones(userId: string): Milestone[] {
  const userProgress = getUserSkillProgress(userId);
  const completedSkills = new Set(
    userProgress
      .filter(sp => sp.level === 'expert')
      .map(sp => sp.skillId)
  );

  const milestones: Milestone[] = [
    {
      name: 'Foundation Complete',
      skillsRequired: ['fundamentals-js', 'web-html-css'],
      description: 'Master JavaScript and web basics',
      earned: ['fundamentals-js', 'web-html-css'].every(s => completedSkills.has(s))
    },
    {
      name: 'Full Stack Developer',
      skillsRequired: ['fundamentals-js', 'web-react', 'web-backend'],
      description: 'Learn frontend, backend, and everything between',
      earned: ['fundamentals-js', 'web-react', 'web-backend'].every(s => completedSkills.has(s))
    },
    {
      name: 'Algorithm Master',
      skillsRequired: ['dsa-basics', 'dsa-advanced'],
      description: 'Conquer data structures and algorithms',
      earned: ['dsa-basics', 'dsa-advanced'].every(s => completedSkills.has(s))
    },
    {
      name: 'System Architect',
      skillsRequired: ['web-backend', 'dsa-basics', 'systems-design'],
      description: 'Design large-scale systems',
      earned: ['web-backend', 'dsa-basics', 'systems-design'].every(s => completedSkills.has(s))
    }
  ];

  return milestones;
}
