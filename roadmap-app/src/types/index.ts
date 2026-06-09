// Core types for the Roadmap App

export type TechLevel = 'beginner' | 'intermediate' | 'advanced';
export type CompanyType = 'faang' | 'startup' | 'balanced';
export type HoursPerWeek = '5-10' | '10-15' | '15-20';
export type HasProject = 'yes' | 'no';
export type Timeline = 'summer-2026' | 'fall-2026' | 'spring-2027';

export interface DecisionAnswers {
  techLevel: TechLevel;
  targetCompanyType: CompanyType;
  hoursPerWeek: HoursPerWeek;
  hasExistingProject: HasProject;
  timeline: Timeline;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  hours: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  dependencies: string[];
  key_points: string[];
}

export interface Path {
  name: string;
  description: string;
  moduleOrder: string[];
  best_for: string;
  interview_weight: string;
}

export interface Paths {
  'leetcode-heavy': Path;
  'system-design': Path;
  'balanced': Path;
}

export interface DecisionTreeQuestion {
  question_id: string;
  question: string;
  type: 'radio';
  options: { value: string; label: string }[];
  impact: string;
}

export interface ModuleData {
  modules: Module[];
  paths: Paths;
  decision_tree: DecisionTreeQuestion[];
}

// Roadmap generation types
export interface ScheduledModule extends Module {
  startWeek: number;
  endWeek: number;
  status: 'pending' | 'in-progress' | 'done';
  assignedHours: number;
}

export interface WeeklyPlan {
  week: number;
  moduleIds: string[];
  hoursAllocated: number;
  milestones: string[];
}

export interface PersonalizedRoadmap {
  modules: ScheduledModule[];
  weeklySchedule: WeeklyPlan[];
  deadline: string;
  totalHours: number;
  generatedAt: string;
  pathName: string;
  answers: DecisionAnswers;
}

// For progress tracking
export interface ModuleProgress {
  moduleId: string;
  completedKeyPoints: string[];
  currentKeyPointIndex: number;
  status: 'pending' | 'in-progress' | 'done';
  startedAt?: string;
  completedAt?: string;
}

export interface RoadmapProgress {
  roadmapId: string;
  moduleProgress: ModuleProgress[];
  overallProgress: number;
  currentWeek: number;
}