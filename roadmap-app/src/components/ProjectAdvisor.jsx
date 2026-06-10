/**
 * Project Advisor Component - Project planning and guidance
 */

import React, { useState } from 'react';
import { projectAdvisor } from '../services/projectAdvisor';
import './ProjectAdvisor.css';

export function ProjectAdvisor({ isOpen, onClose, projectData }) {
  const [view, setView] = useState('next-steps'); // 'next-steps', 'blockers', 'resources', 'complexity', 'alternatives'
  const [results, setResults] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const handleGetNextSteps = () => {
    const nextSteps = projectAdvisor.suggestNextSteps(projectData);
    setResults(nextSteps);
    setView('next-steps');
  };

  const handleIdentifyBlockers = () => {
    const blockers = projectAdvisor.identifyBlockers(projectData);
    setResults(blockers);
    setView('blockers');
  };

  const handleGetResources = () => {
    const resources = projectAdvisor.recommendResources(projectData);
    setResults(resources);
    setView('resources');
  };

  const handleComplexityAnalysis = () => {
    const complexity = projectAdvisor.estimateComplexity(projectData.description);
    setResults(complexity);
    setView('complexity');
  };

  const handleAlternativeApproaches = () => {
    const alternatives = projectAdvisor.suggestAlternativeApproach(projectData);
    setResults(alternatives);
    setView('alternatives');
  };

  if (!isOpen) return null;

  return (
    <div className="project-advisor-overlay" onClick={onClose}>
      <div className="project-advisor-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="advisor-header">
          <div className="header-content">
            <h2>🎯 Project Advisor</h2>
            <p className="project-name">{projectData?.name || 'Project'}</p>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <div className="advisor-nav">
          <button
            className={`nav-btn ${view === 'next-steps' ? 'active' : ''}`}
            onClick={handleGetNextSteps}
          >
            📋 Next Steps
          </button>
          <button
            className={`nav-btn ${view === 'blockers' ? 'active' : ''}`}
            onClick={handleIdentifyBlockers}
          >
            🚧 Blockers
          </button>
          <button
            className={`nav-btn ${view === 'resources' ? 'active' : ''}`}
            onClick={handleGetResources}
          >
            📚 Resources
          </button>
          <button
            className={`nav-btn ${view === 'complexity' ? 'active' : ''}`}
            onClick={handleComplexityAnalysis}
          >
            📊 Complexity
          </button>
          <button
            className={`nav-btn ${view === 'alternatives' ? 'active' : ''}`}
            onClick={handleAlternativeApproaches}
          >
            💡 Alternatives
          </button>
        </div>

        {/* Content Area */}
        <div className="advisor-content">
          {!results ? (
            <div className="empty-state">
              <p>👈 Click on any advisor option to get started</p>
            </div>
          ) : view === 'next-steps' ? (
            <div className="next-steps-view">
              <div className="rationale-card">
                <h3>Your Path Forward</h3>
                <p>{results.rationale}</p>
              </div>

              <div className="steps-section">
                <h3>🚀 Immediate (This Week)</h3>
                <ul className="steps-list">
                  {results.immediate.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-number">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="steps-section">
                <h3>📈 Short Term (1-2 weeks)</h3>
                <ul className="steps-list">
                  {results.shortTerm.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-number">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="steps-section">
                <h3>🎯 Long Term (1+ month)</h3>
                <ul className="steps-list">
                  {results.longTerm.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-number">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : view === 'blockers' ? (
            <div className="blockers-view">
              <div className="summary-card">
                <h3>Blocker Analysis</h3>
                <p>{results.summary}</p>
              </div>

              {results.blockers.length === 0 ? (
                <div className="success-message">
                  ✅ No major blockers detected! Your project is on track.
                </div>
              ) : (
                <div className="blockers-list">
                  {results.blockers.map((blocker, idx) => (
                    <div
                      key={idx}
                      className={`blocker-item ${blocker.impact}`}
                      onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                    >
                      <div className="blocker-header">
                        <span className="impact-badge">{blocker.impact.toUpperCase()}</span>
                        <h4>{blocker.title}</h4>
                      </div>
                      {expandedItem === idx && (
                        <div className="blocker-suggestion">
                          <p>{blocker.suggestion}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : view === 'resources' ? (
            <div className="resources-view">
              <div className="resources-grid">
                {results.map((resource, idx) => (
                  <div
                    key={idx}
                    className={`resource-card ${resource.type} ${resource.difficulty}`}
                  >
                    <div className="resource-type">{resource.type.toUpperCase()}</div>
                    <h4>{resource.title}</h4>
                    <p className="resource-description">{resource.description}</p>
                    <div className="resource-meta">
                      <span className="difficulty">{resource.difficulty}</span>
                      {resource.duration && (
                        <span className="duration">⏱️ {resource.duration}</span>
                      )}
                    </div>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                        Learn More →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : view === 'complexity' ? (
            <div className="complexity-view">
              <div className="complexity-header">
                <h3>Project Complexity Analysis</h3>
                <div className={`complexity-badge ${results.level}`}>
                  {results.level.toUpperCase()}
                </div>
              </div>

              <div className="complexity-card">
                <h4>Estimated Duration</h4>
                <p className="duration-text">{results.estimatedTime}</p>
              </div>

              <div className="complexity-card">
                <h4>Complexity Factors</h4>
                <ul>
                  {results.factors.map((factor, idx) => (
                    <li key={idx}>
                      <span className="factor-bullet">→</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="complexity-card">
                <h4>Required Skills</h4>
                <div className="skills-tags">
                  {results.skillsNeeded.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : view === 'alternatives' ? (
            <div className="alternatives-view">
              {results.map((alternative, idx) => (
                <div
                  key={idx}
                  className="alternative-card"
                  onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                >
                  <h3>{alternative.approach}</h3>

                  <div className="alternative-section">
                    <h4>✅ Pros</h4>
                    <ul>
                      {alternative.pros.map((pro, pidx) => (
                        <li key={pidx}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="alternative-section">
                    <h4>❌ Cons</h4>
                    <ul>
                      {alternative.cons.map((con, cidx) => (
                        <li key={cidx}>{con}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="timeline">
                    <strong>Timeline:</strong> {alternative.timeline}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
