import React, { useState, useEffect } from 'react';
import {
  analyzePerformanceTrends,
  predictChurnRisk,
  suggestFocusAreas,
  compareWithCohort
} from '../services/performanceML';
import './PerformanceInsights.css';

export function PerformanceInsights({ userId, roadmap, currentProgress }) {
  const [insights, setInsights] = useState(null);
  const [churnRisk, setChurnRisk] = useState(null);
  const [focusAreas, setFocusAreas] = useState([]);
  const [cohortComparison, setCohortComparison] = useState([]);
  const [activeMetric, setActiveMetric] = useState(null);

  useEffect(() => {
    if (roadmap && currentProgress) {
      // Analyze performance
      const performanceInsights = analyzePerformanceTrends(userId, roadmap, currentProgress);
      setInsights(performanceInsights);

      // Predict churn risk
      const risk = predictChurnRisk(userId, currentProgress, roadmap);
      setChurnRisk(risk);

      // Get focus areas
      const areas = suggestFocusAreas(userId, performanceInsights);
      setFocusAreas(areas);

      // Get cohort comparison
      const comparison = compareWithCohort(userId, performanceInsights);
      setCohortComparison(comparison);
    }
  }, [userId, roadmap, currentProgress]);

  if (!insights || !churnRisk) {
    return <div className="performance-insights loading">Loading your analytics...</div>;
  }

  const getChurnRiskColor = (level) => {
    switch (level) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="performance-insights">
      <div className="insights-header">
        <h2>📊 Your Learning Analytics</h2>
        <p className="subtitle">Data-driven insights to improve your learning</p>
      </div>

      {/* Overall Performance Score */}
      <div className="performance-score-section">
        <div className="score-card main-score">
          <div className="score-value">{insights.overallPerformance}</div>
          <div className="score-label">Overall Performance</div>
          <div className="score-subtext">
            {insights.overallPerformance >= 80
              ? 'Excellent progress!'
              : insights.overallPerformance >= 60
              ? 'Good pace, keep going!'
              : 'Keep practicing, you\'ll improve!'}
          </div>
        </div>

        <div className="metrics-mini">
          {insights.trends.slice(0, 1).map((trend, idx) => (
            <div key={idx} className="mini-metric">
              <div className="mini-value">{trend.successRate.toFixed(0)}%</div>
              <div className="mini-label">This Week Success Rate</div>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Risk Alert */}
      {churnRisk.riskLevel === 'high' && (
        <div className="alert alert-danger">
          <h3>⚠️ Engagement Alert</h3>
          <p>
            We've noticed a drop in your engagement. {churnRisk.factors.inactivityDays} days of inactivity.
          </p>
          <button className="btn-alert" onClick={() => setActiveMetric('churnRisk')}>
            See Recommendations →
          </button>
        </div>
      )}

      {/* Trends Section */}
      <div className="trends-section">
        <h3>Your Learning Trends</h3>

        <div className="trends-grid">
          {insights.trends.map((trend, idx) => (
            <div key={idx} className="trend-card" onClick={() => setActiveMetric(`trend-${idx}`)}>
              <div className="trend-period">
                {trend.period === 'week' ? 'This Week' : 'This Month'}
              </div>

              <div className="trend-metrics">
                <div className="metric">
                  <span className="metric-value">{trend.successRate.toFixed(0)}%</span>
                  <span className="metric-label">Success Rate</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{trend.velocity.toFixed(2)}</span>
                  <span className="metric-label">Modules/Week</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{(trend.engagementScore * 100).toFixed(0)}%</span>
                  <span className="metric-label">Engagement</span>
                </div>
              </div>

              <div className="trend-bar">
                <div
                  className="trend-fill"
                  style={{
                    width: `${Math.min(100, trend.successRate)}%`,
                    backgroundColor: trend.successRate > 70 ? '#10b981' : trend.successRate > 50 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="strengths-weaknesses-section">
        <div className="strengths-column">
          <h3>💪 Your Strengths</h3>
          {insights.strengths.length > 0 ? (
            <div className="strength-list">
              {insights.strengths.map((strength, idx) => (
                <div key={idx} className="strength-item">
                  <div className="category-badge">{strength.category}</div>
                  <div className="strength-details">
                    <p className="score">
                      {(strength.strengthScore * 100).toFixed(0)}% Mastery
                    </p>
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{ width: `${strength.strengthScore * 100}%` }}
                      />
                    </div>
                    <div className="top-skills">
                      {strength.topSkills.map((skill, i) => (
                        <span key={i} className="skill">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Keep practicing to build strengths!</p>
          )}
        </div>

        <div className="weaknesses-column">
          <h3>📈 Areas to Improve</h3>
          {insights.weaknesses.length > 0 ? (
            <div className="weakness-list">
              {insights.weaknesses.map((weakness, idx) => (
                <div key={idx} className="weakness-item">
                  <div className="category-badge warning">{weakness.category}</div>
                  <div className="weakness-details">
                    <p className="score">
                      {(weakness.strengthScore * 100).toFixed(0)}% Mastery
                    </p>
                    <div className="weakness-bar">
                      <div
                        className="weakness-fill"
                        style={{ width: `${weakness.strengthScore * 100}%` }}
                      />
                    </div>
                    <div className="improvement-areas">
                      {weakness.areasForImprovement.map((area, i) => (
                        <span key={i} className="area">{area}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">You're doing great in all areas!</p>
          )}
        </div>
      </div>

      {/* Focus Areas Recommendations */}
      {focusAreas.length > 0 && (
        <div className="focus-areas-section">
          <h3>🎯 Where to Focus Next</h3>
          <p className="section-description">
            Allocate your effort strategically for maximum impact
          </p>

          <div className="focus-areas-grid">
            {focusAreas.map((area, idx) => (
              <div key={idx} className="focus-area-card">
                <div className="focus-rank">#{idx + 1}</div>

                <h4>{area.category}</h4>

                <div className="focus-metrics">
                  <div className="focus-current">
                    <span className="label">Current:</span>
                    <span className="value">{(area.currentScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="focus-potential">
                    <span className="label">Potential:</span>
                    <span className="value">+{(area.potentialGain * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="focus-bar">
                  <div className="current-bar" style={{ width: `${area.currentScore * 100}%` }} />
                  <div
                    className="potential-bar"
                    style={{ width: `${(area.currentScore + area.potentialGain) * 100}%` }}
                  />
                </div>

                <p className="impact">{area.estimatedImpact}</p>

                <div className="time-allocation">
                  <span className="label">Recommended Effort:</span>
                  <span className="percentage">{area.recommendedTimeAllocation.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Comparison */}
      <div className="cohort-comparison-section">
        <h3>📊 How You Compare</h3>
        <p className="section-description">
          Anonymous comparison with learners on similar paths
        </p>

        <div className="comparison-grid">
          {cohortComparison.map((comp, idx) => (
            <div key={idx} className="comparison-card">
              <h4>{comp.category}</h4>

              <div className="percentile-badge">
                <div className="percentile">{comp.percentile}</div>
                <div className="percentile-label">Percentile</div>
              </div>

              <div className="comparison-bars">
                <div className="bar-item">
                  <span className="bar-label">Your Score:</span>
                  <div className="bar-container">
                    <div className="bar your-bar" style={{ width: `${Math.min(100, (comp.userMetric / 100) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{comp.userMetric.toFixed(1)}</span>
                </div>

                <div className="bar-item">
                  <span className="bar-label">Cohort Median:</span>
                  <div className="bar-container">
                    <div className="bar median-bar" style={{ width: `${Math.min(100, (comp.cohortMedian / 100) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{comp.cohortMedian.toFixed(1)}</span>
                </div>
              </div>

              {comp.percentile > 75 ? (
                <p className="comparison-insight top-performer">
                  🌟 You're in the top 25%! Keep it up!
                </p>
              ) : comp.percentile > 50 ? (
                <p className="comparison-insight above-average">
                  ✓ Above average. Push a bit more to reach top performers.
                </p>
              ) : (
                <p className="comparison-insight below-average">
                  📈 Room to grow. Focus on practice and consistency.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>💡 Personalized Recommendations</h3>

          <div className="recommendations-list">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <span className="number">{idx + 1}</span>
                <p>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn Risk Details Modal */}
      {activeMetric === 'churnRisk' && (
        <div className="modal-overlay" onClick={() => setActiveMetric(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Engagement Analysis</h3>

            <div className="risk-details">
              <div className="risk-score-large">
                <div className="score" style={{ color: getChurnRiskColor(churnRisk.riskLevel) }}>
                  {(churnRisk.riskScore * 100).toFixed(0)}
                </div>
                <div className="label">Risk Score</div>
                <div className="level" style={{ color: getChurnRiskColor(churnRisk.riskLevel) }}>
                  {churnRisk.riskLevel.toUpperCase()}
                </div>
              </div>

              <div className="risk-factors">
                <h4>Risk Factors</h4>
                <ul>
                  <li>Inactivity: {churnRisk.factors.inactivityDays} days</li>
                  <li>Trend: {churnRisk.factors.engagementTrend}</li>
                  <li>Incompletion Rate: {(churnRisk.factors.incompletionRate * 100).toFixed(0)}%</li>
                </ul>
              </div>

              <div className="interventions">
                <h4>Recommended Actions</h4>
                <ul>
                  {churnRisk.interventions.map((intervention, idx) => (
                    <li key={idx}>✓ {intervention}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="close-button" onClick={() => setActiveMetric(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
