// Time tracking and management utilities
import { Module, TechLevel } from '../types/index';

export interface TimeEntry {
  projectId: string;
  date: string; // ISO date string
  hoursSpent: number;
  notes?: string;
}

export interface TimeBlock {
  projectId: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  milestone?: string;
}

export interface ProjectTimeData {
  projectId: string;
  projectName: string;
  plannedHours: number;
  estimatedHoursForLevel: number;
  actualHoursSpent: number;
  entries: TimeEntry[];
  blocks: TimeBlock[];
  completionPercentage: number;
  daysElapsed: number;
  estimatedDaysRemaining: number;
}

export interface TimeAnalytics {
  totalHoursTracked: number;
  averageHoursPerDay: number;
  averageHoursPerWeek: number;
  projectsCount: number;
  completionRate: number;
  trends: TrendData[];
}

export interface TrendData {
  period: string;
  hoursWorked: number;
  projectsActive: number;
}

export interface UserAvailability {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalPerWeek: number;
}

export interface OptimalSchedule {
  projectId: string;
  projectName: string;
  suggestedHoursPerWeek: number;
  recommendedStartDate: string;
  recommendedEndDate: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

// Track time spent on a project
export function trackTimeSpent(
  projectId: string,
  hours: number,
  date: string = new Date().toISOString().split('T')[0]
): TimeEntry {
  return {
    projectId,
    date,
    hoursSpent: hours,
  };
}

// Estimate remaining time for a project
export function estimateRemainingTime(
  projectData: ProjectTimeData,
  currentLevel: TechLevel
): number {
  const remaining = projectData.estimatedHoursForLevel - projectData.actualHoursSpent;
  return Math.max(0, remaining);
}

// Compare estimated vs actual time
export interface TimeAccuracy {
  projectId: string;
  projectName: string;
  estimatedHours: number;
  actualHours: number;
  variance: number; // percentage
  isOnTrack: boolean;
  recommendation: string;
}

export function compareEstimateVsActual(
  projectData: ProjectTimeData
): TimeAccuracy {
  const variance =
    ((projectData.actualHoursSpent - projectData.plannedHours) /
      projectData.plannedHours) *
    100;

  const isOnTrack = variance <= 10; // Within 10% is considered on track

  let recommendation = '';
  if (variance < -20) {
    recommendation = 'Ahead of schedule! Consider tackling next project early.';
  } else if (variance < 10) {
    recommendation = 'On track! Keep up the current pace.';
  } else if (variance < 30) {
    recommendation =
      'Slightly behind schedule. Increase weekly hours by 5-10 if possible.';
  } else {
    recommendation =
      'Significantly behind schedule. Review project complexity or reassess available time.';
  }

  return {
    projectId: projectData.projectId,
    projectName: projectData.projectName,
    estimatedHours: projectData.plannedHours,
    actualHours: projectData.actualHoursSpent,
    variance: Math.round(variance),
    isOnTrack,
    recommendation,
  };
}

// Get time analytics for user
export function getTimeAnalytics(
  allProjectsData: ProjectTimeData[]
): TimeAnalytics {
  const totalHoursTracked = allProjectsData.reduce(
    (sum, p) => sum + p.actualHoursSpent,
    0
  );

  // Calculate last 30 days average
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let recentHours = 0;
  let daysWithActivity = 0;

  allProjectsData.forEach((project) => {
    project.entries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= thirtyDaysAgo) {
        recentHours += entry.hoursSpent;
        daysWithActivity++;
      }
    });
  });

  const averageHoursPerDay =
    daysWithActivity > 0 ? recentHours / daysWithActivity : 0;
  const averageHoursPerWeek = averageHoursPerDay * 7;

  const completionRate =
    allProjectsData.length > 0
      ? (allProjectsData.filter((p) => p.completionPercentage === 100).length /
          allProjectsData.length) *
        100
      : 0;

  // Generate trend data (weekly)
  const trends: TrendData[] = [];
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let weekHours = 0;
    const activeProjects = new Set<string>();

    allProjectsData.forEach((project) => {
      project.entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        if (entryDate >= weekStart && entryDate <= weekEnd) {
          weekHours += entry.hoursSpent;
          activeProjects.add(project.projectId);
        }
      });
    });

    trends.push({
      period: `Week ${i + 1}`,
      hoursWorked: Math.round(weekHours),
      projectsActive: activeProjects.size,
    });
  }

  return {
    totalHoursTracked: Math.round(totalHoursTracked),
    averageHoursPerDay: Math.round(averageHoursPerDay),
    averageHoursPerWeek: Math.round(averageHoursPerWeek),
    projectsCount: allProjectsData.length,
    completionRate: Math.round(completionRate),
    trends,
  };
}

// Suggest optimal schedule
export function suggestOptimalSchedule(
  projects: Module[],
  userAvailability: UserAvailability,
  userLevel: TechLevel
): OptimalSchedule[] {
  const schedules: OptimalSchedule[] = [];
  const today = new Date();

  projects.forEach((project, index) => {
    const projectHours = project.hours[userLevel];
    const availableHours = userAvailability.totalPerWeek;

    // Avoid overcommitting
    const suggestedHours = Math.min(
      projectHours / 4, // Aim to complete in 4 weeks
      availableHours * 0.6 // Don't use more than 60% of available time
    );

    const weeksNeeded = projectHours / suggestedHours;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + index * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeksNeeded * 7);

    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (project.dependencies.length === 0) {
      priority = 'high'; // Can start immediately
    } else if (projectHours > 30) {
      priority = 'high'; // Long project, start early
    } else if (projectHours < 10) {
      priority = 'low'; // Quick project, can schedule later
    }

    let reason = '';
    if (priority === 'high' && project.dependencies.length === 0) {
      reason = 'No prerequisites. Start this first to build momentum.';
    } else if (priority === 'high') {
      reason = `Long project (${projectHours}h). Start early to avoid rushing.`;
    } else {
      reason = `Quick project (${projectHours}h). Can be scheduled later.`;
    }

    schedules.push({
      projectId: project.id,
      projectName: project.name,
      suggestedHoursPerWeek: Math.round(suggestedHours),
      recommendedStartDate: startDate.toISOString().split('T')[0],
      recommendedEndDate: endDate.toISOString().split('T')[0],
      priority,
      reason,
    });
  });

  // Sort by priority and dependencies
  schedules.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return schedules;
}

// Time recommendation based on availability
export interface TimeRecommendation {
  projectId: string;
  projectName: string;
  hoursPerWeek: number;
  weeksToComplete: number;
  isAchievable: boolean;
  message: string;
}

export function getTimeRecommendations(
  project: Module,
  userLevel: TechLevel,
  availableHoursPerWeek: number
): TimeRecommendation {
  const projectHours = project.hours[userLevel];
  const weeksNeeded = projectHours / availableHoursPerWeek;

  let isAchievable = true;
  let message = '';

  if (weeksNeeded <= 4) {
    message = `Great fit! You can complete this in about ${weeksNeeded.toFixed(1)} weeks at your current pace.`;
  } else if (weeksNeeded <= 8) {
    message = `Reasonable timeline. Plan for ${weeksNeeded.toFixed(1)} weeks. This is a moderate commitment.`;
  } else if (weeksNeeded <= 12) {
    message = `Long-term project. Will take about ${weeksNeeded.toFixed(1)} weeks. Consider breaking it into phases.`;
  } else {
    isAchievable = false;
    message = `This project requires ${weeksNeeded.toFixed(1)} weeks at your current pace. Consider increasing weekly hours or extending timeline.`;
  }

  return {
    projectId: project.id,
    projectName: project.name,
    hoursPerWeek: availableHoursPerWeek,
    weeksToComplete: Math.round(weeksNeeded),
    isAchievable,
    message,
  };
}

// Workload balancing
export interface WorkloadAnalysis {
  projectId: string;
  projectName: string;
  percentageOfWeeklyHours: number;
  loadLevel: 'light' | 'moderate' | 'heavy' | 'overload';
  recommendation: string;
}

export function analyzeWorkload(
  hoursAllocated: number,
  availableHoursPerWeek: number
): WorkloadAnalysis {
  const percentage = (hoursAllocated / availableHoursPerWeek) * 100;

  let loadLevel: 'light' | 'moderate' | 'heavy' | 'overload';
  let recommendation: string;

  if (percentage <= 25) {
    loadLevel = 'light';
    recommendation = 'Light workload. You can take on additional projects.';
  } else if (percentage <= 50) {
    loadLevel = 'moderate';
    recommendation = 'Balanced workload. Good pace without overcommitting.';
  } else if (percentage <= 75) {
    loadLevel = 'heavy';
    recommendation = 'Heavy workload. Monitor progress closely.';
  } else {
    loadLevel = 'overload';
    recommendation =
      'Warning: Over-committed. Consider reducing scope or extending timeline.';
  }

  return {
    projectId: '',
    projectName: '',
    percentageOfWeeklyHours: Math.round(percentage),
    loadLevel,
    recommendation,
  };
}

// Create time blocks/milestones
export function createTimeBlock(
  projectId: string,
  startDate: string,
  endDate: string,
  hoursPerWeek: number,
  milestone?: string
): TimeBlock {
  return {
    projectId,
    startDate,
    endDate,
    hoursPerWeek,
    milestone,
  };
}

// Get milestone suggestions for a project
export interface MilestoneSuggestion {
  name: string;
  percentageComplete: number;
  estimatedWeeks: number;
  keyActivities: string[];
}

export function getMilestoneSuggestions(
  project: Module,
  userLevel: TechLevel,
  projectHours?: number
): MilestoneSuggestion[] {
  const hours = projectHours || project.hours[userLevel];

  return [
    {
      name: 'Setup & Planning (25%)',
      percentageComplete: 0.25,
      estimatedWeeks: Math.ceil((hours * 0.25) / 10),
      keyActivities: [
        'Understand requirements',
        'Set up dev environment',
        'Plan architecture',
      ],
    },
    {
      name: 'Core Implementation (50%)',
      percentageComplete: 0.5,
      estimatedWeeks: Math.ceil((hours * 0.25) / 10),
      keyActivities: [
        'Implement main features',
        'Write core logic',
        'Initial testing',
      ],
    },
    {
      name: 'Polish & Testing (75%)',
      percentageComplete: 0.75,
      estimatedWeeks: Math.ceil((hours * 0.25) / 10),
      keyActivities: [
        'Fix bugs',
        'Optimize performance',
        'User testing',
      ],
    },
    {
      name: 'Deployment & Docs (100%)',
      percentageComplete: 1,
      estimatedWeeks: Math.ceil((hours * 0.1) / 10),
      keyActivities: [
        'Deploy to production',
        'Write documentation',
        'Final review',
      ],
    },
  ];
}
