// XP & Leveling System - Level progression from 1-50
export interface XPAction {
  type: 'project-complete' | 'review' | 'help' | 'share' | 'milestone';
  baseXP: number;
  multiplier: number;
  timestamp: string;
}

export interface UserXPData {
  userId: string;
  totalXP: number;
  currentLevel: number;
  xpHistory: XPAction[];
  levelUpRewards: string[];
}

export interface LevelReward {
  level: number;
  xpRequired: number;
  reward: string;
  icon: string;
  milestone: boolean;
}

// Level thresholds - exponential scaling
const LEVEL_SCALING = 1.12; // Each level requires 12% more XP than previous
const BASE_XP = 1000;

/**
 * Calculate total XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(BASE_XP * Math.pow(LEVEL_SCALING, i - 1));
  }
  return totalXP;
}

/**
 * Calculate current level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (level < 50 && totalXP >= getXPForLevel(level + 1)) {
    level++;
  }
  return Math.min(level, 50);
}

/**
 * Calculate XP progress for current level
 */
export function calculateLevelProgress(totalXP: number): {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const levelXPDiff = nextLevelXP - currentLevelXP;
  const currentXPInLevel = totalXP - currentLevelXP;

  return {
    currentLevel,
    currentXP: currentXPInLevel,
    nextLevelXP: levelXPDiff,
    progress: levelXPDiff > 0 ? Math.min(100, (currentXPInLevel / levelXPDiff) * 100) : 100
  };
}

/**
 * Award XP for various actions
 */
export function awardXP(action: 'project-complete' | 'review' | 'help' | 'share' | 'milestone', difficulty?: string): number {
  const baseRewards: Record<string, number> = {
    'project-complete-beginner': 100,
    'project-complete-intermediate': 250,
    'project-complete-advanced': 500,
    'project-complete-default': 200,
    'review': 10,
    'help': 25,
    'share': 15,
    'milestone': 50
  };

  if (action === 'project-complete') {
    const key = `project-complete-${difficulty || 'default'}`;
    return baseRewards[key] || baseRewards['project-complete-default'];
  }

  return baseRewards[action] || 0;
}

/**
 * Get all level rewards
 */
export function getLevelRewards(): LevelReward[] {
  const rewards: LevelReward[] = [];

  for (let level = 1; level <= 50; level++) {
    const xpRequired = getXPForLevel(level);
    let reward = '';
    let icon = '';
    const milestone = level % 5 === 0 || level === 1;

    if (level === 1) {
      reward = 'Welcome to the builder community!';
      icon = '🚀';
    } else if (level === 5) {
      reward = 'Unlock Advanced Project View';
      icon = '🔍';
    } else if (level === 10) {
      reward = 'Unlock Project Templates';
      icon = '📋';
    } else if (level === 15) {
      reward = 'Unlock Mentorship Program';
      icon = '🎓';
    } else if (level === 20) {
      reward = 'Unlock Advanced Analytics';
      icon = '📊';
    } else if (level === 25) {
      reward = 'Unlock Custom Themes';
      icon = '🎨';
    } else if (level === 30) {
      reward = 'Unlock Featured Showcase';
      icon = '⭐';
    } else if (level === 35) {
      reward = 'Unlock Priority Support';
      icon = '🛟';
    } else if (level === 40) {
      reward = 'Unlock Exclusive Community Badge';
      icon = '👑';
    } else if (level === 45) {
      reward = 'Unlock Legendary Status';
      icon = '🌟';
    } else if (level === 50) {
      reward = 'You are a Legend!';
      icon = '🏆';
    } else {
      reward = `Progress to Level ${level + 1}`;
      icon = '⬆️';
    }

    rewards.push({
      level,
      xpRequired,
      reward,
      icon,
      milestone
    });
  }

  return rewards;
}

/**
 * Get rewards unlocked at a specific level
 */
export function getLevelUnlock(level: number): string {
  const unlocks: Record<number, string> = {
    5: 'advanced-project-view',
    10: 'project-templates',
    15: 'mentorship-program',
    20: 'advanced-analytics',
    25: 'custom-themes',
    30: 'featured-showcase',
    35: 'priority-support',
    40: 'exclusive-community-badge',
    45: 'legendary-status',
    50: 'ultimate-builder-status'
  };

  return unlocks[level] || '';
}

/**
 * Track XP progress history
 */
export function trackXPProgress(totalXP: number, previousXP: number): {
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
  previousLevel: number;
} {
  const xpGained = totalXP - previousXP;
  const previousLevel = calculateLevel(previousXP);
  const newLevelNum = calculateLevel(totalXP);
  const leveledUp = newLevelNum > previousLevel;

  return {
    xpGained,
    leveledUp,
    newLevel: leveledUp ? newLevelNum : undefined,
    previousLevel
  };
}

/**
 * Calculate XP multiplier based on streak
 */
export function getStreakXPMultiplier(streak: number): number {
  if (streak < 7) return 1.0;
  if (streak < 14) return 1.1;
  if (streak < 30) return 1.25;
  if (streak < 100) return 1.5;
  return 2.0; // Maximum 2x multiplier at 100+ day streak
}

/**
 * Calculate XP multiplier based on time of day
 */
export function getTimeOfDayMultiplier(hour: number): number {
  // Night owl bonus (10pm-5am)
  if (hour >= 22 || hour < 5) return 1.15;
  // Early bird bonus (5am-9am)
  if (hour >= 5 && hour < 9) return 1.1;
  // Standard hours
  return 1.0;
}

/**
 * Get XP summary statistics
 */
export function getXPSummary(totalXP: number) {
  const level = calculateLevel(totalXP);
  const { currentXP, nextLevelXP, progress } = calculateLevelProgress(totalXP);
  const levelRewards = getLevelRewards();
  const unlockedLevels = levelRewards.filter(r => r.level <= level);

  return {
    totalXP,
    currentLevel: level,
    currentLevelXP: currentXP,
    nextLevelXP,
    progressToNextLevel: progress,
    unlockedRewards: unlockedLevels.map(r => r.reward),
    nextMilestone: levelRewards.find(r => r.level > level && r.milestone)
  };
}

/**
 * Rank users by XP (for leaderboards)
 */
export function rankByXP(users: Array<{ userId: string; totalXP: number; currentLevel: number }>) {
  return users
    .sort((a, b) => b.totalXP - a.totalXP)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      percentile: Math.round(((index + 1) / users.length) * 100)
    }));
}

/**
 * Format XP display
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}
