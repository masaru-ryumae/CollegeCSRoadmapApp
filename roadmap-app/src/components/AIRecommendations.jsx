import React, { useState, useEffect, useMemo } from 'react';
import { generatePersonalizedRoadmap, getCachedRecommendations, trackModuleEngagement } from '../services/aiRecommender';
import moduleData from '../data/MODULE_DATA.json';
import './AIRecommendations.css';

export function AIRecommendations({ userId, roadmap, onSelectProject }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState({});
  const [dismissedRecommendations, setDismissedRecommendations] = useState(new Set());

  useEffect(() => {
    // Try to use cached recommendations first
    const cached = getCachedRecommendations(userId);
    if (cached) {
      setRecommendations(cached);
      setLoading(false);
    } else {
      // Generate new recommendations
      const modules = moduleData.modules;
      const recs = generatePersonalizedRoadmap(userId, modules, roadmap);
      setRecommendations(recs);
      setLoading(false);
    }
  }, [userId, roadmap]);

  const handleRateModule = (moduleId, rating) => {
    setSelectedRating(prev => ({ ...prev, [moduleId]: rating }));
    trackModuleEngagement(userId, moduleId, 0, rating);

    // Refresh recommendations after rating
    setTimeout(() => {
      const modules = moduleData.modules;
      const recs = generatePersonalizedRoadmap(userId, modules, roadmap);
      setRecommendations(recs);
    }, 300);
  };

  const handleDismiss = (moduleId) => {
    const newDismissed = new Set(dismissedRecommendations);
    newDismissed.add(moduleId);
    setDismissedRecommendations(newDismissed);
  };

  const filteredRecommendations = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.recommendations.filter(r => !dismissedRecommendations.has(r.moduleId));
  }, [recommendations, dismissedRecommendations]);

  if (loading) {
    return (
      <div className="ai-recommendations">
        <div className="loading-skeleton">Loading your personalized recommendations...</div>
      </div>
    );
  }

  if (!recommendations || filteredRecommendations.length === 0) {
    return (
      <div className="ai-recommendations empty">
        <p>No new recommendations at this time. Keep practicing!</p>
      </div>
    );
  }

  return (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <h2>AI Suggests for You</h2>
        <div className="confidence-badge">
          {(recommendations.averageConfidence * 100).toFixed(0)}% Confidence
        </div>
      </div>

      <div className="recommendations-list">
        {filteredRecommendations.map((rec, index) => (
          <div key={rec.moduleId} className={`recommendation-card confidence-${Math.floor(rec.confidenceScore * 5)}`}>
            <div className="recommendation-header">
              <div className="recommendation-title">
                <h3>{rec.moduleName}</h3>
                <span className={`difficulty-badge ${rec.difficulty}`}>
                  {rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)}
                </span>
              </div>
              <div className="confidence-score">
                {(rec.confidenceScore * 100).toFixed(0)}%
              </div>
            </div>

            <p className="recommendation-reasoning">
              💡 {rec.reasoning}
            </p>

            <div className="recommendation-details">
              <div className="detail-item">
                <span className="label">Estimated Time:</span>
                <span className="value">{rec.estimatedHours} hours</span>
              </div>
              <div className="detail-item">
                <span className="label">Relevance Score:</span>
                <span className="relevance-bar">
                  <div
                    className="relevance-fill"
                    style={{ width: `${rec.relevanceScore * 100}%` }}
                  />
                </span>
              </div>
            </div>

            <div className="skills-section">
              <p className="skills-label">Skills You'll Gain:</p>
              <div className="skills-tags">
                {rec.skillsGained.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="recommendation-actions">
              <button
                className="btn-select"
                onClick={() => onSelectProject(rec.moduleId)}
              >
                Start Learning
              </button>

              <div className="rating-section">
                <span className="rating-label">Helpful?</span>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star ${selectedRating[rec.moduleId] >= star ? 'filled' : ''}`}
                      onClick={() => handleRateModule(rec.moduleId, star)}
                      title={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-dismiss"
                onClick={() => handleDismiss(rec.moduleId)}
                title="Hide this recommendation"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {dismissedRecommendations.size > 0 && (
        <div className="dismissed-note">
          <p>Dismissed {dismissedRecommendations.size} recommendation(s)</p>
          <button
            className="btn-reset"
            onClick={() => setDismissedRecommendations(new Set())}
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}
