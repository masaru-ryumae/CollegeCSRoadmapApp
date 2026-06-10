import type { PersonalizedRoadmap, DecisionAnswers } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  skills: string[];
  interests: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  createdAt: Date;
}

export interface SimilarUser {
  profile: UserProfile;
  similarityScore: number;
  commonSkills: string[];
  commonInterests: string[];
}

export interface ProjectMatch {
  title: string;
  description: string;
  userId: string;
  userName: string;
  technologies: string[];
  difficulty: string;
  matchScore: number;
  followers: number;
}

export interface UserInfluencer {
  profile: UserProfile;
  followers: number;
  projects: number;
  avgProjectScore: number;
  badges: string[];
}

// Find similar users based on interests and skills
export function findSimilarUsers(
  userId: string,
  limit: number = 5
): SimilarUser[] {
  const currentUser = getUserProfile(userId);
  if (!currentUser) return [];

  const allUsers = getAllUserProfiles();
  const similarities: SimilarUser[] = [];

  allUsers.forEach(user => {
    if (user.id === userId || !user.isPublic) return;

    const score = calculateUserSimilarity(currentUser, user);
    if (score > 0) {
      const commonSkills = getCommonItems(currentUser.skills, user.skills);
      const commonInterests = getCommonItems(currentUser.interests, user.interests);

      similarities.push({
        profile: user,
        similarityScore: score,
        commonSkills,
        commonInterests
      });
    }
  });

  return similarities
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

// Get projects from similar users
export function getSimilarUserProjects(
  userId: string,
  limit: number = 10
): ProjectMatch[] {
  const similarUsers = findSimilarUsers(userId, 20);
  const currentUser = getUserProfile(userId);

  if (!currentUser) return [];

  const projects: ProjectMatch[] = [];

  similarUsers.forEach(({ profile }) => {
    const userProjects = getUserProjects(profile.id);
    userProjects.forEach(project => {
      const matchScore = scoreProjectMatch(project, currentUser);
      if (matchScore > 0.3) {
        projects.push({
          title: project.title,
          description: project.description,
          userId: profile.id,
          userName: profile.name,
          technologies: project.technologies || [],
          difficulty: project.difficulty || 'intermediate',
          matchScore,
          followers: project.followers || 0
        });
      }
    });
  });

  return projects
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

// Score how well a project matches a user's profile
export function scoreProjectMatch(
  project: any,
  userProfile: UserProfile
): number {
  let score = 0;

  // Technology match
  const projectTechs = project.technologies || [];
  const techMatch = projectTechs.filter((tech: string) =>
    userProfile.skills.some(skill => skill.toLowerCase().includes(tech.toLowerCase()))
  ).length;
  score += (techMatch / Math.max(projectTechs.length, 1)) * 0.4;

  // Interest alignment
  const projectKeywords = [
    ...(project.title || '').toLowerCase().split(' '),
    ...(project.description || '').toLowerCase().split(' ')
  ];
  const interestMatch = userProfile.interests.filter(interest =>
    projectKeywords.some(keyword => keyword.includes(interest.toLowerCase()))
  ).length;
  score += (interestMatch / Math.max(userProfile.interests.length, 1)) * 0.35;

  // Difficulty alignment
  const difficultyMap: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3
  };
  const userLevel = difficultyMap[userProfile.experience] || 2;
  const projectLevel = difficultyMap[project.difficulty] || 2;
  const difficultyDiff = Math.abs(userLevel - projectLevel);
  const difficultyScore = Math.max(0, 1 - difficultyDiff * 0.25);
  score += difficultyScore * 0.25;

  return Math.min(score, 1);
}

// Get influential builders
export function getUserInfluencers(
  userId: string,
  limit: number = 5
): UserInfluencer[] {
  const influencers: UserInfluencer[] = [];
  const allUsers = getAllUserProfiles();

  allUsers.forEach(user => {
    if (user.id === userId || !user.isPublic) return;

    const projects = getUserProjects(user.id);
    const followers = getUserFollowers(user.id);
    const avgScore = projects.reduce((sum, p) => sum + (p.score || 0), 0) / Math.max(projects.length, 1);
    const badges = getUserBadges(user.id);

    influencers.push({
      profile: user,
      followers,
      projects: projects.length,
      avgProjectScore: avgScore,
      badges
    });
  });

  return influencers
    .sort((a, b) => {
      const aScore = a.followers * 0.4 + a.avgProjectScore * 100 * 0.6;
      const bScore = b.followers * 0.4 + b.avgProjectScore * 100 * 0.6;
      return bScore - aScore;
    })
    .slice(0, limit);
}

// Follow a user
export function followUser(currentUserId: string, targetUserId: string): boolean {
  const follows = JSON.parse(localStorage.getItem('user-follows') || '{}');
  if (!follows[currentUserId]) {
    follows[currentUserId] = [];
  }

  if (!follows[currentUserId].includes(targetUserId)) {
    follows[currentUserId].push(targetUserId);
    localStorage.setItem('user-follows', JSON.stringify(follows));
    return true;
  }

  return false;
}

// Unfollow a user
export function unfollowUser(currentUserId: string, targetUserId: string): boolean {
  const follows = JSON.parse(localStorage.getItem('user-follows') || '{}');
  if (follows[currentUserId]) {
    const index = follows[currentUserId].indexOf(targetUserId);
    if (index > -1) {
      follows[currentUserId].splice(index, 1);
      localStorage.setItem('user-follows', JSON.stringify(follows));
      return true;
    }
  }
  return false;
}

// Check if user is following
export function isFollowing(currentUserId: string, targetUserId: string): boolean {
  const follows = JSON.parse(localStorage.getItem('user-follows') || '{}');
  return follows[currentUserId]?.includes(targetUserId) || false;
}

// Get user's followers (people following them)
export function getFollowingList(userId: string): string[] {
  const follows = JSON.parse(localStorage.getItem('user-follows') || '{}');
  return follows[userId] || [];
}

// Helper functions
function calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
  let score = 0;

  // Skill similarity
  const commonSkills = getCommonItems(user1.skills, user2.skills);
  const skillScore = commonSkills.length / Math.max(
    Math.max(user1.skills.length, user2.skills.length),
    1
  );
  score += skillScore * 0.5;

  // Interest similarity
  const commonInterests = getCommonItems(user1.interests, user2.interests);
  const interestScore = commonInterests.length / Math.max(
    Math.max(user1.interests.length, user2.interests.length),
    1
  );
  score += interestScore * 0.3;

  // Experience level similarity
  const expMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
  const expDiff = Math.abs(expMap[user1.experience] - expMap[user2.experience]);
  const expScore = Math.max(0, 1 - expDiff * 0.33);
  score += expScore * 0.2;

  return score;
}

function getCommonItems(arr1: string[], arr2: string[]): string[] {
  return arr1.filter(item =>
    arr2.some(item2 => item.toLowerCase() === item2.toLowerCase())
  );
}

function getUserProfile(userId: string): UserProfile | null {
  const profiles = JSON.parse(localStorage.getItem('user-profiles') || '{}');
  const profile = profiles[userId];
  if (!profile) return null;

  return {
    ...profile,
    createdAt: new Date(profile.createdAt)
  };
}

function getAllUserProfiles(): UserProfile[] {
  const profiles = JSON.parse(localStorage.getItem('user-profiles') || '{}');
  return Object.values(profiles).map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt)
  }));
}

function getUserProjects(userId: string): any[] {
  const projects = JSON.parse(localStorage.getItem('user-projects') || '{}');
  return projects[userId] || [];
}

function getUserFollowers(userId: string): number {
  const follows = JSON.parse(localStorage.getItem('user-follows') || '{}');
  let count = 0;
  Object.values(follows).forEach((following: any) => {
    if (Array.isArray(following) && following.includes(userId)) {
      count++;
    }
  });
  return count;
}

function getUserBadges(userId: string): string[] {
  const badges = JSON.parse(localStorage.getItem('user-badges') || '{}');
  return badges[userId] || [];
}

// Create or update user profile
export function saveUserProfile(profile: UserProfile): void {
  const profiles = JSON.parse(localStorage.getItem('user-profiles') || '{}');
  profiles[profile.id] = {
    ...profile,
    createdAt: profile.createdAt.toISOString()
  };
  localStorage.setItem('user-profiles', JSON.stringify(profiles));
}

// Get user's own projects
export function saveUserProject(userId: string, project: any): void {
  const projects = JSON.parse(localStorage.getItem('user-projects') || '{}');
  if (!projects[userId]) {
    projects[userId] = [];
  }
  projects[userId].push({
    ...project,
    id: project.id || generateId(),
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('user-projects', JSON.stringify(projects));
}

function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}
