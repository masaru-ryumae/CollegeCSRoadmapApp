// Project comparison and analysis utilities
import { Module, TechLevel } from '../types/index';

export interface ProjectComparison {
  projects: Module[];
  differences: DifferencesAnalysis;
  summary: ComparisonSummary;
  recommendation: string;
}

export interface DifferencesAnalysis {
  [key: string]: {
    modules: Module[];
    values: (string | number | string[])[];
  };
}

export interface ComparisonSummary {
  overview: string;
  timeCommitment: string;
  difficulty: string;
  prerequisites: string;
  keyDifferences: string[];
}

export interface UserProfile {
  techLevel: TechLevel;
  hoursPerWeek: number;
  deadline?: string;
  interests?: string[];
}

export interface ProjectScore {
  project: Module;
  score: number;
  breakdown: {
    relevance: number;
    feasibility: number;
    interest: number;
  };
}

// Compare multiple projects side by side
export function compareProjects(
  projectIds: string[],
  allModules: Module[]
): ProjectComparison | null {
  const projects = allModules.filter((m) => projectIds.includes(m.id));

  if (projects.length < 2) {
    return null;
  }

  const differences = getProjectDifferences(projects);
  const summary = generateComparisonSummary(projects);
  const recommendation = generateRecommendation(projects, summary);

  return {
    projects,
    differences,
    summary,
    recommendation,
  };
}

// Extract key differences between projects
function getProjectDifferences(projects: Module[]): DifferencesAnalysis {
  const analysis: DifferencesAnalysis = {};

  // Compare time requirements
  analysis.timeRequirement = {
    modules: projects,
    values: projects.map((p) => p.hours.intermediate.toFixed(1) + ' hours'),
  };

  // Compare difficulty availability
  const difficulties: (string | number | string[])[] = [];
  for (const project of projects) {
    const available: string[] = [];
    if (project.hours.beginner > 0) available.push('Beginner');
    if (project.hours.intermediate > 0) available.push('Intermediate');
    if (project.hours.advanced > 0) available.push('Advanced');
    difficulties.push(available);
  }
  analysis.difficulty = {
    modules: projects,
    values: difficulties,
  };

  // Compare prerequisites
  analysis.prerequisites = {
    modules: projects,
    values: projects.map((p) => p.dependencies.length),
  };

  // Compare key points count
  analysis.keyPointsCount = {
    modules: projects,
    values: projects.map((p) => p.key_points.length),
  };

  return analysis;
}

// Generate human-readable comparison summary
export function generateComparisonSummary(projects: Module[]): ComparisonSummary {
  const times = projects.map((p) => p.hours.intermediate);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const minDeps = Math.min(
    ...projects.map((p) => p.dependencies.length)
  );
  const maxDeps = Math.max(
    ...projects.map((p) => p.dependencies.length)
  );

  let overview = `Comparing ${projects.length} projects: ${projects.map((p) => p.name).join(', ')}.`;

  let timeCommitment: string;
  if (minTime === maxTime) {
    timeCommitment = `All projects require approximately ${minTime.toFixed(1)} hours at intermediate level.`;
  } else {
    timeCommitment = `Time requirement ranges from ${minTime.toFixed(1)} to ${maxTime.toFixed(1)} hours (intermediate level).`;
  }

  const allDifficulties = new Set<string>();
  projects.forEach((p) => {
    if (p.hours.beginner > 0) allDifficulties.add('Beginner');
    if (p.hours.intermediate > 0) allDifficulties.add('Intermediate');
    if (p.hours.advanced > 0) allDifficulties.add('Advanced');
  });
  const difficulty = `Available at ${Array.from(allDifficulties).join(', ')} levels.`;

  let prerequisites: string;
  if (minDeps === maxDeps) {
    prerequisites = `All projects have ${minDeps} ${minDeps === 1 ? 'prerequisite' : 'prerequisites'}.`;
  } else {
    prerequisites = `Prerequisites range from ${minDeps} to ${maxDeps} projects.`;
  }

  // Find key differences
  const keyDifferences: string[] = [];

  // Time difference
  if (maxTime - minTime > 2) {
    const fastest = projects.find((p) => p.hours.intermediate === minTime);
    const slowest = projects.find((p) => p.hours.intermediate === maxTime);
    keyDifferences.push(
      `${fastest?.name} is faster (${minTime}h) vs ${slowest?.name} (${maxTime}h)`
    );
  }

  // Dependency difference
  if (maxDeps > minDeps) {
    const independent = projects.find(
      (p) => p.dependencies.length === minDeps
    );
    const dependent = projects.find((p) => p.dependencies.length === maxDeps);
    keyDifferences.push(
      `${independent?.name} is more independent (${minDeps} deps) vs ${dependent?.name} (${maxDeps} deps)`
    );
  }

  // Complexity (by key points)
  const minKeyPoints = Math.min(...projects.map((p) => p.key_points.length));
  const maxKeyPoints = Math.max(...projects.map((p) => p.key_points.length));
  if (maxKeyPoints - minKeyPoints > 2) {
    const simpler = projects.find(
      (p) => p.key_points.length === minKeyPoints
    );
    const complex = projects.find((p) => p.key_points.length === maxKeyPoints);
    keyDifferences.push(
      `${simpler?.name} is simpler (${minKeyPoints} topics) vs ${complex?.name} (${maxKeyPoints} topics)`
    );
  }

  return {
    overview,
    timeCommitment,
    difficulty,
    prerequisites,
    keyDifferences,
  };
}

// Score a project for a specific user profile
export function scoreForUser(
  project: Module,
  userProfile: UserProfile
): ProjectScore {
  let relevanceScore = 50; // Base score
  let feasibilityScore = 50;
  let interestScore = 50;

  // Relevance: adjust based on tech level match
  const userHours = project.hours[userProfile.techLevel];
  if (userHours > 0) {
    relevanceScore += 30;
  }

  // Feasibility: check if time requirement fits weekly hours
  if (userProfile.hoursPerWeek) {
    const projectHours = project.hours[userProfile.techLevel];
    const weeksNeeded = projectHours / userProfile.hoursPerWeek;

    if (weeksNeeded <= 4) {
      feasibilityScore += 40; // Quick project
    } else if (weeksNeeded <= 8) {
      feasibilityScore += 20; // Medium project
    } else if (weeksNeeded <= 12) {
      feasibilityScore += 10; // Long project
    } else {
      feasibilityScore -= 10; // Too long
    }
  }

  // Interest: check if key points match interests
  if (userProfile.interests && userProfile.interests.length > 0) {
    const matchedTopics = project.key_points.filter((point) =>
      userProfile.interests!.some(
        (interest) =>
          point.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(point.toLowerCase())
      )
    ).length;

    interestScore += (matchedTopics / project.key_points.length) * 30;
  }

  // Penalty for high prerequisites if not optimal
  if (project.dependencies.length > 3) {
    feasibilityScore -= 10;
  }

  // Normalize scores
  const normalize = (score: number) =>
    Math.max(0, Math.min(100, Math.round(score)));

  const breakdown = {
    relevance: normalize(relevanceScore),
    feasibility: normalize(feasibilityScore),
    interest: normalize(interestScore),
  };

  const overallScore =
    (breakdown.relevance * 0.3 +
      breakdown.feasibility * 0.4 +
      breakdown.interest * 0.3) /
    100;

  return {
    project,
    score: Math.round(overallScore * 100),
    breakdown,
  };
}

// Generate personalized recommendation
function generateRecommendation(
  projects: Module[],
  summary: ComparisonSummary
): string {
  if (projects.length < 2) {
    return 'Need at least 2 projects for a recommendation.';
  }

  if (projects.length === 2) {
    const times = projects.map((p) => p.hours.intermediate);
    const time0 = times[0];
    const time1 = times[1];

    const deps0 = projects[0].dependencies.length;
    const deps1 = projects[1].dependencies.length;

    if (time0 < time1 && deps0 <= deps1) {
      return `Pick "${projects[0].name}" - it's faster with equal or fewer prerequisites. Best for time-constrained learners.`;
    } else if (time1 < time0 && deps1 <= deps0) {
      return `Pick "${projects[1].name}" - it's faster with equal or fewer prerequisites. Best for time-constrained learners.`;
    } else if (deps0 < deps1) {
      return `Pick "${projects[0].name}" - fewer dependencies means less setup time. Start here if you're new.`;
    } else if (deps1 < deps0) {
      return `Pick "${projects[1].name}" - fewer dependencies means less setup time. Start here if you're new.`;
    } else {
      return `Both are comparable. Choose based on personal interest in the topics covered.`;
    }
  }

  // For 3+ projects
  const fastest = projects.reduce((min, p) =>
    p.hours.intermediate < min.hours.intermediate ? p : min
  );
  const leastDeps = projects.reduce((min, p) =>
    p.dependencies.length < min.dependencies.length ? p : min
  );

  if (fastest === leastDeps) {
    return `Pick "${fastest.name}" - it's both fast and has minimal prerequisites. Ideal starting point.`;
  } else {
    return `Start with "${leastDeps.name}" (fewest dependencies), then progress to "${fastest.name}" (fastest to complete).`;
  }
}

// Get pros and cons for a project
export interface ProjectAnalysis {
  pros: string[];
  cons: string[];
  bestFor: string[];
  notBestFor: string[];
}

export function analyzeProject(module: Module): ProjectAnalysis {
  const pros: string[] = [];
  const cons: string[] = [];
  const bestFor: string[] = [];
  const notBestFor: string[] = [];

  // Analyze time commitment
  const avgHours =
    (module.hours.beginner + module.hours.intermediate + module.hours.advanced) /
    3;
  if (avgHours < 10) {
    pros.push('Quick to complete');
    bestFor.push('People with limited time');
  } else if (avgHours < 20) {
    pros.push('Moderate time investment');
    bestFor.push('Students with regular availability');
  } else {
    cons.push('Significant time commitment');
    notBestFor.push('People with less than 10 hours/week');
  }

  // Analyze prerequisites
  if (module.dependencies.length === 0) {
    pros.push('Can start immediately - no prerequisites');
    bestFor.push('Beginners');
  } else if (module.dependencies.length === 1) {
    pros.push('Minimal dependencies');
  } else if (module.dependencies.length > 3) {
    cons.push(`Requires completing ${module.dependencies.length} other projects first`);
    notBestFor.push('People looking to start immediately');
  }

  // Analyze difficulty spread
  const difficulties = [module.hours.beginner, module.hours.intermediate, module.hours.advanced].filter(h => h > 0);
  if (difficulties.length === 3) {
    pros.push('Scalable - adapts to your skill level');
    bestFor.push('Diverse skill levels');
  } else if (difficulties.length === 1) {
    const level = module.hours.beginner > 0 ? 'Beginner' : module.hours.intermediate > 0 ? 'Intermediate' : 'Advanced';
    cons.push(`Only available at ${level} level`);
  }

  // Analyze topics (key points)
  if (module.key_points.length > 8) {
    cons.push('Covers many different topics - may feel scattered');
  } else if (module.key_points.length < 4) {
    pros.push('Focused and targeted learning');
    bestFor.push('People wanting deep knowledge in one area');
  } else {
    pros.push('Well-balanced scope');
  }

  return { pros, cons, bestFor, notBestFor };
}
