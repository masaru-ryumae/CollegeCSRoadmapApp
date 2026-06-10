// Difficulty matcher utilities for smart project recommendations

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ProjectDifficulty {
  projectId: string;
  name: string;
  currentDifficulty: DifficultyLevel;
  matchScore: number; // 0-100, how well it matches user's current level
}

export interface DifficultyAnalysis {
  currentLevel: DifficultyLevel;
  completionPercentage: number; // 0-100
  recommendedNextLevel: DifficultyLevel;
  readyToProgressPercentage: number; // 0-100
}

// Mock project database with difficulty information
const PROJECT_DATABASE: Record<string, {
  name: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  prerequisites: string[];
}> = {
  'proj_1': { name: 'Todo App', difficulty: 'beginner', estimatedHours: 4, prerequisites: [] },
  'proj_2': { name: 'Weather App', difficulty: 'beginner', estimatedHours: 6, prerequisites: [] },
  'proj_3': { name: 'Chat App', difficulty: 'intermediate', estimatedHours: 20, prerequisites: ['proj_1'] },
  'proj_4': { name: 'E-commerce Site', difficulty: 'intermediate', estimatedHours: 30, prerequisites: ['proj_1'] },
  'proj_5': { name: 'Data Pipeline', difficulty: 'intermediate', estimatedHours: 25, prerequisites: [] },
  'proj_6': { name: 'ML Model', difficulty: 'intermediate', estimatedHours: 40, prerequisites: ['proj_5'] },
  'proj_7': { name: 'DSA: Sorting', difficulty: 'intermediate', estimatedHours: 15, prerequisites: [] },
  'proj_8': { name: 'Advanced Algorithms', difficulty: 'advanced', estimatedHours: 35, prerequisites: ['proj_7'] },
  'proj_9': { name: 'Distributed System', difficulty: 'advanced', estimatedHours: 50, prerequisites: ['proj_3', 'proj_7'] },
  'proj_10': { name: 'Open Source Contribution', difficulty: 'advanced', estimatedHours: 20, prerequisites: [] },
  'proj_11': { name: 'Microservices Architecture', difficulty: 'expert', estimatedHours: 60, prerequisites: ['proj_9'] }
};

const STORAGE_KEY = 'cs-roadmap-project-completion';

// Get project database
export function getProjectDatabase(): typeof PROJECT_DATABASE {
  return PROJECT_DATABASE;
}

// Get project by ID
export function getProject(projectId: string) {
  return PROJECT_DATABASE[projectId] || null;
}

// Track completed project
export function recordProjectCompletion(userId: string, projectId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const completedProjects = stored ? JSON.parse(stored) : {};

    if (!completedProjects[userId]) {
      completedProjects[userId] = [];
    }

    if (!completedProjects[userId].includes(projectId)) {
      completedProjects[userId].push(projectId);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedProjects));
  } catch (error) {
    console.error('Error recording project completion:', error);
  }
}

// Get completed projects
export function getCompletedProjects(userId: string): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const completedProjects = JSON.parse(stored);
    return completedProjects[userId] || [];
  } catch (error) {
    console.error('Error loading completed projects:', error);
    return [];
  }
}

// Analyze user's project completion to determine current difficulty
export function analyzeUserProjects(userId: string): DifficultyAnalysis {
  const completed = getCompletedProjects(userId);

  if (completed.length === 0) {
    return {
      currentLevel: 'beginner',
      completionPercentage: 0,
      recommendedNextLevel: 'beginner',
      readyToProgressPercentage: 0
    };
  }

  // Analyze completed projects
  const completedDifficulties = completed
    .map(pid => getProject(pid)?.difficulty || 'beginner')
    .filter((d): d is DifficultyLevel => d !== null);

  const difficultyDistribution = {
    beginner: completedDifficulties.filter(d => d === 'beginner').length,
    intermediate: completedDifficulties.filter(d => d === 'intermediate').length,
    advanced: completedDifficulties.filter(d => d === 'advanced').length,
    expert: completedDifficulties.filter(d => d === 'expert').length
  };

  // Determine current level based on distribution
  let currentLevel: DifficultyLevel = 'beginner';
  let recommendedNextLevel: DifficultyLevel = 'intermediate';

  if (difficultyDistribution.expert > 0) {
    currentLevel = 'expert';
    recommendedNextLevel = 'expert';
  } else if (difficultyDistribution.advanced >= 2) {
    currentLevel = 'advanced';
    recommendedNextLevel = 'expert';
  } else if (difficultyDistribution.intermediate >= 2) {
    currentLevel = 'intermediate';
    recommendedNextLevel = 'advanced';
  } else if (difficultyDistribution.beginner >= 2) {
    currentLevel = 'beginner';
    recommendedNextLevel = 'intermediate';
  }

  // Calculate readiness to progress (0-100)
  const readyToProgressPercentage = calculateReadinessPercentage(
    userId,
    currentLevel,
    recommendedNextLevel
  );

  // Calculate completion percentage at current level
  const totalProjects = Object.keys(PROJECT_DATABASE).length;
  const completionPercentage = Math.round((completed.length / totalProjects) * 100);

  return {
    currentLevel,
    completionPercentage,
    recommendedNextLevel,
    readyToProgressPercentage
  };
}

// Calculate percentage ready to progress to next level
function calculateReadinessPercentage(
  userId: string,
  currentLevel: DifficultyLevel,
  nextLevel: DifficultyLevel
): number {
  const completed = getCompletedProjects(userId);
  const projectsAtCurrentLevel = Object.entries(PROJECT_DATABASE)
    .filter(([, proj]) => proj.difficulty === currentLevel)
    .map(([id]) => id);

  const completedAtCurrentLevel = projectsAtCurrentLevel.filter(pid =>
    completed.includes(pid)
  ).length;

  const percentage = Math.round(
    (completedAtCurrentLevel / projectsAtCurrentLevel.length) * 100
  );

  // Need 60%+ completion at current level to be ready
  return Math.min(100, percentage);
}

// Suggest next difficulty for user
export function suggestNextDifficulty(userId: string): DifficultyLevel {
  const analysis = analyzeUserProjects(userId);

  // Recommend progression if ready
  if (analysis.readyToProgressPercentage >= 60) {
    return analysis.recommendedNextLevel;
  }

  return analysis.currentLevel;
}

// Get projects filtered by difficulty with scoring
export function getRecommendedProjectsByDifficulty(
  userId: string,
  difficulty: DifficultyLevel
): ProjectDifficulty[] {
  const completed = new Set(getCompletedProjects(userId));
  const analysis = analyzeUserProjects(userId);

  const candidates = Object.entries(PROJECT_DATABASE)
    .filter(([id, proj]) => proj.difficulty === difficulty && !completed.has(id))
    .map(([id, proj]) => {
      let matchScore = 50; // Base score

      // Boost score if prerequisites are met
      const prereqsMet = proj.prerequisites.every(prereq => completed.has(prereq));
      if (prereqsMet) {
        matchScore += 30;
      }

      // Boost if user has mastered current level
      if (analysis.currentLevel === difficulty && analysis.readyToProgressPercentage > 50) {
        matchScore += 10;
      }

      // Slightly penalize if user is far beyond this level
      if (
        (analysis.currentLevel === 'advanced' && difficulty === 'beginner') ||
        (analysis.currentLevel === 'expert' && difficulty !== 'expert')
      ) {
        matchScore -= 20;
      }

      return {
        projectId: id,
        name: proj.name,
        currentDifficulty: difficulty,
        matchScore: Math.max(0, Math.min(100, matchScore))
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return candidates;
}

// Get all recommended projects sorted by relevance
export function getSmartProjectRecommendations(userId: string): ProjectDifficulty[] {
  const analysis = analyzeUserProjects(userId);
  const nextDifficulty = suggestNextDifficulty(userId);

  // Prioritize recommended next difficulty
  const nextLevelProjects = getRecommendedProjectsByDifficulty(userId, nextDifficulty);

  // Also include same-level projects if user hasn't completed them all
  const sameLevelProjects = getRecommendedProjectsByDifficulty(userId, analysis.currentLevel);

  // Combine and return top recommendations
  return [...nextLevelProjects, ...sameLevelProjects].slice(0, 10);
}

// Filter projects by difficulty
export function filterProjectsByDifficulty(
  userId: string,
  difficulty: DifficultyLevel
): ProjectDifficulty[] {
  const completed = new Set(getCompletedProjects(userId));

  return Object.entries(PROJECT_DATABASE)
    .filter(([id, proj]) => proj.difficulty === difficulty && !completed.has(id))
    .map(([id, proj]) => ({
      projectId: id,
      name: proj.name,
      currentDifficulty: difficulty,
      matchScore: 50
    }));
}

// Get progression path visualization
export interface ProgressionStep {
  level: DifficultyLevel;
  completed: number;
  total: number;
  percentage: number;
  isCurrentLevel: boolean;
  isRecommendedNext: boolean;
}

export function getProgressionPath(userId: string): ProgressionStep[] {
  const analysis = analyzeUserProjects(userId);
  const completed = new Set(getCompletedProjects(userId));

  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  return levels.map(level => {
    const totalAtLevel = Object.values(PROJECT_DATABASE).filter(p => p.difficulty === level).length;
    const completedAtLevel = Object.entries(PROJECT_DATABASE)
      .filter(([id, p]) => p.difficulty === level && completed.has(id))
      .length;

    return {
      level,
      completed: completedAtLevel,
      total: totalAtLevel,
      percentage: Math.round((completedAtLevel / totalAtLevel) * 100),
      isCurrentLevel: level === analysis.currentLevel,
      isRecommendedNext: level === analysis.recommendedNextLevel
    };
  });
}

// Get difficulty progression insights
export function getDifficultyInsights(userId: string): string {
  const analysis = analyzeUserProjects(userId);
  const completed = getCompletedProjects(userId).length;

  if (completed === 0) {
    return 'Start with beginner projects to build foundational skills!';
  }

  if (analysis.readyToProgressPercentage >= 80) {
    return `You've mastered ${analysis.currentLevel} projects! Ready to take on ${analysis.recommendedNextLevel} challenges?`;
  }

  if (analysis.readyToProgressPercentage >= 60) {
    return `Great progress! Complete a few more ${analysis.currentLevel} projects before moving to ${analysis.recommendedNextLevel}.`;
  }

  return `Keep building your ${analysis.currentLevel} skills! You're on the right track.`;
}
