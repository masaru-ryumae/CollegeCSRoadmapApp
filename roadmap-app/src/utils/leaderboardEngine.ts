// Leaderboard & Rankings System - Multi-period rankings
export interface UserRankingData {
  userId: string;
  username: string;
  level: number;
  totalXP: number;
  projectsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  communityLikes: number;
  badgeCount: number;
}

export interface RankedUser extends UserRankingData {
  rank: number;
  percentile: number;
  previousRank?: number;
  rankChange: number; // +/- from previous period
}

export interface LeaderboardPeriod {
  type: 'weekly' | 'monthly' | 'seasonal' | 'all-time';
  startDate: string;
  endDate: string;
  category: string; // '' for global, or category name
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  rankings: RankedUser[];
  generatedAt: string;
  isCompetitive: boolean;
}

export interface SeasonalCompetition {
  seasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  topRewards: string[];
  participants: string[];
}

/**
 * Calculate rankings for a specific period
 */
export function calculateRankings(
  users: UserRankingData[],
  _period: 'weekly' | 'monthly' | 'seasonal' | 'all-time',
  previousRankings?: RankedUser[]
): RankedUser[] {
  // Sort by XP (primary metric)
  const sortedUsers = [...users].sort((a, b) => b.totalXP - a.totalXP);

  return sortedUsers.map((user, index) => {
    const totalUsers = sortedUsers.length;
    const previousRank = previousRankings?.find(r => r.userId === user.userId)?.rank;

    return {
      ...user,
      rank: index + 1,
      percentile: Math.round(((index + 1) / totalUsers) * 100),
      previousRank,
      rankChange: previousRank ? previousRank - (index + 1) : 0
    };
  });
}

/**
 * Get user's rank in a specific period
 */
export function getUserRank(
  userId: string,
  rankings: RankedUser[]
): RankedUser | null {
  return rankings.find(r => r.userId === userId) || null;
}

/**
 * Get leaderboard for a specific category
 */
export function getLeaderboard(
  allUsers: UserRankingData[],
  category: string = '',
  limit: number = 100,
  period: 'weekly' | 'monthly' | 'seasonal' | 'all-time' = 'all-time'
): Leaderboard {
  // Filter by category if specified
  const filteredUsers = category ? allUsers.filter(() => {
    // This would depend on user category preference
    // For now, we'll return all users
    return true;
  }) : allUsers;

  const rankings = calculateRankings(filteredUsers, period).slice(0, limit);

  const startDate = getLeaderboardPeriodDates(period).startDate;
  const endDate = getLeaderboardPeriodDates(period).endDate;

  return {
    period: {
      type: period,
      startDate,
      endDate,
      category
    },
    rankings,
    generatedAt: new Date().toISOString(),
    isCompetitive: period !== 'all-time'
  };
}

/**
 * Get leaderboard period dates
 */
function getLeaderboardPeriodDates(period: 'weekly' | 'monthly' | 'seasonal' | 'all-time') {
  const now = new Date();

  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  if (period === 'seasonal') {
    let month = now.getMonth();
    let year = now.getFullYear();

    // Winter: Dec-Feb
    // Spring: Mar-May
    // Summer: Jun-Aug
    // Fall: Sep-Nov

    if (month <= 1) {
      // Winter - Dec 1 to Feb 28
      if (month === 0 || month === 1) {
        year--;
      }
      const start = new Date(year, 11, 1);
      const end = new Date(year + 1, 1, 28);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    } else if (month <= 4) {
      // Spring - Mar 1 to May 31
      const start = new Date(year, 2, 1);
      const end = new Date(year, 4, 31);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    } else if (month <= 7) {
      // Summer - Jun 1 to Aug 31
      const start = new Date(year, 5, 1);
      const end = new Date(year, 7, 31);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    } else {
      // Fall - Sep 1 to Nov 30
      const start = new Date(year, 8, 1);
      const end = new Date(year, 10, 30);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
  }

  // All-time
  return {
    startDate: '2020-01-01',
    endDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Get category-specific leaderboards
 */
export function getCategoryLeaderboards(
  allUsers: UserRankingData[],
  limit: number = 10
): Record<string, Leaderboard> {
  const categories = ['Electronics', 'Robotics', 'Software', 'IoT', 'Hardware'];
  const leaderboards: Record<string, Leaderboard> = {};

  for (const category of categories) {
    leaderboards[category] = getLeaderboard(allUsers, category, limit, 'all-time');
  }

  return leaderboards;
}

/**
 * Track seasonal competitions
 */
export function generateSeasonalCompetition(): SeasonalCompetition {
  const now = new Date();
  const currentSeason = getCurrentSeason();
  const seasonYear = now.getFullYear();

  const competitions: Record<string, SeasonalCompetition> = {
    winter: {
      seasonId: `winter-${seasonYear}`,
      seasonName: `Winter ${seasonYear}`,
      startDate: `${seasonYear - 1}-12-01`,
      endDate: `${seasonYear}-02-28`,
      status: 'upcoming',
      topRewards: ['Winter Champion Badge', '5000 XP Bonus', 'Exclusive Theme'],
      participants: []
    },
    spring: {
      seasonId: `spring-${seasonYear}`,
      seasonName: `Spring ${seasonYear}`,
      startDate: `${seasonYear}-03-01`,
      endDate: `${seasonYear}-05-31`,
      status: 'upcoming',
      topRewards: ['Spring Champion Badge', '5000 XP Bonus', 'Exclusive Theme'],
      participants: []
    },
    summer: {
      seasonId: `summer-${seasonYear}`,
      seasonName: `Summer ${seasonYear}`,
      startDate: `${seasonYear}-06-01`,
      endDate: `${seasonYear}-08-31`,
      status: 'active',
      topRewards: ['Summer Champion Badge', '5000 XP Bonus', 'Exclusive Theme'],
      participants: []
    },
    fall: {
      seasonId: `fall-${seasonYear}`,
      seasonName: `Fall ${seasonYear}`,
      startDate: `${seasonYear}-09-01`,
      endDate: `${seasonYear}-11-30`,
      status: 'upcoming',
      topRewards: ['Fall Champion Badge', '5000 XP Bonus', 'Exclusive Theme'],
      participants: []
    }
  };

  return competitions[currentSeason] as SeasonalCompetition;
}

/**
 * Get current season
 */
function getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = new Date().getMonth();
  if (month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'fall';
}

/**
 * Generate leaderboard notifications
 */
export function generateLeaderboardNotifications(
  previousRankings: RankedUser[],
  currentRankings: RankedUser[]
): Array<{ userId: string; message: string; type: 'promotion' | 'demotion' | 'milestone' }> {
  const notifications: Array<{ userId: string; message: string; type: 'promotion' | 'demotion' | 'milestone' }> = [];

  for (const current of currentRankings) {
    const previous = previousRankings.find(r => r.userId === current.userId);

    if (!previous) continue;

    if (current.rank < previous.rank) {
      // Promoted
      notifications.push({
        userId: current.userId,
        message: `🎉 Promoted to rank #${current.rank}!`,
        type: 'promotion'
      });
    } else if (current.rank > previous.rank) {
      // Demoted
      notifications.push({
        userId: current.userId,
        message: `Dropped to rank #${current.rank}`,
        type: 'demotion'
      });
    }

    // Milestone notifications
    if (current.rank === 1 && previous.rank !== 1) {
      notifications.push({
        userId: current.userId,
        message: '👑 You are now #1!',
        type: 'milestone'
      });
    } else if (current.rank === 10 && previous.rank !== 10) {
      notifications.push({
        userId: current.userId,
        message: '🏆 Top 10!',
        type: 'milestone'
      });
    } else if (current.rank === 100 && previous.rank !== 100) {
      notifications.push({
        userId: current.userId,
        message: '⭐ Top 100!',
        type: 'milestone'
      });
    }
  }

  return notifications;
}

/**
 * Get friend rankings
 */
export function getFriendRankings(
  userId: string,
  friends: string[],
  allRankings: RankedUser[]
): RankedUser[] {
  const userRanking = allRankings.find(r => r.userId === userId);
  if (!userRanking) return [];

  const friendRankings = allRankings.filter(r => friends.includes(r.userId));

  return [userRanking, ...friendRankings].sort((a, b) => a.rank - b.rank);
}

/**
 * Get user percentile
 */
export function getUserPercentile(rankings: RankedUser[], userId: string): number | null {
  const userRank = rankings.find(r => r.userId === userId);
  return userRank?.percentile || null;
}

/**
 * Format leaderboard display
 */
export function formatLeaderboardDisplay(rank: number, change: number): string {
  if (change > 0) return `#${rank} ⬆️ +${change}`;
  if (change < 0) return `#${rank} ⬇️ ${change}`;
  return `#${rank}`;
}

/**
 * Get top performers
 */
export function getTopPerformers(
  rankings: RankedUser[],
  count: number = 3
): RankedUser[] {
  return rankings.slice(0, count);
}

/**
 * Get users near you (for social context)
 */
export function getUsersNearYou(
  rankings: RankedUser[],
  userId: string,
  range: number = 5
): RankedUser[] {
  const userIndex = rankings.findIndex(r => r.userId === userId);
  if (userIndex === -1) return [];

  const start = Math.max(0, userIndex - range);
  const end = Math.min(rankings.length, userIndex + range + 1);

  return rankings.slice(start, end);
}
