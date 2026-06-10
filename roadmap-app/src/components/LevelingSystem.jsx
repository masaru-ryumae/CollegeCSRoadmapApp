import React, { useState, useEffect } from 'react';
import {
  calculateLevel,
  calculateLevelProgress,
  getLevelRewards,
  formatXP,
  rankByXP
} from '../utils/xpSystem';
import './LevelingSystem.css';

/**
 * LevelingSystem Component - XP progression, level display, leaderboard
 */
export function LevelingSystem({ userStats = {}, onLevelUp = null }) {
  const [levelData, setLevelData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState('xp-ranking');
  const [leaderboardUsers, setLeaderboardUsers] = useState([]);

  useEffect(() => {
    const totalXP = userStats.totalXP || 0;
    const progress = calculateLevelProgress(totalXP);
    setLevelData(progress);

    const allRewards = getLevelRewards();
    const unlockedRewards = allRewards.filter(r => r.level <= progress.currentLevel);
    setRewards(unlockedRewards);
  }, [userStats.totalXP]);

  const levelData_safe = levelData || {
    currentLevel: 1,
    currentXP: 0,
    nextLevelXP: 1000,
    progress: 0
  };

  return (
    <div className="leveling-system">
      {/* Main Level Display */}
      <div className="level-display-card">
        <div className="level-container">
          <div className="level-circle">
            <div className="level-number">{levelData_safe.currentLevel}</div>
            <div className="level-label">LEVEL</div>
          </div>

          <div className="level-info">
            <h2>{userStats.username || 'Builder'}</h2>
            <div className="level-title">
              {getLevelTitle(levelData_safe.currentLevel)}
            </div>
            <div className="total-xp">{formatXP(userStats.totalXP || 0)} XP Total</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="xp-progress-section">
          <div className="progress-header">
            <span>Level {levelData_safe.currentLevel} Progress</span>
            <span className="xp-info">
              {formatXP(levelData_safe.currentXP)} / {formatXP(levelData_safe.nextLevelXP)}
            </span>
          </div>

          <div className="xp-progress-bar">
            <div
              className="xp-progress-fill"
              style={{ width: `${levelData_safe.progress}%` }}
            >
              <span className="progress-percentage">{Math.round(levelData_safe.progress)}%</span>
            </div>
          </div>

          {levelData_safe.currentLevel < 50 && (
            <div className="xp-to-next">
              {formatXP(levelData_safe.nextLevelXP - levelData_safe.currentXP)} XP to Level {levelData_safe.currentLevel + 1}
            </div>
          )}

          {levelData_safe.currentLevel === 50 && (
            <div className="max-level">🏆 Maximum Level Reached!</div>
          )}
        </div>
      </div>

      {/* Unlocked Rewards */}
      <div className="rewards-section">
        <h3>🎁 Unlocked Rewards ({rewards.length})</h3>

        <div className="rewards-grid">
          {rewards.slice(-5).reverse().map((reward) => (
            <div key={reward.level} className="reward-card">
              <div className="reward-icon">{reward.icon}</div>
              <div className="reward-info">
                <div className="reward-level">Level {reward.level}</div>
                <div className="reward-text">{reward.reward}</div>
              </div>
              {reward.milestone && <div className="milestone-badge">🌟 Milestone</div>}
            </div>
          ))}
        </div>

        {rewards.length > 5 && (
          <button className="view-all-rewards-btn">View All {rewards.length} Rewards</button>
        )}
      </div>

      {/* XP Sources Reference */}
      <div className="xp-sources">
        <h4>XP Sources</h4>
        <div className="sources-grid">
          <div className="source">
            <span className="source-icon">✓</span>
            <span className="source-action">Project Completion</span>
            <span className="source-xp">100-500 XP</span>
          </div>
          <div className="source">
            <span className="source-icon">📝</span>
            <span className="source-action">Leave Review</span>
            <span className="source-xp">10 XP</span>
          </div>
          <div className="source">
            <span className="source-icon">🤝</span>
            <span className="source-action">Help Someone</span>
            <span className="source-xp">25 XP</span>
          </div>
          <div className="source">
            <span className="source-icon">📚</span>
            <span className="source-action">Share Collection</span>
            <span className="source-xp">15 XP</span>
          </div>
          <div className="source">
            <span className="source-icon">🎯</span>
            <span className="source-action">Milestone</span>
            <span className="source-xp">50 XP</span>
          </div>
        </div>
      </div>

      {/* Leaderboards Tabs */}
      <div className="leaderboards-section">
        <div className="leaderboards-tabs">
          <button
            className={`tab ${leaderboardView === 'xp-ranking' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('xp-ranking')}
          >
            XP Rankings
          </button>
          <button
            className={`tab ${leaderboardView === 'level' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('level')}
          >
            By Level
          </button>
          <button
            className={`tab ${leaderboardView === 'category' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('category')}
          >
            By Category
          </button>
        </div>

        {leaderboardView === 'xp-ranking' && (
          <div className="leaderboard-content">
            <h4>Top 10 XP Leaders</h4>
            <div className="leaderboard-list">
              {[
                { rank: 1, username: 'SpeedRunner', xp: 125000, level: 42 },
                { rank: 2, username: 'ElectroWiz', xp: 98500, level: 38 },
                { rank: 3, username: 'RoboMaster', xp: 87200, level: 36 },
                { rank: 4, username: 'CodeNinja', xp: 76400, level: 33 },
                { rank: 5, username: 'BuildKing', xp: 65800, level: 30 }
              ].map((user) => (
                <div key={user.rank} className="leaderboard-entry">
                  <div className="rank-badge">#{user.rank}</div>
                  <div className="user-info">
                    <div className="username">{user.username}</div>
                    <div className="user-level">Level {user.level}</div>
                  </div>
                  <div className="user-xp">{formatXP(user.xp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {leaderboardView === 'level' && (
          <div className="leaderboard-content">
            <h4>Level Distribution</h4>
            <div className="level-distribution">
              <div className="distribution-bar">
                <div className="bar-segment" style={{ width: '5%' }} title="Level 50">
                  <span>Lvl 50</span>
                </div>
                <div className="bar-segment" style={{ width: '15%' }} title="Level 40-49">
                  <span>40-49</span>
                </div>
                <div className="bar-segment" style={{ width: '25%' }} title="Level 30-39">
                  <span>30-39</span>
                </div>
                <div className="bar-segment" style={{ width: '35%' }} title="Level 20-29">
                  <span>20-29</span>
                </div>
                <div className="bar-segment" style={{ width: '20%' }} title="Level <20">
                  <span>&lt;20</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {leaderboardView === 'category' && (
          <div className="leaderboard-content">
            <h4>Category Leaders</h4>
            <div className="category-leaders">
              {['Electronics', 'Robotics', 'Software', 'IoT', 'Hardware'].map((cat) => (
                <div key={cat} className="category-leader">
                  <div className="category-name">{cat}</div>
                  <div className="category-leader-name">TechWizard</div>
                  <div className="category-count">18 projects</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getLevelTitle(level) {
  if (level < 5) return 'Novice Builder';
  if (level < 10) return 'Aspiring Builder';
  if (level < 15) return 'Growing Builder';
  if (level < 25) return 'Skilled Builder';
  if (level < 35) return 'Expert Builder';
  if (level < 45) return 'Master Builder';
  return 'Legendary Builder';
}

export default LevelingSystem;
