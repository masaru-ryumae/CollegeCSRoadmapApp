import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  generateInsights,
  identifyPatterns,
  suggestImprovements,
  predictProductivity,
  analyzePerformance,
  detectAnomalies,
  calculatePerformanceScore,
} from '../services/insightEngine';
import type { Insight } from '../types';
import './Insights.css';

type InsightCategory = 'all' | 'productivity' | 'pattern' | 'achievement' | 'recommendation' | 'warning';

export function Insights() {
  const { state } = useApp();
  const { roadmap } = state;
  const [selectedCategory, setSelectedCategory] = React.useState<InsightCategory>('all');

  const insights = useMemo(() => {
    if (!roadmap) return [];
    return generateInsights(roadmap);
  }, [roadmap]);

  const patterns = useMemo(() => {
    if (!roadmap) return [];
    return identifyPatterns(roadmap);
  }, [roadmap]);

  const recommendations = useMemo(() => {
    if (!roadmap) return [];
    return suggestImprovements(roadmap);
  }, [roadmap]);

  const predictions = useMemo(() => {
    if (!roadmap) return [];
    return predictProductivity(roadmap);
  }, [roadmap]);

  const performance = useMemo(() => {
    if (!roadmap) return null;
    return analyzePerformance(roadmap);
  }, [roadmap]);

  const anomalies = useMemo(() => {
    if (!roadmap) return [];
    return detectAnomalies(roadmap);
  }, [roadmap]);

  const performanceScore = useMemo(() => {
    if (!roadmap) return 0;
    return calculatePerformanceScore(roadmap);
  }, [roadmap]);

  const filteredInsights =
    selectedCategory === 'all'
      ? insights
      : insights.filter((i) => i.category === selectedCategory);

  const getSeverityIcon = (severity: Insight['severity']) => {
    switch (severity) {
      case 'info':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'success':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 0v2m0-6v0a1 1 0 011-1h0m0-2H9m8 0h2a1 1 0 011 1v6a1 1 0 01-1 1h-2m0 0V7a1 1 0 00-1-1H9a1 1 0 00-1 1v10a1 1 0 001 1h8z"
            />
          </svg>
        );
      case 'critical':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getSeverityClass = (severity: Insight['severity']) => {
    switch (severity) {
      case 'info':
        return 'insight-info';
      case 'success':
        return 'insight-success';
      case 'warning':
        return 'insight-warning';
      case 'critical':
        return 'insight-critical';
    }
  };

  if (!roadmap || !performance) {
    return (
      <div className="insights-empty">
        <p>Start your roadmap to see personalized insights and analytics.</p>
      </div>
    );
  }

  return (
    <div className="insights-container">
      {/* Header */}
      <div className="insights-header">
        <div className="header-content">
          <h1>Insights & Analytics</h1>
          <p>AI-powered recommendations and performance analysis</p>
        </div>

        {/* Performance Score */}
        <div className="performance-score">
          <div className="score-value">{performanceScore}</div>
          <div className="score-label">Performance Score</div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{
                width: `${performanceScore}%`,
                backgroundColor:
                  performanceScore >= 80
                    ? '#10b981'
                    : performanceScore >= 60
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="insights-section">
        <h2>Performance Summary</h2>
        <div className="summary-text">
          <p className="summary-main">{performance.summary}</p>
          <div className="key-metrics">
            {Object.entries(performance.keyMetrics).map(([key, value]) => (
              <div key={key} className="key-metric-item">
                <span className="metric-name">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="metric-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies/Alerts */}
      {anomalies.length > 0 && (
        <div className="insights-section">
          <h2>⚠️ Alerts & Anomalies</h2>
          <div className="anomalies-list">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className={`anomaly-card anomaly-${anomaly.severity}`}>
                <div className="anomaly-header">
                  <span className="anomaly-type">{anomaly.type}</span>
                  <span className="anomaly-severity">{anomaly.severity}</span>
                </div>
                <p className="anomaly-message">{anomaly.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      <div className="insights-section">
        <h2>📊 Behavioral Patterns</h2>
        <div className="patterns-grid">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="pattern-card">
              <div className="pattern-header">
                <h3>{pattern.name}</h3>
                <div className="confidence-badge">{Math.round(pattern.confidence * 100)}% confident</div>
              </div>
              <p className="pattern-description">{pattern.description}</p>
              {Object.keys(pattern.data).length > 0 && (
                <div className="pattern-data">
                  {Object.entries(pattern.data).map(([key, value]) => (
                    <div key={key} className="data-point">
                      <span className="data-key">{key}:</span>
                      <span className="data-value">
                        {typeof value === 'number' ? value.toFixed(1) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Predictions */}
      <div className="insights-section">
        <h2>🔮 Forecasts (Next 30 Days)</h2>
        <div className="predictions-grid">
          {predictions.map((pred, idx) => (
            <div key={idx} className="prediction-card">
              <div className="prediction-header">
                <h3>{pred.metric}</h3>
                <span className={`trend-badge ${pred.currentTrend}`}>
                  {pred.currentTrend === 'increasing'
                    ? '📈'
                    : pred.currentTrend === 'decreasing'
                      ? '📉'
                      : '→'}
                  {pred.currentTrend.replace('-', ' ')}
                </span>
              </div>
              <div className="prediction-value">{Math.round(pred.forecast)}</div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${pred.confidence * 100}%` }} />
              </div>
              <span className="confidence-text">{Math.round(pred.confidence * 100)}% confidence</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h2>Key Insights</h2>
        <div className="filter-buttons">
          {(['all', 'productivity', 'pattern', 'achievement', 'recommendation', 'warning'] as const).map(
            (cat) => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all'
                  ? 'All'
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            )
          )}
        </div>

        {filteredInsights.length === 0 ? (
          <div className="no-insights">
            <p>No insights in this category yet.</p>
          </div>
        ) : (
          <div className="insights-list">
            {filteredInsights.map((insight) => (
              <div key={insight.id} className={`insight-card ${getSeverityClass(insight.severity)}`}>
                <div className="insight-icon">{getSeverityIcon(insight.severity)}</div>
                <div className="insight-content">
                  <h3 className="insight-title">{insight.title}</h3>
                  <p className="insight-description">{insight.description}</p>
                  {insight.actionable && insight.suggestedAction && (
                    <div className="insight-action">
                      <strong>Suggested action:</strong> {insight.suggestedAction}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="insights-section">
        <h2>💡 Recommendations</h2>
        <div className="recommendations-list">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`recommendation-card priority-${rec.priority}`}>
              <div className="recommendation-header">
                <h3>{rec.title}</h3>
                <span className="priority-badge">{rec.priority}</span>
              </div>
              <p className="recommendation-description">{rec.description}</p>
              <div className="action-steps">
                <strong>Action steps:</strong>
                <ol>
                  {rec.actionSteps.map((step, stepIdx) => (
                    <li key={stepIdx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
