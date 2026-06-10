// Community Content Engine
// Manages user-contributed content and contributor rewards

import { Contribution, Contributor } from '../types';

interface ContentReward {
  points: number;
  badge?: string;
}

// Point system
const REWARD_SYSTEM: Record<string, number> = {
  contribution_submitted: 10,
  contribution_approved: 50,
  contribution_featured: 100,
  monthly_contributor: 25,
  milestone_10_contributions: 150,
  milestone_50_contributions: 500,
};

const BADGE_SYSTEM: Record<string, string> = {
  first_contribution: 'First Steps',
  quality_contributor: 'Quality Creator',
  featured_contributor: 'Featured',
  power_contributor: 'Power Contributor',
};

// In-memory storage
const contributionsDb = new Map<string, Contribution>();
const contributorsDb = new Map<string, Contributor>();
const leaderboardDb = new Map<string, { userId: string; points: number; contributions: number }>();

/**
 * Submit content for community review
 */
export const submitContent = (
  title: string,
  content: string,
  type: 'tutorial' | 'documentation' | 'guide' | 'resource',
  userId: string
): Contribution => {
  const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const contribution: Contribution = {
    id: contributionId,
    title,
    content,
    type,
    submittedBy: userId,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  contributionsDb.set(contributionId, contribution);

  // Award points for submission
  awardPoints(userId, REWARD_SYSTEM.contribution_submitted, 'Contribution submitted');

  return contribution;
};

/**
 * Approve contributed content
 */
export const approveContent = (
  contentId: string,
  reviewedBy: string
): Contribution | null => {
  const contribution = contributionsDb.get(contentId);
  if (!contribution) return null;

  contribution.status = 'approved';
  contribution.reviewedBy = reviewedBy;
  contribution.reviewedAt = new Date().toISOString();

  contributionsDb.set(contentId, contribution);

  // Award points for approval
  awardPoints(contribution.submittedBy, REWARD_SYSTEM.contribution_approved, 'Content approved');

  return contribution;
};

/**
 * Reject contributed content
 */
export const rejectContent = (
  contentId: string,
  reviewedBy: string,
  feedback: string
): Contribution | null => {
  const contribution = contributionsDb.get(contentId);
  if (!contribution) return null;

  contribution.status = 'rejected';
  contribution.reviewedBy = reviewedBy;
  contribution.reviewedAt = new Date().toISOString();
  contribution.feedback = feedback;

  contributionsDb.set(contentId, contribution);

  return contribution;
};

/**
 * Feature content (spotlight)
 */
export const featureContent = (contentId: string): Contribution | null => {
  const contribution = contributionsDb.get(contentId);
  if (!contribution || contribution.status !== 'approved') return null;

  // Award bonus points
  awardPoints(contribution.submittedBy, REWARD_SYSTEM.contribution_featured, 'Content featured');

  return contribution;
};

/**
 * Get pending contributions (review queue)
 */
export const getPendingContributions = (): Contribution[] => {
  return Array.from(contributionsDb.values()).filter((c) => c.status === 'pending');
};

/**
 * Get approved contributions
 */
export const getApprovedContributions = (): Contribution[] => {
  return Array.from(contributionsDb.values()).filter((c) => c.status === 'approved');
};

/**
 * Get contributions by user
 */
export const getContributionsByUser = (userId: string): Contribution[] => {
  return Array.from(contributionsDb.values()).filter((c) => c.submittedBy === userId);
};

/**
 * Get or create contributor profile
 */
const getOrCreateContributor = (userId: string): Contributor => {
  let contributor = contributorsDb.get(userId);

  if (!contributor) {
    contributor = {
      id: `contributor_${userId}`,
      userId,
      username: `User_${userId.substring(0, 8)}`,
      bio: '',
      contributions: 0,
      points: 0,
      badges: [],
      featured: false,
      joinedAt: new Date().toISOString(),
    };
    contributorsDb.set(userId, contributor);
  }

  return contributor;
};

/**
 * Award points to a contributor
 */
const awardPoints = (userId: string, points: number, reason?: string): void => {
  const contributor = getOrCreateContributor(userId);
  contributor.points += points;

  // Update leaderboard
  leaderboardDb.set(userId, {
    userId,
    points: contributor.points,
    contributions: contributor.contributions,
  });

  // Check for milestones
  checkMilestones(userId, contributor);
};

/**
 * Award badge to contributor
 */
const awardBadge = (userId: string, badgeKey: string): void => {
  const contributor = getOrCreateContributor(userId);
  const badge = BADGE_SYSTEM[badgeKey];

  if (badge && !contributor.badges.includes(badge)) {
    contributor.badges.push(badge);
    contributorsDb.set(userId, contributor);
  }
};

/**
 * Check and award milestone rewards
 */
const checkMilestones = (userId: string, contributor: Contributor): void => {
  if (contributor.contributions === 10) {
    awardPoints(userId, REWARD_SYSTEM.milestone_10_contributions, 'Milestone: 10 contributions');
    awardBadge(userId, 'power_contributor');
  }

  if (contributor.contributions === 50) {
    awardPoints(userId, REWARD_SYSTEM.milestone_50_contributions, 'Milestone: 50 contributions');
    awardBadge(userId, 'quality_contributor');
  }
};

/**
 * Get contributor profile
 */
export const getContributor = (userId: string): Contributor | null => {
  return contributorsDb.get(userId) || null;
};

/**
 * Update contributor profile
 */
export const updateContributorProfile = (
  userId: string,
  updates: Partial<Contributor>
): Contributor | null => {
  const contributor = getOrCreateContributor(userId);

  const updated: Contributor = {
    ...contributor,
    ...updates,
  };

  contributorsDb.set(userId, updated);
  return updated;
};

/**
 * Get leaderboard (top contributors)
 */
export const getLeaderboard = (limit: number = 10): Contributor[] => {
  return Array.from(contributorsDb.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
};

/**
 * Get featured contributors
 */
export const getFeaturedContributors = (): Contributor[] => {
  return Array.from(contributorsDb.values())
    .filter((c) => c.featured)
    .sort((a, b) => b.points - a.points);
};

/**
 * Feature a contributor (admin action)
 */
export const featureContributor = (userId: string): Contributor | null => {
  const contributor = getOrCreateContributor(userId);
  contributor.featured = true;
  awardBadge(userId, 'featured_contributor');
  contributorsDb.set(userId, contributor);
  return contributor;
};

/**
 * Unfeature a contributor
 */
export const unfeatureContributor = (userId: string): Contributor | null => {
  const contributor = getOrCreateContributor(userId);
  contributor.featured = false;
  contributorsDb.set(userId, contributor);
  return contributor;
};

/**
 * Get contributor stats
 */
export const getContributorStats = (userId: string): {
  points: number;
  contributions: number;
  approvedContributions: number;
  badges: string[];
  rank?: number;
} | null => {
  const contributor = getOrCreateContributor(userId);
  const approvedContributions = getContributionsByUser(userId).filter(
    (c) => c.status === 'approved'
  ).length;

  const leaderboard = Array.from(contributorsDb.values())
    .sort((a, b) => b.points - a.points);
  const rank = leaderboard.findIndex((c) => c.userId === userId) + 1;

  return {
    points: contributor.points,
    contributions: contributor.contributions,
    approvedContributions,
    badges: contributor.badges,
    rank: rank > 0 ? rank : undefined,
  };
};

/**
 * Get community statistics
 */
export const getCommunityStats = (): {
  totalContributors: number;
  totalContributions: number;
  approvedContributions: number;
  pendingReview: number;
  topContributors: Contributor[];
} => {
  const allContributors = Array.from(contributorsDb.values());
  const allContributions = Array.from(contributionsDb.values());
  const approved = allContributions.filter((c) => c.status === 'approved').length;
  const pending = allContributions.filter((c) => c.status === 'pending').length;

  const topContributors = allContributors
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return {
    totalContributors: allContributors.length,
    totalContributions: allContributions.length,
    approvedContributions: approved,
    pendingReview: pending,
    topContributors,
  };
};

/**
 * Search contributions
 */
export const searchContributions = (
  query: string,
  filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: string;
    author?: string;
  }
): Contribution[] => {
  const lowerQuery = query.toLowerCase();

  return Array.from(contributionsDb.values()).filter((contribution) => {
    const matchesQuery =
      contribution.title.toLowerCase().includes(lowerQuery) ||
      contribution.content.toLowerCase().includes(lowerQuery);

    if (!matchesQuery) return false;

    if (filters?.status && contribution.status !== filters.status) return false;
    if (filters?.type && contribution.type !== filters.type) return false;
    if (filters?.author && contribution.submittedBy !== filters.author) return false;

    return true;
  });
};

/**
 * Get contribution by ID
 */
export const getContribution = (contentId: string): Contribution | null => {
  return contributionsDb.get(contentId) || null;
};
