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

// User and Admin types
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  signupDate: string;
  lastActive: string;
  banned: boolean;
}

// Content Creation & Management Types
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type ContentType = 'tutorial' | 'documentation' | 'guide' | 'resource';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  codeBlocks?: CodeBlock[];
  images?: string[];
  videos?: string[];
  checkpoint?: Quiz;
}

export interface CodeBlock {
  id: string;
  code: string;
  language: string;
  filename?: string;
}

export interface Quiz {
  id: string;
  question: string;
  options: { id: string; text: string; correct: boolean }[];
  explanation: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  tags: string[];
  difficulty: TechLevel;
  estimatedMinutes: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seo: SEOSettings;
  status: ContentStatus;
  views: number;
  engagement: number;
  version: number;
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  status: ContentStatus;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledPublishAt?: string;
  tags: string[];
  views: number;
  engagement: number;
  version: number;
  changelog: VersionEntry[];
}

export interface VersionEntry {
  version: number;
  updatedAt: string;
  changes: string;
  authorId: string;
}

export interface Contribution {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  feedback?: string;
}

export interface Contributor {
  id: string;
  userId: string;
  username: string;
  bio: string;
  contributions: number;
  points: number;
  badges: string[];
  featured: boolean;
  joinedAt: string;
}

export interface ContentAnalytics {
  contentId: string;
  views: number;
  engagement: number;
  averageTimeSpent: number;
  completionRate: number;
  likes: number;
  shares: number;
  comments: number;
}