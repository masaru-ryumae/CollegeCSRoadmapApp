import { useState, useEffect } from 'react';
import {
  getAllSkills,
  getUserSkillProgress,
  getNextSkills,
  getSkillPrerequisites,
  calculateSkillLevel,
  getMilestones,
  getSkillsByCategory,
  updateSkillProgress,
  type Skill,
  type SkillProgress,
  type Milestone
} from '../utils/skillProgression';
import './SkillProgressionMap.css';

interface SkillProgressionMapProps {
  userId: string;
}

type ViewMode = 'roadmap' | 'progression' | 'milestones';

export function SkillProgressionMap({ userId }: SkillProgressionMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('roadmap');
  const [userProgress, setUserProgress] = useState<SkillProgress[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [nextSkills, setNextSkills] = useState<Skill[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = () => {
    const progress = getUserSkillProgress(userId);
    setUserProgress(progress);
    setAllSkills(getAllSkills());
    setNextSkills(getNextSkills(userId));
    setMilestones(getMilestones(userId));
    setOverallProgress(calculateSkillLevel(userId));
  };

  const getProgressStatus = (skillId: string): SkillProgress | undefined => {
    return userProgress.find(sp => sp.skillId === skillId);
  };

  const handleProgressUpdate = (skillId: string, newProgress: number) => {
    const updated = updateSkillProgress(userId, skillId, { progress: newProgress });
    if (updated) {
      loadData();
    }
  };

  const getSkillColor = (level: SkillProgress['level']): string => {
    switch (level) {
      case 'expert': return '#4caf50';
      case 'proficient': return '#2196f3';
      case 'learning': return '#ff9800';
      case 'not-started': return '#e0e0e0';
      default: return '#ccc';
    }
  };

  return (
    <div className="skill-progression-map">
      {/* Header */}
      <div className="sp-header">
        <h1>Skill Progression Path</h1>
        <div className="overall-progress">
          <div className="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#e0e0e0" strokeWidth="4" />
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="#667eea"
                strokeWidth="4"
                strokeDasharray={`${(overallProgress / 100) * 345.6} 345.6`}
                style={{ transition: 'stroke-dasharray 0.3s' }}
              />
            </svg>
            <div className="progress-text">
              <span className="percentage">{overallProgress}%</span>
              <span className="label">Overall</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-tabs">
        <button
          className={`tab ${viewMode === 'roadmap' ? 'active' : ''}`}
          onClick={() => setViewMode('roadmap')}
        >
          Roadmap
        </button>
        <button
          className={`tab ${viewMode === 'progression' ? 'active' : ''}`}
          onClick={() => setViewMode('progression')}
        >
          My Progress
        </button>
        <button
          className={`tab ${viewMode === 'milestones' ? 'active' : ''}`}
          onClick={() => setViewMode('milestones')}
        >
          Milestones
        </button>
      </div>

      {/* Content */}
      <div className="sp-content">
        {/* Roadmap View */}
        {viewMode === 'roadmap' && (
          <div className="roadmap-view">
            <h2>Recommended Learning Path</h2>
            <p className="view-description">
              Skills you should learn next, unlocked by completed prerequisites
            </p>

            {nextSkills.length === 0 ? (
              <div className="empty-state">
                <p>You've mastered all available skills!</p>
              </div>
            ) : (
              <div className="skills-grid">
                {nextSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="skill-card recommended"
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <div className="skill-icon">{skill.icon}</div>
                    <h3>{skill.name}</h3>
                    <p className="skill-category">{skill.category}</p>
                    <p className="skill-description">{skill.description}</p>
                    <div className="skill-meta">
                      <span className="badge hours">⏱ {skill.estimatedHours}h</span>
                      <span className={`badge level level-${skill.level}`}>
                        {skill.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progression View */}
        {viewMode === 'progression' && (
          <div className="progression-view">
            <h2>Skill Development</h2>

            {/* Skills by Category */}
            {['Programming', 'Web Development', 'DSA', 'Architecture', 'Data Science', 'DevOps'].map(
              category => {
                const categorySkills = getSkillsByCategory(category);
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} className="category-section">
                    <h3>{category}</h3>
                    <div className="skills-list">
                      {categorySkills.map(skill => {
                        const progress = getProgressStatus(skill.id);
                        return (
                          <div
                            key={skill.id}
                            className="skill-progress-item"
                            onClick={() => setSelectedSkill(skill)}
                          >
                            <div className="skill-info">
                              <div className="skill-header">
                                <span className="skill-name">
                                  {skill.icon} {skill.name}
                                </span>
                                <span className={`level-badge ${progress?.level}`}>
                                  {progress?.level || 'not-started'}
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${progress?.progress || 0}%`,
                                    backgroundColor: getSkillColor(progress?.level || 'not-started')
                                  }}
                                />
                              </div>
                              <span className="progress-percentage">
                                {progress?.progress || 0}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Milestones View */}
        {viewMode === 'milestones' && (
          <div className="milestones-view">
            <h2>Achievement Milestones</h2>
            <p className="view-description">
              Track your major accomplishments
            </p>

            <div className="milestones-grid">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`milestone-card ${milestone.earned ? 'earned' : ''}`}
                >
                  <div className="milestone-icon">
                    {milestone.earned ? '⭐' : '◯'}
                  </div>
                  <h3>{milestone.name}</h3>
                  <p>{milestone.description}</p>
                  <div className="milestone-requirements">
                    <span className="label">Required Skills:</span>
                    <div className="skills-required">
                      {milestone.skillsRequired.map(skillId => {
                        const skill = allSkills.find(s => s.id === skillId);
                        return (
                          <span
                            key={skillId}
                            className={`skill-badge ${
                              getProgressStatus(skillId)?.level === 'expert' ? 'completed' : ''
                            }`}
                          >
                            {skill?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Skill Detail */}
      {selectedSkill && (
        <div className="skill-detail-panel">
          <button
            className="btn-close-detail"
            onClick={() => setSelectedSkill(null)}
          >
            ×
          </button>

          <div className="detail-content">
            <div className="detail-header">
              <span className="detail-icon">{selectedSkill.icon}</span>
              <h2>{selectedSkill.name}</h2>
            </div>

            <p className="detail-description">{selectedSkill.description}</p>

            {/* Skill Meta Information */}
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Category</span>
                <span className="meta-value">{selectedSkill.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Level</span>
                <span className={`meta-value level-${selectedSkill.level}`}>
                  {selectedSkill.level}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Est. Hours</span>
                <span className="meta-value">{selectedSkill.estimatedHours}</span>
              </div>
            </div>

            {/* Progress Slider */}
            {getProgressStatus(selectedSkill.id) && (
              <div className="progress-control">
                <label>Your Progress</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getProgressStatus(selectedSkill.id)?.progress || 0}
                  onChange={(e) => handleProgressUpdate(selectedSkill.id, parseInt(e.target.value))}
                  className="progress-slider"
                />
                <span className="progress-value">
                  {getProgressStatus(selectedSkill.id)?.progress || 0}%
                </span>
              </div>
            )}

            {/* Prerequisites */}
            {selectedSkill.prerequisites.length > 0 && (
              <div className="detail-section">
                <h3>Prerequisites</h3>
                <div className="prerequisites-list">
                  {getSkillPrerequisites(selectedSkill.id).map(prereq => {
                    const prereqProgress = getProgressStatus(prereq.id);
                    return (
                      <div
                        key={prereq.id}
                        className={`prereq-item ${
                          prereqProgress?.level === 'expert' ? 'completed' : ''
                        }`}
                      >
                        <span className="prereq-name">{prereq.icon} {prereq.name}</span>
                        {prereqProgress?.level === 'expert' && (
                          <span className="checkmark">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Projects */}
            {selectedSkill.projectsTeach.length > 0 && (
              <div className="detail-section">
                <h3>Projects That Teach This Skill</h3>
                <ul className="projects-list">
                  {selectedSkill.projectsTeach.map(projectId => (
                    <li key={projectId}>{projectId}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
