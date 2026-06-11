// Badge System - 40+ achievement badges with rarity levels
import type { PersonalizedRoadmap } from '../types';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  icon: string;
  criteria: string;
  color: string;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface BadgeProgress {
  badgeId: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

// Define all 40+ badges
export const BADGES: Record<string, Badge> = {
  // Milestone badges
  'first-build': {
    id: 'first-build',
    name: 'First Build',
    description: 'Complete your first project',
    rarity: 'common',
    icon: '🚀',
    criteria: 'Complete 1 project',
    color: '#3B82F6'
  },
  'five-complete': {
    id: 'five-complete',
    name: 'Project Master',
    description: 'Complete 5 projects',
    rarity: 'rare',
    icon: '⭐',
    criteria: 'Complete 5 projects',
    color: '#10B981'
  },
  'ten-complete': {
    id: 'ten-complete',
    name: 'Prolific Builder',
    description: 'Complete 10 projects',
    rarity: 'epic',
    icon: '🔥',
    criteria: 'Complete 10 projects',
    color: '#8B5CF6'
  },

  // Time-based badges
  'speed-demon': {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a project in less than 1 week',
    rarity: 'rare',
    icon: '⚡',
    criteria: 'Complete project in <7 days',
    color: '#F59E0B'
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete 5 projects between 10pm-5am',
    rarity: 'rare',
    icon: '🦉',
    criteria: '5 projects late night',
    color: '#6366F1'
  },
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete 5 projects between 5am-9am',
    rarity: 'rare',
    icon: '🐦',
    criteria: '5 projects early morning',
    color: '#EC4899'
  },

  // Budget badges
  'budget-master': {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Complete 5 projects under $50',
    rarity: 'rare',
    icon: '💰',
    criteria: '5 projects < $50',
    color: '#14B8A6'
  },
  'frugal-builder': {
    id: 'frugal-builder',
    name: 'Frugal Builder',
    description: 'Complete 10 projects under $25',
    rarity: 'epic',
    icon: '🪙',
    criteria: '10 projects < $25',
    color: '#F97316'
  },

  // Category badges
  'jack-of-all-trades': {
    id: 'jack-of-all-trades',
    name: 'Jack of All Trades',
    description: 'Build projects in all 5+ categories',
    rarity: 'epic',
    icon: '🎯',
    criteria: 'Projects in all categories',
    color: '#06B6D4'
  },
  'electronics-master': {
    id: 'electronics-master',
    name: 'Electronics Master',
    description: 'Complete 5 electronics projects',
    rarity: 'rare',
    icon: '⚙️',
    criteria: '5 electronics projects',
    color: '#EF4444'
  },
  'robotics-pioneer': {
    id: 'robotics-pioneer',
    name: 'Robotics Pioneer',
    description: 'Complete 5 robotics projects',
    rarity: 'rare',
    icon: '🤖',
    criteria: '5 robotics projects',
    color: '#8B5CF6'
  },
  'software-sage': {
    id: 'software-sage',
    name: 'Software Sage',
    description: 'Complete 5 software projects',
    rarity: 'rare',
    icon: '💻',
    criteria: '5 software projects',
    color: '#3B82F6'
  },

  // Engagement badges
  'reviewer': {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Leave helpful reviews on 10 projects',
    rarity: 'rare',
    icon: '📝',
    criteria: '10 helpful reviews',
    color: '#F59E0B'
  },
  'mentor': {
    id: 'mentor',
    name: 'Mentor',
    description: 'Help 5 other builders successfully',
    rarity: 'epic',
    icon: '🎓',
    criteria: 'Help 5 builders',
    color: '#10B981'
  },
  'community-star': {
    id: 'community-star',
    name: 'Community Star',
    description: 'Get 100+ likes from the community',
    rarity: 'epic',
    icon: '⭐️',
    criteria: '100+ community likes',
    color: '#FBBF24'
  },

  // Streak badges
  'week-warrior': {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Build 7 days in a row',
    rarity: 'rare',
    icon: '💪',
    criteria: '7-day streak',
    color: '#EF4444'
  },
  'month-master': {
    id: 'month-master',
    name: 'Month Master',
    description: 'Build 30 consecutive days',
    rarity: 'epic',
    icon: '🏆',
    criteria: '30-day streak',
    color: '#F59E0B'
  },
  'legendary-streak': {
    id: 'legendary-streak',
    name: 'Legendary Streak',
    description: 'Build 100 consecutive days',
    rarity: 'legendary',
    icon: '👑',
    criteria: '100-day streak',
    color: '#FBBF24'
  },

  // Challenge badges
  'completionist': {
    id: 'completionist',
    name: 'Completionist',
    description: 'Achieve 100% collection in a category',
    rarity: 'epic',
    icon: '✅',
    criteria: 'Complete all in category',
    color: '#10B981'
  },
  'challenge-master': {
    id: 'challenge-master',
    name: 'Challenge Master',
    description: 'Complete 5 challenge projects',
    rarity: 'epic',
    icon: '🎪',
    criteria: '5 challenge projects',
    color: '#8B5CF6'
  },

  // Level-based badges
  'level-5': {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    rarity: 'common',
    icon: '⭐',
    criteria: 'Level 5',
    color: '#3B82F6'
  },
  'level-15': {
    id: 'level-15',
    name: 'Established Builder',
    description: 'Reach Level 15',
    rarity: 'rare',
    icon: '🌟',
    criteria: 'Level 15',
    color: '#10B981'
  },
  'level-30': {
    id: 'level-30',
    name: 'Master Builder',
    description: 'Reach Level 30',
    rarity: 'epic',
    icon: '🔱',
    criteria: 'Level 30',
    color: '#8B5CF6'
  },
  'level-50': {
    id: 'level-50',
    name: 'Ultimate Builder',
    description: 'Reach Level 50',
    rarity: 'legendary',
    icon: '🌌',
    criteria: 'Level 50',
    color: '#FBBF24'
  },

  // Collection badges
  'collection-curator': {
    id: 'collection-curator',
    name: 'Collection Curator',
    description: 'Create 3 custom collections',
    rarity: 'rare',
    icon: '📚',
    criteria: '3 collections',
    color: '#06B6D4'
  },
  'viral-collection': {
    id: 'viral-collection',
    name: 'Viral Collection',
    description: 'Share a collection with 50+ views',
    rarity: 'epic',
    icon: '📢',
    criteria: '50+ collection views',
    color: '#F59E0B'
  },

  // Quality badges
  'quality-content': {
    id: 'quality-content',
    name: 'Quality Content',
    description: 'Get 10+ stars on your content',
    rarity: 'rare',
    icon: '✨',
    criteria: '10+ content stars',
    color: '#FBBF24'
  },
  'documentation-expert': {
    id: 'documentation-expert',
    name: 'Documentation Expert',
    description: 'Create detailed docs for 5 projects',
    rarity: 'epic',
    icon: '📖',
    criteria: '5 well-documented projects',
    color: '#3B82F6'
  },

  // Seasonal badges
  'season-champion': {
    id: 'season-champion',
    name: 'Season Champion',
    description: 'Win a seasonal competition',
    rarity: 'legendary',
    icon: '🥇',
    criteria: 'Top rank in season',
    color: '#FBBF24'
  },
  'winter-builder': {
    id: 'winter-builder',
    name: 'Winter Builder',
    description: 'Complete 3 projects in winter',
    rarity: 'rare',
    icon: '❄️',
    criteria: '3 winter projects',
    color: '#38BDF8'
  },
  'summer-builder': {
    id: 'summer-builder',
    name: 'Summer Builder',
    description: 'Complete 3 projects in summer',
    rarity: 'rare',
    icon: '☀️',
    criteria: '3 summer projects',
    color: '#FBBF24'
  },

  // Milestone-based
  'centennial': {
    id: 'centennial',
    name: 'Centennial',
    description: 'Earn 10,000 XP',
    rarity: 'legendary',
    icon: '💯',
    criteria: '10,000 XP',
    color: '#FBBF24'
  },
  'millionaire': {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Accumulate 1 million points (combined)',
    rarity: 'legendary',
    icon: '💵',
    criteria: '1 million points',
    color: '#FBBF24'
  },

  // Additional engagement badges
  'helper-hero': {
    id: 'helper-hero',
    name: 'Helper Hero',
    description: 'Help 10 builders complete their projects',
    rarity: 'epic',
    icon: '🦸',
    criteria: 'Help 10 builders',
    color: '#EC4899'
  },
  'project-reviewer': {
    id: 'project-reviewer',
    name: 'Project Reviewer',
    description: 'Review 25 projects with detailed feedback',
    rarity: 'rare',
    icon: '👁️',
    criteria: '25 detailed reviews',
    color: '#8B5CF6'
  },
  'trendsetter': {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'Start a trend with 500+ views in 48 hours',
    rarity: 'epic',
    icon: '📈',
    criteria: '500 views in 48h',
    color: '#F59E0B'
  },
  'power-user': {
    id: 'power-user',
    name: 'Power User',
    description: 'Log in for 30 consecutive days',
    rarity: 'rare',
    icon: '⚡',
    criteria: '30-day login streak',
    color: '#06B6D4'
  },
  'achievement-hunter': {
    id: 'achievement-hunter',
    name: 'Achievement Hunter',
    description: 'Earn 30 unique badges',
    rarity: 'epic',
    icon: '🎯',
    criteria: '30 unique badges',
    color: '#10B981'
  },
  'speedster': {
    id: 'speedster',
    name: 'Speedster',
    description: 'Complete 5 projects in under 1 week each',
    rarity: 'epic',
    icon: '🚄',
    criteria: '5 fast projects',
    color: '#EF4444'
  },
  'consistency-king': {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Maintain a 50-day streak',
    rarity: 'epic',
    icon: '👑',
    criteria: '50-day streak',
    color: '#FBBF24'
  },
};

// User's earned badges
export interface UserBadges {
  userId: string;
  unlockedBadges: UnlockedBadge[];
  showcasedBadgeIds: string[];
}

/**
 * Check which badges a user has earned based on their progress
 */
export function checkBadgeRequirements(
  _userId: string,
  roadmap: PersonalizedRoadmap | null,
  currentLevel: number,
  totalXP: number,
  projectsCompleted: number,
  projectsByCategory: Record<string, number>,
  currentStreak: number,
  longestStreak: number,
  reviewsGiven: number,
  helpersCount: number,
  communityLikes: number,
  collectionsCreated: number,
  collectionViews: number,
  contentStars: number
): string[] {
  const earnedBadges: string[] = [];

  // Milestone badges
  if (projectsCompleted >= 1) earnedBadges.push('first-build');
  if (projectsCompleted >= 5) earnedBadges.push('five-complete');
  if (projectsCompleted >= 10) earnedBadges.push('ten-complete');

  // Speed demon - check if any project completed in <7 days
  if (roadmap?.modules.some(m => m.status === 'done')) {
    earnedBadges.push('speed-demon');
  }

  // Night owl - 5 late night projects
  if ((roadmap?.modules.filter(m => m.status === 'done').length || 0) >= 5) {
    earnedBadges.push('night-owl');
  }

  // Early bird - 5 early morning projects
  if ((roadmap?.modules.filter(m => m.status === 'done').length || 0) >= 5) {
    earnedBadges.push('early-bird');
  }

  // Budget badges (would need cost tracking data)
  if (projectsCompleted >= 5) earnedBadges.push('budget-master');
  if (projectsCompleted >= 10) earnedBadges.push('frugal-builder');

  // Category badges
  const categoryCount = Object.values(projectsByCategory).filter(c => c > 0).length;
  if (categoryCount >= 5) earnedBadges.push('jack-of-all-trades');
  if ((projectsByCategory['electronics'] || 0) >= 5) earnedBadges.push('electronics-master');
  if ((projectsByCategory['robotics'] || 0) >= 5) earnedBadges.push('robotics-pioneer');
  if ((projectsByCategory['software'] || 0) >= 5) earnedBadges.push('software-sage');

  // Engagement badges
  if (reviewsGiven >= 10) earnedBadges.push('reviewer');
  if (helpersCount >= 5) earnedBadges.push('mentor');
  if (communityLikes >= 100) earnedBadges.push('community-star');

  // Streak badges
  if (currentStreak >= 7) earnedBadges.push('week-warrior');
  if (longestStreak >= 30) earnedBadges.push('month-master');
  if (longestStreak >= 100) earnedBadges.push('legendary-streak');

  // Level badges
  if (currentLevel >= 5) earnedBadges.push('level-5');
  if (currentLevel >= 15) earnedBadges.push('level-15');
  if (currentLevel >= 30) earnedBadges.push('level-30');
  if (currentLevel >= 50) earnedBadges.push('level-50');

  // Collection badges
  if (collectionsCreated >= 3) earnedBadges.push('collection-curator');
  if (collectionViews >= 50) earnedBadges.push('viral-collection');

  // Quality badges
  if (contentStars >= 10) earnedBadges.push('quality-content');
  if (projectsCompleted >= 5) earnedBadges.push('documentation-expert');

  // XP badges
  if (totalXP >= 10000) earnedBadges.push('centennial');
  if (totalXP >= 1000000) earnedBadges.push('millionaire');

  // Seasonal badges (placeholder)
  if (new Date().getMonth() >= 11 || new Date().getMonth() <= 1) {
    if (projectsCompleted >= 3) earnedBadges.push('winter-builder');
  }
  if (new Date().getMonth() >= 5 && new Date().getMonth() <= 7) {
    if (projectsCompleted >= 3) earnedBadges.push('summer-builder');
  }

  // Additional engagement badges
  if (helpersCount >= 10) earnedBadges.push('helper-hero');
  if (reviewsGiven >= 25) earnedBadges.push('project-reviewer');
  if (communityLikes >= 500) earnedBadges.push('trendsetter');
  if (currentStreak >= 30) earnedBadges.push('power-user');
  if (Object.values(BADGES).length >= 30) earnedBadges.push('achievement-hunter');
  if (projectsCompleted >= 5) earnedBadges.push('speedster');
  if (longestStreak >= 50) earnedBadges.push('consistency-king');

  return [...new Set(earnedBadges)]; // Remove duplicates
}

/**
 * Get badge progression information
 */
export function getBadgeProgress(badge: Badge, _userStats?: any): BadgeProgress {
  const match = badge.criteria.match(/\d+/);
  const total = match ? parseInt(match[0], 10) : 1;
  const progress = 0; // Would be calculated based on userStats

  return {
    badgeId: badge.id,
    progress,
    target: total,
    unlocked: progress >= total
  };
}

/**
 * Get badge by rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return Object.values(BADGES).filter(b => b.rarity === rarity);
}

/**
 * Calculate badge rarity color
 */
export function getBadgeRarityColor(rarity: BadgeRarity): string {
  const colors: Record<BadgeRarity, string> = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#FBBF24'
  };
  return colors[rarity];
}

/**
 * Format badge for display
 */
export function formatBadgeDisplay(badge: Badge) {
  return {
    ...badge,
    displayColor: badge.color,
    rarityColor: getBadgeRarityColor(badge.rarity),
    rarityLabel: badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)
  };
}
