import React, { useState, useEffect } from 'react';
import { BADGES, checkBadgeRequirements, formatBadgeDisplay } from '../utils/badgeSystem';
import './AchievementBadges.css';

/**
 * AchievementBadges Component - Display earned and locked badges with modal details
 */
export function AchievementBadges({ userStats = {} }) {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [animatingBadge, setAnimatingBadge] = useState(null);

  useEffect(() => {
    // Check which badges are earned
    const earned = checkBadgeRequirements(
      userStats.userId || 'user-1',
      userStats.roadmap || null,
      userStats.currentLevel || 1,
      userStats.totalXP || 0,
      userStats.projectsCompleted || 0,
      userStats.projectsByCategory || {},
      userStats.currentStreak || 0,
      userStats.longestStreak || 0,
      userStats.reviewsGiven || 0,
      userStats.helpersCount || 0,
      userStats.communityLikes || 0,
      userStats.collectionsCreated || 0,
      userStats.collectionViews || 0,
      userStats.contentStars || 0
    );

    setUnlockedBadges(earned);
  }, [userStats]);

  const handleBadgeClick = (badgeId) => {
    const badge = BADGES[badgeId];
    setSelectedBadge(badge);
    setShowModal(true);
  };

  const handleBadgeUnlock = (badgeId) => {
    setAnimatingBadge(badgeId);
    setTimeout(() => setAnimatingBadge(null), 600);
  };

  const lockedBadges = Object.values(BADGES).filter(
    b => !unlockedBadges.includes(b.id)
  );

  const badgesByRarity = {
    common: Object.values(BADGES).filter(b => b.rarity === 'common'),
    rare: Object.values(BADGES).filter(b => b.rarity === 'rare'),
    epic: Object.values(BADGES).filter(b => b.rarity === 'epic'),
    legendary: Object.values(BADGES).filter(b => b.rarity === 'legendary')
  };

  const unlockedByRarity = {
    common: badgesByRarity.common.filter(b => unlockedBadges.includes(b.id)),
    rare: badgesByRarity.rare.filter(b => unlockedBadges.includes(b.id)),
    epic: badgesByRarity.epic.filter(b => unlockedBadges.includes(b.id)),
    legendary: badgesByRarity.legendary.filter(b => unlockedBadges.includes(b.id))
  };

  return (
    <div className="achievement-badges">
      <div className="badges-header">
        <h2>🏆 Achievement Badges</h2>
        <div className="badge-counter">
          <span className="badge-count">{unlockedBadges.length} / {Object.keys(BADGES).length}</span>
          <span className="completion-pct">
            {Math.round((unlockedBadges.length / Object.keys(BADGES).length) * 100)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="badge-progress-container">
        <div className="badge-progress-bar">
          <div
            className="badge-progress-fill"
            style={{ width: `${(unlockedBadges.length / Object.keys(BADGES).length) * 100}%` }}
          />
        </div>
      </div>

      {/* Rarity sections */}
      {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => (
        <div key={rarity} className={`rarity-section rarity-${rarity}`}>
          <h3 className={`rarity-title ${rarity}`}>
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)} ({unlockedByRarity[rarity].length} / {badgesByRarity[rarity].length})
          </h3>

          <div className="badges-grid">
            {/* Unlocked badges first */}
            {unlockedByRarity[rarity].map((badge) => (
              <div
                key={badge.id}
                className={`badge-card unlocked ${animatingBadge === badge.id ? 'unlock-animation' : ''}`}
                onClick={() => handleBadgeClick(badge.id)}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-rarity">{rarity}</div>
              </div>
            ))}

            {/* Locked badges */}
            {badgesByRarity[rarity]
              .filter(b => !unlockedBadges.includes(b.id))
              .map((badge) => (
                <div
                  key={badge.id}
                  className="badge-card locked"
                  onClick={() => handleBadgeClick(badge.id)}
                  title="Locked"
                >
                  <div className="badge-icon locked-icon">🔒</div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-rarity">{rarity}</div>
                  <div className="badge-criteria-hint">{badge.criteria}</div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Badge Detail Modal */}
      {showModal && selectedBadge && (
        <div className="badge-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="badge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>

            <div className="modal-content">
              <div className="modal-icon">{selectedBadge.icon}</div>

              <h2>{selectedBadge.name}</h2>

              <div className="badge-rarity-display">
                {selectedBadge.rarity.toUpperCase()}
              </div>

              <p className="badge-description">{selectedBadge.description}</p>

              <div className="badge-criteria">
                <h4>How to Earn</h4>
                <p>{selectedBadge.criteria}</p>
              </div>

              {unlockedBadges.includes(selectedBadge.id) ? (
                <div className="badge-earned">
                  <div className="earned-checkmark">✓</div>
                  <p>You have earned this badge!</p>
                </div>
              ) : (
                <div className="badge-locked-info">
                  <p>🔒 Complete the criteria above to unlock this badge.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AchievementBadges;
