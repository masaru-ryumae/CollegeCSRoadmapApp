import React, { useState, useEffect } from 'react';
import {
  calculateRankings,
  getLeaderboard,
  getUserRank,
  getCategoryLeaderboards,
  generateSeasonalCompetition,
  formatLeaderboardDisplay,
  getTopPerformers,
  getUsersNearYou
} from '../utils/leaderboardEngine';
import './Leaderboards.css';

/**
 * Leaderboards Component - Global rankings by period and category
 */
export function Leaderboards({ users = [], currentUserId = 'user-1' }) {
  const [activeTab, setActiveTab] = useState('all-time');
  const [activeCategory, setActiveCategory] = useState('global');
  const [leaderboard, setLeaderboard] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [seasonalComp, setSeasonalComp] = useState(null);
  const [showUserCard, setShowUserCard] = useState(null);

  // Mock user data for demo purposes
  const mockUsers = [
    { userId: 'user-1', username: 'You', level: 28, totalXP: 85000, projectsCompleted: 15, currentStreak: 12, longestStreak: 45, communityLikes: 250, badge_count: 18 },
    { userId: 'user-2', username: 'SpeedRunner', level: 42, totalXP: 125000, projectsCompleted: 32, currentStreak: 5, longestStreak: 100, communityLikes: 450, badge_count: 35 },
    { userId: 'user-3', username: 'ElectroWiz', level: 38, totalXP: 98500, projectsCompleted: 28, currentStreak: 22, longestStreak: 60, communityLikes: 380, badge_count: 32 },
    { userId: 'user-4', username: 'RoboMaster', level: 36, totalXP: 87200, projectsCompleted: 24, currentStreak: 18, longestStreak: 50, communityLikes: 320, badge_count: 28 },
    { userId: 'user-5', username: 'CodeNinja', level: 33, totalXP: 76400, projectsCompleted: 21, currentStreak: 7, longestStreak: 35, communityLikes: 290, badge_count: 25 },
    { userId: 'user-6', username: 'BuildKing', level: 30, totalXP: 65800, projectsCompleted: 19, currentStreak: 14, longestStreak: 42, communityLikes: 270, badge_count: 22 },
    { userId: 'user-7', username: 'TechWizard', level: 31, totalXP: 72100, projectsCompleted: 20, currentStreak: 9, longestStreak: 48, communityLikes: 280, badge_count: 24 },
    { userId: 'user-8', username: 'InnovateLab', level: 29, totalXP: 68500, projectsCompleted: 18, currentStreak: 11, longestStreak: 40, communityLikes: 260, badge_count: 21 },
    { userId: 'user-9', username: 'DesignPro', level: 27, totalXP: 62300, projectsCompleted: 16, currentStreak: 6, longestStreak: 38, communityLikes: 240, badge_count: 19 },
    { userId: 'user-10', username: 'HardwareHero', level: 25, totalXP: 55200, projectsCompleted: 14, currentStreak: 3, longestStreak: 30, communityLikes: 200, badge_count: 17 }
  ];

  const leaderboardUsers = users.length > 0 ? users : mockUsers;

  useEffect(() => {
    // Generate seasonal competition
    const season = generateSeasonalCompetition();
    setSeasonalComp(season);

    // Get leaderboard based on active tab and category
    const lb = getLeaderboard(leaderboardUsers, activeCategory, 100, activeTab as any);
    setLeaderboard(lb);

    // Get user's rank
    const rank = getUserRank(currentUserId, lb.rankings);
    setUserRank(rank);
  }, [activeTab, activeCategory, leaderboardUsers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const getTrendIcon = (rankChange) => {
    if (rankChange > 0) return '📈 +' + rankChange;
    if (rankChange < 0) return '📉 ' + rankChange;
    return '➡️ —';
  };

  return (
    <div className="leaderboards">
      {/* Seasonal Competition Banner */}
      {seasonalComp && (
        <div className={`seasonal-banner ${seasonalComp.status}`}>
          <div className="season-icon">🏆</div>
          <div className="season-info">
            <h3>{seasonalComp.seasonName}</h3>
            <p>{seasonalComp.status === 'active' ? 'Currently Active' : 'Upcoming'}</p>
            <div className="season-rewards">
              {seasonalComp.topRewards.map((reward, i) => (
                <span key={i} className="reward-badge">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {reward}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <div className="leaderboard-tabs">
        <button
          className={`tab ${activeTab === 'all-time' ? 'active' : ''}`}
          onClick={() => handleTabChange('all-time')}
        >
          All Time
        </button>
        <button
          className={`tab ${activeTab === 'seasonal' ? 'active' : ''}`}
          onClick={() => handleTabChange('seasonal')}
        >
          This Season
        </button>
        <button
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => handleTabChange('monthly')}
        >
          Monthly
        </button>
        <button
          className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => handleTabChange('weekly')}
        >
          Weekly
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        <button
          className={`filter ${activeCategory === 'global' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('global')}
        >
          Global
        </button>
        {['Electronics', 'Robotics', 'Software', 'IoT', 'Hardware'].map((cat) => (
          <button
            key={cat}
            className={`filter ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <div className="user-rank-card">
          <div className="rank-badge">#{userRank.rank}</div>
          <div className="user-info">
            <div className="username">{userRank.username}</div>
            <div className="level-and-xp">
              Level {userRank.level} • {(userRank.totalXP / 1000).toFixed(1)}K XP
            </div>
          </div>
          <div className="rank-change">{getTrendIcon(userRank.rankChange)}</div>
          <div className="percentile">Top {userRank.percentile}%</div>
        </div>
      )}

      {/* Main Leaderboard */}
      {leaderboard && (
        <div className="leaderboard-container">
          <div className="leaderboard-header">
            <h2>🏆 Rankings</h2>
            <span className="leaderboard-count">
              {leaderboard.rankings.length} Competitors
            </span>
          </div>

          <div className="leaderboard-list">
            {leaderboard.rankings.slice(0, 50).map((user, index) => (
              <div
                key={user.userId}
                className={`leaderboard-entry ${index < 3 ? 'top-3' : ''} ${user.userId === currentUserId ? 'current-user' : ''}`}
                onClick={() => setShowUserCard(user)}
              >
                {/* Rank Badge */}
                <div className="rank-column">
                  {index < 3 ? (
                    <div className="medal">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                    </div>
                  ) : (
                    <div className="rank-number">#{user.rank}</div>
                  )}
                </div>

                {/* User Info */}
                <div className="user-column">
                  <div className="username">{user.username}</div>
                  <div className="user-meta">
                    Level {user.level} • {user.projectsCompleted} projects
                  </div>
                </div>

                {/* Stats */}
                <div className="stats-column">
                  <div className="stat">
                    <span className="label">XP</span>
                    <span className="value">{(user.totalXP / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="stat">
                    <span className="label">Streak</span>
                    <span className="value">🔥 {user.currentStreak}</span>
                  </div>
                </div>

                {/* Rank Change */}
                <div className="trend-column">
                  {user.rankChange !== 0 ? (
                    <div className={`rank-change ${user.rankChange > 0 ? 'up' : 'down'}`}>
                      {user.rankChange > 0 ? '↑' : '↓'} {Math.abs(user.rankChange)}
                    </div>
                  ) : (
                    <div className="rank-change stable">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {leaderboard.rankings.length > 50 && (
            <button className="load-more-btn">Load More</button>
          )}
        </div>
      )}

      {/* Top Performers Highlight */}
      {leaderboard && (
        <div className="top-performers">
          <h3>👑 Top Performers</h3>
          <div className="performers-grid">
            {getTopPerformers(leaderboard.rankings, 3).map((user, index) => (
              <div key={user.userId} className={`performer-card rank-${index + 1}`}>
                <div className="medal">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                </div>
                <div className="performer-info">
                  <div className="performer-name">{user.username}</div>
                  <div className="performer-level">Level {user.level}</div>
                  <div className="performer-xp">{(user.totalXP / 1000).toFixed(0)}K XP</div>
                  <div className="performer-badges">
                    {user.badge_count} Badges
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserCard && (
        <div className="user-card-modal" onClick={() => setShowUserCard(null)}>
          <div className="user-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowUserCard(null)}>✕</button>

            <div className="card-header">
              <div className="level-circle">
                {showUserCard.level}
              </div>
              <div className="header-info">
                <h2>{showUserCard.username}</h2>
                <div className="header-title">
                  {showUserCard.rank === 1 && '👑 Champion'}
                  {showUserCard.rank <= 10 && showUserCard.rank !== 1 && '🏆 Top 10'}
                  {showUserCard.rank <= 100 && showUserCard.rank > 10 && '⭐ Top 100'}
                  {showUserCard.rank > 100 && 'Builder'}
                </div>
              </div>
            </div>

            <div className="card-stats">
              <div className="stat-item">
                <div className="stat-icon">🏅</div>
                <div className="stat-info">
                  <div className="stat-label">Rank</div>
                  <div className="stat-value">#{showUserCard.rank}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <div className="stat-label">Total XP</div>
                  <div className="stat-value">{(showUserCard.totalXP / 1000).toFixed(0)}K</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <div className="stat-label">Projects</div>
                  <div className="stat-value">{showUserCard.projectsCompleted}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <div className="stat-label">Streak</div>
                  <div className="stat-value">{showUserCard.currentStreak} days</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">👑</div>
                <div className="stat-info">
                  <div className="stat-label">Longest</div>
                  <div className="stat-value">{showUserCard.longestStreak} days</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-label">Badges</div>
                  <div className="stat-value">{showUserCard.badge_count}</div>
                </div>
              </div>
            </div>

            {showUserCard.userId !== currentUserId && (
              <button className="follow-btn">Follow User</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboards;
