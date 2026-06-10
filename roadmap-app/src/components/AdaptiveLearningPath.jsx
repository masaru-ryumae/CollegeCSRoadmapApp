import React, { useState, useEffect } from 'react';
import {
  calculateOptimalDifficulty,
  estimateTimeToCompletion,
  suggestOptimalNextSteps,
  calculateCompletionMetrics,
  trackLearningVelocity
} from '../services/adaptiveAlgorithm';
import moduleData from '../data/MODULE_DATA.json';
import './AdaptiveLearningPath.css';

export function AdaptiveLearningPath({ userId, roadmap, currentProgress, onNavigateToModule }) {
  const [difficulty, setDifficulty] = useState(null);
  const [nextSteps, setNextSteps] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (roadmap && currentProgress) {
      // Calculate current performance
      const completedCount = currentProgress.filter(p => p.status === 'done').length;
      const totalCount = currentProgress.length;
      const currentPerformance = totalCount > 0 ? completedCount / totalCount : 0.5;
      const completionRate = currentPerformance;

      // Get optimal difficulty
      const difficultyRecommendation = calculateOptimalDifficulty(
        userId,
        currentPerformance,
        completionRate,
        roadmap.answers.techLevel
      );
      setDifficulty(difficultyRecommendation);

      // Get next optimal steps
      const allModules = moduleData.modules;
      const steps = suggestOptimalNextSteps(
        userId,
        roadmap,
        currentProgress,
        allModules
      );
      setNextSteps(steps);

      // Calculate completion metrics
      const completionMetrics = calculateCompletionMetrics(userId, roadmap, currentProgress);
      setMetrics(completionMetrics);
    }
  }, [userId, roadmap, currentProgress]);

  if (!difficulty || !metrics) {
    return <div className="adaptive-learning-path loading">Loading adaptive recommendations...</div>;
  }

  const allModules = moduleData.modules;
  const nextModules = nextSteps
    .map(moduleId => allModules.find(m => m.id === moduleId))
    .filter(Boolean);

  const timeEstimates = nextModules.map(module =>
    estimateTimeToCompletion(module, userId, difficulty.recommended)
  );

  return (
    <div className="adaptive-learning-path">
      <div className="path-header">
        <h2>Your Adaptive Learning Path</h2>
        <p className="subtitle">Personalized progression based on your performance</p>
      </div>

      {/* Difficulty Progression */}
      <div className="section difficulty-section">
        <h3>Difficulty Level Adjustment</h3>

        {difficulty.shouldAdjust ? (
          <div className="alert alert-info">
            <strong>Recommendation:</strong> {difficulty.reason}
          </div>
        ) : (
          <div className="alert alert-success">
            Keep your current difficulty. You're progressing well!
          </div>
        )}

        <div className="difficulty-progression">
          <div className="progression-track">
            {difficulty.progressionPath.map((level, index) => (
              <div
                key={level}
                className={`progression-step ${
                  level === difficulty.current ? 'current' :
                  level === difficulty.recommended ? 'recommended' :
                  'disabled'
                }`}
                title={`${level.charAt(0).toUpperCase() + level.slice(1)} Level`}
              >
                <div className="step-label">{level.charAt(0).toUpperCase()}</div>
                {index === 1 && <div className="current-indicator">You are here</div>}
              </div>
            ))}
          </div>

          <div className="readiness-info">
            <div className="readiness-bar">
              <div className="label">Readiness for Next Level:</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${difficulty.readinessScore * 100}%` }}
                >
                  <span className="percentage">{(difficulty.readinessScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            {difficulty.readinessScore < 0.7 && (
              <p className="guidance">
                You need {((0.7 - difficulty.readinessScore) * 100).toFixed(0)}% more readiness before advancing.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="section next-steps-section">
        <h3>Recommended Next Steps</h3>
        <p className="section-description">
          These modules are perfectly timed for your current progress
        </p>

        <div className="next-steps-list">
          {nextModules.length > 0 ? (
            nextModules.map((module, index) => {
              const timeEst = timeEstimates[index];
              return (
                <div key={module.id} className="next-step-card">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h4>{module.name}</h4>
                    <p className="description">{module.description}</p>

                    <div className="step-details">
                      <div className="detail">
                        <span className="label">Est. Time:</span>
                        <span className="value">
                          {timeEst.estimatedWeeks} week{timeEst.estimatedWeeks !== 1 ? 's' : ''}
                          ({timeEst.estimatedHours.toFixed(1)} hrs)
                        </span>
                      </div>
                      <div className="detail">
                        <span className="label">Confidence:</span>
                        <span className="value">{(timeEst.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="step-skills">
                      {module.key_points.slice(0, 2).map((skill, idx) => (
                        <span key={idx} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-start"
                    onClick={() => onNavigateToModule(module.id)}
                  >
                    Start
                  </button>
                </div>
              );
            })
          ) : (
            <p className="no-steps">All modules completed! Congratulations!</p>
          )}
        </div>
      </div>

      {/* Completion Metrics */}
      <div className="section metrics-section">
        <h3>Learning Progress & Timeline</h3>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{metrics.overallProgress}%</div>
            <div className="metric-label">Overall Progress</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{metrics.velocity.hoursPerWeek.toFixed(1)}</div>
            <div className="metric-label">Hrs/Week</div>
            <div className="metric-subtext">
              <span className={`trend ${metrics.velocity.trend}`}>
                {metrics.velocity.trend === 'accelerating' ? '↑' :
                 metrics.velocity.trend === 'decelerating' ? '↓' : '→'}
                {metrics.velocity.trend}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{metrics.daysRemaining}</div>
            <div className="metric-label">Days Remaining</div>
          </div>

          <div className="metric-card">
            <div className={`metric-value ${metrics.isOnTrack ? 'on-track' : 'off-track'}`}>
              {metrics.isOnTrack ? '✓ On Track' : '⚠ Behind'}
            </div>
            <div className="metric-label">Status</div>
          </div>
        </div>

        <div className="completion-forecast">
          <div className="forecast-item">
            <span className="label">Original Deadline:</span>
            <span className="value">{new Date(roadmap.deadline).toLocaleDateString()}</span>
          </div>
          <div className="forecast-item">
            <span className="label">Est. Completion Date:</span>
            <span className={`value ${metrics.daysRemaining < 0 ? 'past-due' : ''}`}>
              {new Date(metrics.estimatedCompletionDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {metrics.riskFactors.length > 0 && (
          <div className="risk-assessment">
            <h4>⚠️ Risk Factors</h4>
            <ul>
              {metrics.riskFactors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Learning Velocity Detail */}
      <div className="section velocity-section">
        <button
          className="section-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          <h3>Learning Velocity Analysis {showDetails ? '▼' : '▶'}</h3>
        </button>

        {showDetails && (
          <div className="velocity-details">
            <div className="velocity-chart">
              <div className="chart-item">
                <span className="label">Modules/Week:</span>
                <span className="value">{metrics.velocity.modulesPerWeek.toFixed(2)}</span>
              </div>
              <div className="chart-item">
                <span className="label">Hours/Week:</span>
                <span className="value">{metrics.velocity.hoursPerWeek.toFixed(1)}</span>
              </div>
              <div className="chart-item">
                <span className="label">Est. Total Time:</span>
                <span className="value">{metrics.velocity.estimatedCompletionTime.toFixed(0)} weeks</span>
              </div>
            </div>

            <p className="velocity-insight">
              Based on your learning pattern, you're covering approximately{' '}
              <strong>{metrics.velocity.hoursPerWeek.toFixed(1)} hours per week</strong>. Your trend is{' '}
              <strong>{metrics.velocity.trend}</strong>. {
                metrics.velocity.trend === 'accelerating'
                  ? 'Keep up the momentum!'
                  : metrics.velocity.trend === 'decelerating'
                  ? 'Consider reducing distractions or increasing focus time.'
                  : 'You\'re maintaining a consistent pace.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
