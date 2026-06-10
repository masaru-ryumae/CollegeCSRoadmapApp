/**
 * Learning Path Component - Visual learning path display
 */

import React, { useState } from 'react';
import { learningPathGenerator } from '../services/learningPathGenerator';
import './LearningPath.css';

export function LearningPath({ isOpen, onClose, goal }) {
  const [learningPath, setLearningPath] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [expandedResource, setExpandedResource] = useState(null);
  const [prerequisites, setPrerequisites] = useState(null);
  const [masteryInfo, setMasteryInfo] = useState(null);
  const [view, setView] = useState('path'); // 'path', 'prerequisites', 'mastery'
  const [inputGoal, setInputGoal] = useState(goal || '');

  const handleGeneratePath = () => {
    if (!inputGoal.trim()) return;

    const path = learningPathGenerator.generateLearningPath(inputGoal);
    setLearningPath(path);
    setView('path');

    // Also get milestones
    const milestones = learningPathGenerator.createMilestones(inputGoal);
    path.milestones = milestones;
  };

  const handleGetPrerequisites = () => {
    if (!inputGoal.trim()) return;

    const prereqs = learningPathGenerator.suggestPrerequisites(inputGoal);
    setPrerequisites(prereqs);
    setView('prerequisites');
  };

  const handleGetMasteryInfo = () => {
    if (!inputGoal.trim()) return;

    const mastery = learningPathGenerator.estimateTimeToMastery(inputGoal);
    setMasteryInfo(mastery);
    setView('mastery');
  };

  const handleCompleteStep = (stepId) => {
    if (learningPath) {
      const updatedPath = {
        ...learningPath,
        steps: learningPath.steps.map(step =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        )
      };
      setLearningPath(updatedPath);
    }
  };

  const completedSteps = learningPath?.steps.filter(s => s.completed).length || 0;
  const totalSteps = learningPath?.steps.length || 0;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="learning-path-overlay" onClick={onClose}>
      <div className="learning-path-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="path-header">
          <h2>🎓 Learning Path Generator</h2>
          <button
            className="close-button"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Input Section */}
        {!learningPath && (
          <div className="input-section">
            <div className="input-group">
              <input
                type="text"
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="E.g., 'Web Development', 'Machine Learning', 'System Design'"
                className="goal-input"
                onKeyPress={(e) => e.key === 'Enter' && handleGeneratePath()}
              />
              <button
                className="generate-btn"
                onClick={handleGeneratePath}
                disabled={!inputGoal.trim()}
              >
                Generate Path
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {learningPath && (
          <div className="path-tabs">
            <button
              className={`tab ${view === 'path' ? 'active' : ''}`}
              onClick={() => setView('path')}
            >
              📚 Learning Path
            </button>
            <button
              className={`tab ${view === 'prerequisites' ? 'active' : ''}`}
              onClick={handleGetPrerequisites}
            >
              📖 Prerequisites
            </button>
            <button
              className={`tab ${view === 'mastery' ? 'active' : ''}`}
              onClick={handleGetMasteryInfo}
            >
              ⏱️ Time to Mastery
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="path-content">
          {!learningPath ? (
            <div className="welcome-state">
              <h3>Welcome to Learning Path Generator! 🚀</h3>
              <p>Enter a skill or goal above to create a personalized learning roadmap.</p>
              <div className="examples">
                <p><strong>Popular paths:</strong></p>
                <div className="example-tags">
                  {[
                    'Web Development',
                    'Mobile Development',
                    'Machine Learning',
                    'Algorithms',
                    'System Design',
                    'DevOps'
                  ].map(ex => (
                    <button
                      key={ex}
                      className="example-tag"
                      onClick={() => {
                        setInputGoal(ex);
                        setTimeout(() => {
                          const path = learningPathGenerator.generateLearningPath(ex);
                          setLearningPath(path);
                          setView('path');
                        }, 0);
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : view === 'path' ? (
            <div className="path-view">
              <div className="path-header-info">
                <h3>{learningPath.goal}</h3>
                <p className="path-description">{learningPath.description}</p>
                <div className="path-meta">
                  <div className="meta-item">
                    <strong>Duration:</strong> {learningPath.estimatedDuration}
                  </div>
                  <div className="meta-item">
                    <strong>Difficulty:</strong> <span className={`difficulty-badge ${learningPath.difficulty}`}>
                      {learningPath.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-header">
                  <span>Progress: {completedSteps}/{totalSteps} steps</span>
                  <span className="progress-percent">{progressPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>

              {/* Prerequisites */}
              {learningPath.prerequisites.length > 0 && (
                <div className="prerequisites-banner">
                  <strong>Prerequisites:</strong>
                  <div className="prereq-tags">
                    {learningPath.prerequisites.map((prereq, idx) => (
                      <span key={idx} className="prereq-tag">{prereq}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {learningPath.milestones && (
                <div className="milestones-section">
                  <h4>🏆 Milestones</h4>
                  <div className="milestones-grid">
                    {learningPath.milestones.map((milestone, idx) => {
                      const isReached = Math.ceil((completedSteps / totalSteps) * 100) >= (milestone.step / totalSteps * 100);
                      return (
                        <div key={idx} className={`milestone-card ${isReached ? 'reached' : ''}`}>
                          <div className="milestone-marker">
                            {isReached ? '✓' : milestone.step}
                          </div>
                          <h5>{milestone.title}</h5>
                          <p>{milestone.description}</p>
                          {milestone.reward && <div className="milestone-reward">{milestone.reward}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="steps-section">
                <h4>📋 Learning Steps</h4>
                <div className="steps-list">
                  {learningPath.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`step-card ${step.completed ? 'completed' : ''}`}
                    >
                      <div className="step-header">
                        <div className="step-number-badge">
                          {idx + 1}
                        </div>
                        <div className="step-info">
                          <h4>{step.title}</h4>
                          <p className="step-description">{step.description}</p>
                          <div className="step-meta">
                            <span className="difficulty-label">{step.difficulty}</span>
                            <span className="time-estimate">⏱️ ~{step.estimatedHours} hours</span>
                          </div>
                        </div>
                        <button
                          className={`checkbox-btn ${step.completed ? 'checked' : ''}`}
                          onClick={() => handleCompleteStep(step.id)}
                          title="Mark as complete"
                        >
                          {step.completed ? '✓' : '○'}
                        </button>
                      </div>

                      {/* Expandable Content */}
                      {expandedStep === step.id && (
                        <div className="step-details">
                          {/* Resources */}
                          <div className="resources-subsection">
                            <h5>📚 Resources</h5>
                            <div className="resources-list">
                              {step.resources.map((resource, ridx) => (
                                <div
                                  key={ridx}
                                  className={`resource-item ${resource.type}`}
                                  onClick={() => setExpandedResource(
                                    expandedResource === `${step.id}-${ridx}` ? null : `${step.id}-${ridx}`
                                  )}
                                >
                                  <div className="resource-header">
                                    <span className="resource-type">{resource.type.toUpperCase()}</span>
                                    <span className="resource-title">{resource.title}</span>
                                    {resource.duration && (
                                      <span className="resource-duration">{resource.duration}</span>
                                    )}
                                  </div>
                                  {expandedResource === `${step.id}-${ridx}` && (
                                    <p className="resource-description">{resource.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Exercises */}
                          <div className="exercises-subsection">
                            <h5>💪 Practice Exercises</h5>
                            <div className="exercises-list">
                              {step.exercises.map((exercise, eidx) => (
                                <div key={eidx} className={`exercise-item ${exercise.difficulty}`}>
                                  <div className="exercise-difficulty">{exercise.difficulty}</div>
                                  <h6>{exercise.title}</h6>
                                  <p>{exercise.description}</p>
                                  <div className="exercise-time">⏱️ ~{exercise.estimatedTime} min</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        className="expand-btn"
                        onClick={() => setExpandedStep(
                          expandedStep === step.id ? null : step.id
                        )}
                      >
                        {expandedStep === step.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : view === 'prerequisites' && prerequisites ? (
            <div className="prerequisites-view">
              <h3>Prerequisites for {inputGoal}</h3>
              <div className="prerequisites-list">
                {prerequisites.length === 0 ? (
                  <p className="no-prerequisites">No prerequisites required. You can start right away!</p>
                ) : (
                  prerequisites.map((prereq, idx) => (
                    <div key={idx} className="prerequisite-card">
                      <div className="prereq-number">{idx + 1}</div>
                      <div className="prereq-content">
                        <h4>{prereq.skill}</h4>
                        <p className="prereq-why">{prereq.why}</p>
                        <div className="prereq-time">
                          <strong>Estimated Time:</strong> {prereq.estimatedTime}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : view === 'mastery' && masteryInfo ? (
            <div className="mastery-view">
              <h3>Time to Mastery: {inputGoal}</h3>

              <div className="mastery-levels">
                <div className="level-card beginner">
                  <h4>🌱 Beginner</h4>
                  <p className="level-time">{masteryInfo.beginner}</p>
                  <p className="level-description">Basic understanding and simple tasks</p>
                </div>

                <div className="level-card intermediate">
                  <h4>📚 Intermediate</h4>
                  <p className="level-time">{masteryInfo.intermediate}</p>
                  <p className="level-description">Can work on real projects independently</p>
                </div>

                <div className="level-card advanced">
                  <h4>⭐ Advanced</h4>
                  <p className="level-time">{masteryInfo.advanced}</p>
                  <p className="level-description">Expert-level problem solving</p>
                </div>

                <div className="level-card master">
                  <h4>🏆 Master</h4>
                  <p className="level-time">{masteryInfo.master}</p>
                  <p className="level-description">Can teach others and innovate</p>
                </div>
              </div>

              <div className="tips-section">
                <h4>💡 Tips for Success</h4>
                <ul className="tips-list">
                  {masteryInfo.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
