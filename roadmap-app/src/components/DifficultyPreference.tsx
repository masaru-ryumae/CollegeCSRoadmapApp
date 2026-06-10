import { useState, useEffect } from 'react';
import {
  analyzeUserProjects,
  suggestNextDifficulty,
  getSmartProjectRecommendations,
  getProgressionPath,
  getDifficultyInsights,
  type DifficultyLevel,
  type ProjectDifficulty,
  type ProgressionStep
} from '../utils/difficultyMatcher';
import './DifficultyPreference.css';

interface DifficultyPreferenceProps {
  userId: string;
}

export function DifficultyPreference({ userId }: DifficultyPreferenceProps) {
  const [analysis, setAnalysis] = useState(analyzeUserProjects(userId));
  const [recommendations, setRecommendations] = useState<ProjectDifficulty[]>([]);
  const [progressionPath, setProgressionPath] = useState<ProgressionStep[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<DifficultyLevel | 'all'>('all');
  const [insights, setInsights] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = () => {
    setAnalysis(analyzeUserProjects(userId));
    setRecommendations(getSmartProjectRecommendations(userId));
    setProgressionPath(getProgressionPath(userId));
    setInsights(getDifficultyInsights(userId));
  };

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case 'beginner': return '#4caf50';
      case 'intermediate': return '#ff9800';
      case 'advanced': return '#f44336';
      case 'expert': return '#9c27b0';
      default: return '#ccc';
    }
  };

  const getDifficultyIcon = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case 'beginner': return '🌱';
      case 'intermediate': return '📈';
      case 'advanced': return '🚀';
      case 'expert': return '⭐';
      default: return '❓';
    }
  };

  const filteredRecommendations =
    selectedFilter === 'all'
      ? recommendations
      : recommendations.filter(rec => rec.currentDifficulty === selectedFilter);

  return (
    <div className="difficulty-preference">
      {/* Header Section */}
      <div className="dp-header">
        <h1>Difficulty Matcher</h1>
        <p className="insight-message">{insights}</p>
      </div>

      {/* Current Level & Recommendation */}
      <div className="level-status">
        <div className="status-card current">
          <div className="status-header">
            <span className="level-icon">{getDifficultyIcon(analysis.currentLevel)}</span>
            <h2>Current Level</h2>
          </div>
          <p className="level-name">{analysis.currentLevel}</p>
          <div className="completion-info">
            <span className="label">Overall Progress</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${analysis.completionPercentage}%` }}
              />
            </div>
            <span className="percentage">{analysis.completionPercentage}%</span>
          </div>
        </div>

        <div className="status-separator">→</div>

        <div className="status-card recommended">
          <div className="status-header">
            <span className="level-icon">{getDifficultyIcon(analysis.recommendedNextLevel)}</span>
            <h2>Recommended Next</h2>
          </div>
          <p className="level-name">{analysis.recommendedNextLevel}</p>
          <div className="readiness-info">
            <span className="label">Readiness</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${analysis.readyToProgressPercentage}%`,
                  backgroundColor:
                    analysis.readyToProgressPercentage >= 60 ? '#4caf50' : '#ff9800'
                }}
              />
            </div>
            <span className="percentage">{analysis.readyToProgressPercentage}%</span>
          </div>
          {analysis.readyToProgressPercentage >= 60 && (
            <button className="btn-ready">Ready to Level Up!</button>
          )}
        </div>
      </div>

      {/* Progression Path */}
      <div className="progression-section">
        <h2>Your Progression Path</h2>
        <div className="progression-path">
          {progressionPath.map((step, idx) => (
            <div key={step.level} className="progression-step">
              <div
                className={`step-visual ${step.isCurrentLevel ? 'current' : ''} ${
                  step.isRecommendedNext ? 'recommended' : ''
                }`}
                style={{ borderColor: getDifficultyColor(step.level) }}
              >
                <div
                  className="step-circle"
                  style={{ backgroundColor: getDifficultyColor(step.level) }}
                >
                  {getDifficultyIcon(step.level)}
                </div>
                <span className="step-name">{step.level}</span>
              </div>

              <div className="step-stats">
                <div className="stat">
                  <span className="stat-label">Projects</span>
                  <span className="stat-value">
                    {step.completed}/{step.total}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Progress</span>
                  <span className="stat-value">{step.percentage}%</span>
                </div>
              </div>

              {idx < progressionPath.length - 1 && (
                <div className="step-connector">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <div className="recommendations-header">
          <h2>Project Recommendations</h2>
          <div className="difficulty-filter">
            <button
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map(
              level => (
                <button
                  key={level}
                  className={`filter-btn ${selectedFilter === level ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(level)}
                  style={{
                    borderColor: getDifficultyColor(level),
                    color: selectedFilter === level ? 'white' : getDifficultyColor(level),
                    backgroundColor:
                      selectedFilter === level ? getDifficultyColor(level) : 'white'
                  }}
                >
                  {getDifficultyIcon(level)} {level}
                </button>
              )
            )}
          </div>
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className="empty-recommendations">
            <p>No projects available for this difficulty level yet.</p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {filteredRecommendations.map(project => (
              <div
                key={project.projectId}
                className="recommendation-card"
                style={{ borderLeftColor: getDifficultyColor(project.currentDifficulty) }}
              >
                <div className="card-header">
                  <h3>{project.name}</h3>
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(project.currentDifficulty) }}
                  >
                    {getDifficultyIcon(project.currentDifficulty)} {project.currentDifficulty}
                  </span>
                </div>

                {/* Match Score */}
                <div className="match-score">
                  <span className="label">Match Score</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${project.matchScore}%`,
                        backgroundColor:
                          project.matchScore >= 75
                            ? '#4caf50'
                            : project.matchScore >= 50
                              ? '#ff9800'
                              : '#f44336'
                      }}
                    />
                  </div>
                  <span className="score-value">{project.matchScore}%</span>
                </div>

                {/* Recommendation Reason */}
                {project.matchScore >= 75 && (
                  <p className="recommendation-reason">
                    Perfect fit! Prerequisites met and matches your skill level.
                  </p>
                )}
                {project.matchScore >= 50 && project.matchScore < 75 && (
                  <p className="recommendation-reason">
                    Good fit! You're ready to tackle this project.
                  </p>
                )}
                {project.matchScore < 50 && (
                  <p className="recommendation-reason">
                    Interesting option! Complete some prerequisites first.
                  </p>
                )}

                <button className="btn-start-project">
                  Start Project →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h2>💡 Pro Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>Start Small</h3>
            <p>
              Complete beginner projects first to build confidence and foundational skills.
            </p>
          </div>
          <div className="tip-card">
            <h3>Build Momentum</h3>
            <p>
              Move to intermediate projects once you've mastered 60%+ of beginner projects.
            </p>
          </div>
          <div className="tip-card">
            <h3>Mix It Up</h3>
            <p>
              Don't rush to the hardest difficulty. Variety helps you learn different concepts.
            </p>
          </div>
          <div className="tip-card">
            <h3>Track Progress</h3>
            <p>
              Mark projects as complete to get better recommendations and motivation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
