import { useState } from 'react';
import { Module, TechLevel } from '../types/index';
import {
  compareProjects,
  scoreForUser,
  analyzeProject,
  UserProfile,
  ProjectAnalysis,
} from '../utils/projectComparator';
import '../styles/ProjectComparison.css';

interface ProjectComparisonProps {
  modules: Module[];
  onClose?: () => void;
}

export function ProjectComparison({ modules, onClose }: ProjectComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    techLevel: 'intermediate',
    hoursPerWeek: 15,
  });
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [projectAnalyses, setProjectAnalyses] = useState<
    Record<string, ProjectAnalysis>
  >({});

  const handleSelectProject = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    } else {
      // Replace oldest selection
      setSelectedIds([...selectedIds.slice(1), id]);
    }
  };

  const comparison =
    selectedIds.length >= 2
      ? compareProjects(selectedIds, modules)
      : null;

  const handleAnalyzeProject = (id: string) => {
    if (!projectAnalyses[id]) {
      const module = modules.find((m) => m.id === id);
      if (module) {
        setProjectAnalyses({
          ...projectAnalyses,
          [id]: analyzeProject(module),
        });
      }
    }
    setActiveAnalysisId(activeAnalysisId === id ? null : id);
  };

  const scores = selectedIds
    .map((id) => {
      const module = modules.find((m) => m.id === id);
      return module
        ? scoreForUser(module, userProfile)
        : null;
    })
    .filter((s) => s !== null);

  return (
    <div className="project-comparison-container">
      <div className="comparison-header">
        <div>
          <h2>Project Comparison Tool</h2>
          <p>Compare 2-3 projects side-by-side to make the right choice</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="comparison-layout">
        <div className="selection-panel">
          <div className="user-profile-section">
            <h3>Your Profile</h3>
            <div className="profile-controls">
              <div className="control-group">
                <label htmlFor="tech-level">Skill Level</label>
                <select
                  id="tech-level"
                  value={userProfile.techLevel}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      techLevel: e.target.value as TechLevel,
                    })
                  }
                  className="select-input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="hours-week">
                  Available: {userProfile.hoursPerWeek}h/week
                </label>
                <input
                  id="hours-week"
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={userProfile.hoursPerWeek}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      hoursPerWeek: parseInt(e.target.value),
                    })
                  }
                  className="range-slider"
                />
              </div>
            </div>
          </div>

          <div className="project-selection-section">
            <h3>Select Projects ({selectedIds.length}/3)</h3>
            <div className="project-list">
              {modules.map((module) => {
                const isSelected = selectedIds.includes(module.id);
                const analysis = projectAnalyses[module.id];
                const isAnalyzed = activeAnalysisId === module.id;

                return (
                  <div key={module.id} className="project-item">
                    <div
                      className={`project-checkbox ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectProject(module.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectProject(module.id)}
                        aria-label={`Select ${module.name}`}
                      />
                      <div className="project-info">
                        <h4>{module.name}</h4>
                        <p className="project-meta">
                          {module.hours[userProfile.techLevel].toFixed(1)}h @{' '}
                          {userProfile.techLevel}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <button
                        onClick={() => handleAnalyzeProject(module.id)}
                        className="analyze-btn"
                        title="View pros and cons"
                      >
                        {isAnalyzed ? '▼' : '▶'} Details
                      </button>
                    )}

                    {isAnalyzed && analysis && (
                      <div className="analysis-details">
                        <div className="analysis-section">
                          <h5>✓ Pros</h5>
                          <ul>
                            {analysis.pros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="analysis-section">
                          <h5>✗ Cons</h5>
                          <ul>
                            {analysis.cons.length > 0 ? (
                              analysis.cons.map((con, i) => (
                                <li key={i}>{con}</li>
                              ))
                            ) : (
                              <li className="no-items">None identified</li>
                            )}
                          </ul>
                        </div>

                        <div className="analysis-section">
                          <h5>👥 Best For</h5>
                          <div className="tags">
                            {analysis.bestFor.length > 0 ? (
                              analysis.bestFor.map((tag, i) => (
                                <span key={i} className="tag">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="no-items">General audience</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {comparison && (
          <div className="comparison-panel">
            <div className="comparison-content">
              <h3>Comparison Summary</h3>

              <div className="summary-section">
                <h4>Overview</h4>
                <p>{comparison.summary.overview}</p>
              </div>

              <div className="summary-section">
                <h4>Time Commitment</h4>
                <p>{comparison.summary.timeCommitment}</p>
              </div>

              <div className="summary-section">
                <h4>Difficulty Options</h4>
                <p>{comparison.summary.difficulty}</p>
              </div>

              <div className="summary-section">
                <h4>Prerequisites</h4>
                <p>{comparison.summary.prerequisites}</p>
              </div>

              {comparison.summary.keyDifferences.length > 0 && (
                <div className="summary-section">
                  <h4>Key Differences</h4>
                  <ul className="differences-list">
                    {comparison.summary.keyDifferences.map((diff, i) => (
                      <li key={i}>{diff}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="recommendation-box">
                <h4>💡 Recommendation</h4>
                <p>{comparison.recommendation}</p>
              </div>

              <div className="comparison-table">
                <h4>Side-by-Side Metrics</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {comparison.projects.map((project) => (
                        <th key={project.id}>{project.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Time (Intermediate)</td>
                      {comparison.projects.map((project) => (
                        <td key={project.id}>
                          {project.hours.intermediate.toFixed(1)} hours
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Prerequisites</td>
                      {comparison.projects.map((project) => (
                        <td key={project.id}>{project.dependencies.length}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Topics Covered</td>
                      {comparison.projects.map((project) => (
                        <td key={project.id}>{project.key_points.length}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Difficulty Levels</td>
                      {comparison.projects.map((project) => {
                        const levels = [];
                        if (project.hours.beginner > 0) levels.push('B');
                        if (project.hours.intermediate > 0) levels.push('I');
                        if (project.hours.advanced > 0) levels.push('A');
                        return <td key={project.id}>{levels.join(', ')}</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {scores.length > 0 && (
                <div className="scoring-section">
                  <h4>Your Profile Match</h4>
                  <div className="scores-grid">
                    {scores.map((score) => (
                      <div key={score.project.id} className="score-card">
                        <div className="score-main">
                          <div className="project-name">
                            {score.project.name}
                          </div>
                          <div className="overall-score">
                            {score.score}%
                          </div>
                        </div>
                        <div className="score-breakdown">
                          <div className="score-item">
                            <span>Relevance</span>
                            <div className="score-bar">
                              <div
                                className="score-fill"
                                style={{
                                  width: `${score.breakdown.relevance}%`,
                                }}
                              />
                            </div>
                            <span className="score-value">
                              {score.breakdown.relevance}%
                            </span>
                          </div>
                          <div className="score-item">
                            <span>Feasibility</span>
                            <div className="score-bar">
                              <div
                                className="score-fill"
                                style={{
                                  width: `${score.breakdown.feasibility}%`,
                                }}
                              />
                            </div>
                            <span className="score-value">
                              {score.breakdown.feasibility}%
                            </span>
                          </div>
                          <div className="score-item">
                            <span>Interest</span>
                            <div className="score-bar">
                              <div
                                className="score-fill"
                                style={{
                                  width: `${score.breakdown.interest}%`,
                                }}
                              />
                            </div>
                            <span className="score-value">
                              {score.breakdown.interest}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedIds.length < 2 && (
          <div className="comparison-panel empty-state">
            <p>Select 2-3 projects to see a detailed comparison</p>
          </div>
        )}
      </div>
    </div>
  );
}

