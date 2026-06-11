import React from 'react';
import { useApp } from '../context/AppContext';
import {
  analyzePerformance,
  detectAnomalies,
  calculatePerformanceScore,
} from '../services/insightEngine';
import './InsightsPanel.css';

export function InsightsPanel() {
  const { state } = useApp();
  const { roadmap } = state;

  if (!roadmap) {
    return (
      <div className="insights-empty">
        <p>Start your roadmap to see insights.</p>
      </div>
    );
  }

  const performanceData = analyzePerformance(roadmap);
  const anomalies = detectAnomalies(roadmap);
  const performanceScore = calculatePerformanceScore(roadmap);

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <h2>Performance Insights</h2>
      </div>

      {/* Performance Score */}
      <div className="insights-section">
        <div className="score-card">
          <div className="score-circle">
            <div className="score-value">{performanceScore}</div>
            <div className="score-label">Performance Score</div>
          </div>
          <div className="score-details">
            <p className="score-summary">{performanceData.summary}</p>
            <div className="score-breakdown">
              <div className="breakdown-item">
                <span>Completion</span>
                <span className="breakdown-value">40%</span>
              </div>
              <div className="breakdown-item">
                <span>Consistency</span>
                <span className="breakdown-value">25%</span>
              </div>
              <div className="breakdown-item">
                <span>Speed</span>
                <span className="breakdown-value">20%</span>
              </div>
              <div className="breakdown-item">
                <span>Engagement</span>
                <span className="breakdown-value">15%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="insights-section">
        <h3>Key Metrics</h3>
        <div className="metrics-list">
          {Object.entries(performanceData.keyMetrics).map(([key, value]) => (
            <div key={key} className="metric-row">
              <span className="metric-name">{key}</span>
              <span className="metric-val">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Patterns */}
      {performanceData.patterns.length > 0 && (
        <div className="insights-section">
          <h3>Identified Patterns</h3>
          <div className="patterns-list">
            {performanceData.patterns.map((pattern, i) => (
              <div key={i} className="pattern-card">
                <div className="pattern-header">
                  <h4>{pattern.name}</h4>
                  <span className="confidence">
                    {Math.round(pattern.confidence * 100)}% confident
                  </span>
                </div>
                <p className="pattern-description">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="insights-section">
          <h3>Alerts & Anomalies</h3>
          <div className="anomalies-list">
            {anomalies.map((anomaly, i) => (
              <div key={i} className={`anomaly-card ${anomaly.severity}`}>
                <div className="anomaly-header">
                  <span className="anomaly-type">{anomaly.type}</span>
                  <span className={`anomaly-severity ${anomaly.severity}`}>
                    {anomaly.severity}
                  </span>
                </div>
                <p className="anomaly-message">{anomaly.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {performanceData.recommendations.length > 0 && (
        <div className="insights-section">
          <h3>Personalized Recommendations</h3>
          <div className="recommendations-list">
            {performanceData.recommendations.map((rec, i) => (
              <div key={i} className={`recommendation-card ${rec.priority}`}>
                <div className="recommendation-header">
                  <h4>{rec.title}</h4>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <div className="action-steps">
                  <span className="steps-label">Action Steps:</span>
                  <ol>
                    {rec.actionSteps.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions */}
      {performanceData.predictions.length > 0 && (
        <div className="insights-section">
          <h3>Future Predictions</h3>
          <div className="predictions-list">
            {performanceData.predictions.map((pred, i) => (
              <div key={i} className="prediction-card">
                <div className="prediction-metric">
                  <span className="metric-name">{pred.metric}</span>
                  <span className={`trend-badge ${pred.currentTrend}`}>
                    {pred.currentTrend}
                  </span>
                </div>
                <div className="prediction-value">
                  <strong>{pred.forecast}</strong>
                  <span className="confidence-text">
                    {Math.round(pred.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
