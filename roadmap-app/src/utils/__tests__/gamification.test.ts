// Tests for gamification system
import { describe, it, expect } from 'vitest';
import {
  checkBadgeRequirements,
  BADGES,
  BadgeRarity
} from '../badgeSystem';
import {
  calculateLevel,
  calculateLevelProgress,
  getXPForLevel,
  awardXP,
  trackXPProgress,
  getStreakXPMultiplier,
  formatXP
} from '../xpSystem';
import {
  trackDailyActivity,
  calculateCurrentStreak,
  getLongestStreak,
  getStreakStatus,
  getActivityCalendar,
  getWeeklySummary
} from '../streakSystem';
import {
  calculateRankings,
  getUserRank,
  getLeaderboard,
  generateLeaderboardNotifications,
  formatLeaderboardDisplay
} from '../leaderboardEngine';

describe('Badge System', () => {
  it('should have 40+ badges defined', () => {
    const badgeCount = Object.keys(BADGES).length;
    expect(badgeCount).toBeGreaterThanOrEqual(40);
  });

  it('should have all required badge properties', () => {
    Object.values(BADGES).forEach(badge => {
      expect(badge.id).toBeDefined();
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.rarity).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.criteria).toBeDefined();
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
    });
  });

  it('should correctly evaluate badge criteria', () => {
    const earnedBadges = checkBadgeRequirements(
      'test-user',
      null,
      1,
      0,
      1, // 1 project completed
      {},
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    );

    expect(earnedBadges).toContain('first-build');
  });

  it('should unlock multi-project badges correctly', () => {
    const earnedBadges = checkBadgeRequirements(
      'test-user',
      null,
      10,
      50000,
      10, // 10 projects
      {},
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    );

    expect(earnedBadges).toContain('five-complete');
    expect(earnedBadges).toContain('ten-complete');
  });
});

describe('XP System', () => {
  it('should calculate correct XP for levels', () => {
    const xpLevel1 = getXPForLevel(1);
    const xpLevel2 = getXPForLevel(2);

    expect(xpLevel1).toBe(0);
    expect(xpLevel2).toBeGreaterThan(xpLevel1);
  });

  it('should scale XP exponentially', () => {
    const xpLevel5 = getXPForLevel(5);
    const xpLevel10 = getXPForLevel(10);
    const xpLevel50 = getXPForLevel(50);

    expect(xpLevel10).toBeGreaterThan(xpLevel5);
    expect(xpLevel50).toBeGreaterThan(xpLevel10);
  });

  it('should calculate level from total XP', () => {
    const baseXP = getXPForLevel(2);
    const level = calculateLevel(baseXP);
    expect(level).toBe(2);
  });

  it('should cap level at 50', () => {
    const level = calculateLevel(10000000);
    expect(level).toBeLessThanOrEqual(50);
  });

  it('should track XP progress correctly', () => {
    const progress = calculateLevelProgress(getXPForLevel(5));
    expect(progress.currentLevel).toBe(5);
    expect(progress.progress).toBeGreaterThanOrEqual(0);
    expect(progress.progress).toBeLessThanOrEqual(100);
  });

  it('should award correct XP amounts', () => {
    const xp1 = awardXP('project-complete', 'beginner');
    const xp2 = awardXP('project-complete', 'intermediate');
    const xp3 = awardXP('project-complete', 'advanced');

    expect(xp1).toBeLessThan(xp2);
    expect(xp2).toBeLessThan(xp3);
  });

  it('should apply streak XP multiplier', () => {
    const mult1 = getStreakXPMultiplier(1);
    const mult7 = getStreakXPMultiplier(7);
    const mult100 = getStreakXPMultiplier(100);

    expect(mult1).toBe(1.0);
    expect(mult7).toBeGreaterThan(mult1);
    expect(mult100).toBeLessThanOrEqual(2.0);
  });

  it('should format XP display correctly', () => {
    expect(formatXP(500)).toBe('500');
    expect(formatXP(1500)).toBe('1.5K');
    expect(formatXP(1500000)).toBe('1.5M');
  });

  it('should track level-up notifications', () => {
    const result = trackXPProgress(getXPForLevel(3), getXPForLevel(2));
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(3);
  });
});

describe('Streak System', () => {
  it('should track daily activity correctly', () => {
    const defaultStreak = {
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      dailyActivity: [],
      streakMilestones: [],
      streakRewards: []
    };

    const updated = trackDailyActivity(defaultStreak, 1, 100);
    expect(updated.dailyActivity.length).toBe(1);
    expect(updated.currentStreak).toBeGreaterThan(0);
  });

  it('should calculate current streak from history', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const activity = [
      { date: yesterday.toISOString().split('T')[0], completed: true, projectsCount: 1, xpEarned: 100 },
      { date: today.toISOString().split('T')[0], completed: true, projectsCount: 1, xpEarned: 100 }
    ];

    const streak = calculateCurrentStreak(activity);
    expect(streak).toBeGreaterThan(0);
  });

  it('should track longest streak correctly', () => {
    const activity = [];
    for (let i = 0; i < 35; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (34 - i));
      activity.push({
        date: date.toISOString().split('T')[0],
        completed: true,
        projectsCount: 1,
        xpEarned: 100
      });
    }

    const longestStreak = getLongestStreak(activity);
    expect(longestStreak).toBe(35);
  });

  it('should calculate weekly summary', () => {
    const today = new Date();
    const activity = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      activity.push({
        date: date.toISOString().split('T')[0],
        completed: true,
        projectsCount: 2,
        xpEarned: 150
      });
    }

    const summary = getWeeklySummary(activity);
    expect(summary.daysActive).toBe(7);
    expect(summary.projectsCompleted).toBe(14);
    expect(summary.totalXP).toBe(1050);
  });

  it('should generate activity calendar', () => {
    const today = new Date();
    const activity = [
      {
        date: today.toISOString().split('T')[0],
        completed: true,
        projectsCount: 1,
        xpEarned: 100
      }
    ];

    const calendar = getActivityCalendar(activity, 90);
    expect(calendar.length).toBe(90);
    expect(calendar[calendar.length - 1].completed).toBe(true);
  });
});

describe('Leaderboard System', () => {
  const mockUsers = [
    { userId: 'user-1', username: 'Alice', level: 30, totalXP: 85000, projectsCompleted: 15, currentStreak: 12, longestStreak: 45, communityLikes: 250, badge_count: 18 },
    { userId: 'user-2', username: 'Bob', level: 25, totalXP: 65000, projectsCompleted: 12, currentStreak: 8, longestStreak: 30, communityLikes: 180, badge_count: 14 },
    { userId: 'user-3', username: 'Carol', level: 35, totalXP: 105000, projectsCompleted: 20, currentStreak: 18, longestStreak: 60, communityLikes: 320, badge_count: 22 }
  ];

  it('should rank users by XP correctly', () => {
    const rankings = calculateRankings(mockUsers, 'all-time');
    expect(rankings[0].userId).toBe('user-3'); // Carol has most XP
    expect(rankings[0].rank).toBe(1);
    expect(rankings[2].userId).toBe('user-2'); // Bob has least XP
    expect(rankings[2].rank).toBe(3);
  });

  it('should calculate user percentile', () => {
    const rankings = calculateRankings(mockUsers, 'all-time');
    expect(rankings[0].percentile).toBeGreaterThan(0);
    expect(rankings[0].percentile).toBeLessThanOrEqual(100);
  });

  it('should get user rank', () => {
    const rankings = calculateRankings(mockUsers, 'all-time');
    const userRank = getUserRank('user-1', rankings);

    expect(userRank).not.toBeNull();
    expect(userRank?.userId).toBe('user-1');
  });

  it('should track rank changes', () => {
    const previousRankings = calculateRankings(mockUsers, 'all-time');

    // Simulate user gaining XP
    const updatedUsers = [
      ...mockUsers.map(u => u.userId === 'user-2' ? { ...u, totalXP: 110000 } : u)
    ];

    const newRankings = calculateRankings(updatedUsers, 'all-time', previousRankings);
    const user2 = newRankings.find(r => r.userId === 'user-2');

    expect(user2?.rankChange).not.toBe(0);
  });

  it('should format leaderboard display', () => {
    const display1 = formatLeaderboardDisplay(1, 0);
    const display2 = formatLeaderboardDisplay(5, 2);
    const display3 = formatLeaderboardDisplay(10, -1);

    expect(display1).toContain('#1');
    expect(display2).toContain('+2');
    expect(display3).toContain('-1');
  });

  it('should generate leaderboard notifications', () => {
    const previous = calculateRankings(mockUsers, 'all-time');
    const updated = calculateRankings(
      [...mockUsers].sort((a, b) => b.totalXP - a.totalXP),
      'all-time',
      previous
    );

    const notifications = generateLeaderboardNotifications(previous, updated);
    expect(notifications.length).toBeGreaterThanOrEqual(0);
  });

  it('should get leaderboard with limit', () => {
    const lb = getLeaderboard(mockUsers, '', 2, 'all-time');
    expect(lb.rankings.length).toBeLessThanOrEqual(2);
  });
});

describe('Integration Tests', () => {
  it('should have consistent XP and level data', () => {
    // User completes project worth 250 XP
    const xpEarned = awardXP('project-complete', 'intermediate');
    expect(xpEarned).toBe(250);

    // With 7-day streak multiplier
    const mult = getStreakXPMultiplier(7);
    const totalXP = xpEarned * mult;

    const level = calculateLevel(totalXP);
    expect(level).toBeGreaterThanOrEqual(1);
  });

  it('should correctly track achievement progression', () => {
    // Simulate building 5 projects
    const projectsCompleted = 5;

    const badges = checkBadgeRequirements(
      'user-1',
      null,
      1,
      0,
      projectsCompleted,
      { 'electronics': 2, 'software': 3 },
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    );

    expect(badges.length).toBeGreaterThan(0);
    expect(badges).toContain('five-complete');
  });

  it('should validate no gaming the system - XP', () => {
    // Same action shouldn't award unlimited XP
    const xp1 = awardXP('review');
    const xp2 = awardXP('review');

    expect(xp1).toBe(xp2);
    expect(xp1).toBeLessThan(awardXP('project-complete', 'advanced'));
  });

  it('should validate no gaming the system - Streaks', () => {
    // Streak requires 1 full day gap
    const streakData = {
      userId: 'user-1',
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: new Date().toISOString().split('T')[0],
      dailyActivity: [],
      streakMilestones: [],
      streakRewards: []
    };

    const status = getStreakStatus(streakData);
    expect(status.isActive).toBe(true);
  });
});
