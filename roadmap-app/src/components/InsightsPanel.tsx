import React, { useState, useEffect } from 'react';
import insightEngine, { UserMetrics, Insight } from '../services/insightEngine';
import './InsightsPanel.css';

const InsightsPanel: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'recommendations' | 'weaknesses' | 'motivation' | 'comparison'
  >('all');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [motivationScore, setMotivationScore] = useState(0);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  // Mock user metrics
  const mockMetrics: UserMetrics = {
    projectsCompleted: 24,
    xpEarned: 4850,
    completionRate: 87,
    averageTimePerProject: 3.8,
    streakDays: 12,
    skills: [
      { name: 'JavaScript', proficiency: 85, timeSpent: 150 },
      { name: 'React', proficiency: 80, timeSpent: 120 },
      { name: 'TypeScript', proficiency: 75, timeSpent: 100 },
      { name: 'Node.js', proficiency: 70, timeSpent: 90 },
      { name: 'Database Design', proficiency: 45, timeSpent: 60 },
      { name: 'Problem Solving', proficiency: 72, timeSpent: 80 },
    ],
    recentProjects: [
      {
        title: 'Build a REST API',
        category: 'Backend',
        difficulty: 'Intermediate',
        timeSpent: 3.5,
        completedAt: new Date('2024-12-10'),
      },
      {
        title: 'React Hooks Deep Dive',
        category: 'Frontend',
        difficulty: 'Advanced',
        timeSpent: 4.2,
        completedAt: new Date('2024-12-09'),
      },
      {
        title: 'Database Optimization',
        category: 'Backend',
        difficulty: 'Advanced',
        timeSpent: 5.1,
        completedAt: new Date('2024-12-07'),
      },
    ],
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);

    // Generate insights
    const allInsights = insightEngine.generateAllInsights(mockMetrics);
    setInsights(allInsights.allInsights);

    // Calculate motivation score
    const score = insightEngine.calculateMotivationScore(mockMetrics);
    setMotivationScore(score);

    // Get motivational message
    const message = insightEngine.getMotivationalMessage(mockMetrics);
    setMotivationalMessage(message);
  }, []);

  const getFilteredInsights = (): Insight[] => {
    if (activeCategory === 'all') return insights;

    const categoryMap: {
      [key: string]: Insight['type'][];
    } = {
      recommendations: ['suggestion', 'achievement'],
      weaknesses: ['warning'],
      motivation: ['celebration'],
      comparison: ['achievement'],
    };

    const types = categoryMap[activeCategory] || [];
    return insights.filter((insight) => types.includes(insight.type));
  };

  const getInsightColor = (type: Insight['type']): string => {
    switch (type) {
      case 'achievement':
        return 'success';
      case 'suggestion':
        return 'info';
      case 'warning':
        return 'warning';
      case 'celebration':
        return 'celebration';
      default:
        return 'info';
    }
  };

  const getInsightIcon = (type: Insight['type']): string => {
    switch (type) {
      case 'achievement':
        return '⭐';
      case 'suggestion':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'celebration':
        return '🎉';
      default:
        return '📌';
    }
  };

  const nextProjectSuggestion = insightEngine.suggestNextProject(mockMetrics);
  const learningPath = insightEngine.suggestLearningPath(mockMetrics);

  const filteredInsights = getFilteredInsights();

  return (
    <div className={`insights-panel ${isDarkMode ? 'dark' : ''}`}>
      <div className="insights-header">
        <div className="header-content">
          <h1>Performance Insights</h1>
          <div className="motivation-score">
            <div className="score-circle">
              <svg viewBox="0 0 120 120" className="score-ring">
                <circle cx="60" cy="60" r="54" className="circle-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="circle-progress"
                  style={{
                    strokeDashoffset: 339 - (339 * motivationScore) / 100,
                  }}
                />
              </svg>
              <div className="score-text">
                <div className="score-number">{motivationScore}</div>
                <div className="score-label">Motivation</div>
              </div>
            </div>
          </div>
        </div>

        <div className="motivational-message">{motivationalMessage}</div>
      </div>

      {/* Category Filters */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Insights
        </button>
        <button
          className={`filter-tab ${
            activeCategory === 'recommendations' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('recommendations')}
        >
          💡 Recommendations
        </button>
        <button
          className={`filter-tab ${activeCategory === 'weaknesses' ? 'active' : ''}`}
          onClick={() => setActiveCategory('weaknesses')}
        >
          ⚠️ Weaknesses
        </button>
        <button
          className={`filter-tab ${activeCategory === 'motivation' ? 'active' : ''}`}
          onClick={() => setActiveCategory('motivation')}
        >
          🎉 Celebrations
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="insights-content">
        {/* Insights List */}
        <div className="insights-main">
          <div className="insights-list">
            {filteredInsights.length > 0 ? (
              filteredInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`insight-item ${getInsightColor(
                    insight.type
                  )} priority-${insight.priority}`}
                >
                  <div className="insight-icon">
                    {getInsightIcon(insight.type)}
                  </div>

                  <div className="insight-content">
                    <div className="insight-title">{insight.title}</div>
                    <p className="insight-message">{insight.message}</p>

                    {insight.actionLabel && (
                      <a href={insight.actionUrl || '#'} className="insight-action">
                        {insight.actionLabel} →
                      </a>
                    )}
                  </div>

                  <div className="priority-badge">{insight.priority}</div>
                </div>
              ))
            ) : (
              <div className="no-insights">
                <p>No insights in this category yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="insights-sidebar">
          {/* Next Project Suggestion */}
          <div className="sidebar-section">
            <h3>Next Project 🎯</h3>
            <div className="suggestion-card">
              <h4>{nextProjectSuggestion.title}</h4>
              <p className="suggestion-reason">{nextProjectSuggestion.reason}</p>
              <div className="suggestion-difficulty">
                <span className={`difficulty-badge ${nextProjectSuggestion.difficulty.toLowerCase()}`}>
                  {nextProjectSuggestion.difficulty}
                </span>
              </div>
              <button className="suggestion-btn">Start This Project</button>
            </div>
          </div>

          {/* Learning Path */}
          <div className="sidebar-section">
            <h3>Learning Path 📚</h3>
            <div className="learning-path">
              {learningPath.map((phase) => (
                <div key={phase.phase} className="path-phase">
                  <div className="phase-header">
                    <div className="phase-number">Phase {phase.phase}</div>
                    <div className="phase-duration">{phase.estimatedWeeks}w</div>
                  </div>
                  <div className="phase-title">{phase.title}</div>
                  <p className="phase-reason">{phase.reason}</p>
                  <div className="phase-skills">
                    {phase.skills.slice(0, 2).map((skill, i) => (
                      <span key={i} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Stats */}
          <div className="sidebar-section">
            <h3>Performance Stats 📊</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-name">Completion Rate</span>
                <span className="stat-val">{mockMetrics.completionRate}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">Avg Time/Project</span>
                <span className="stat-val">{mockMetrics.averageTimePerProject}h</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">Current Streak</span>
                <span className="stat-val">{mockMetrics.streakDays} days</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">Projects Done</span>
                <span className="stat-val">{mockMetrics.projectsCompleted}</span>
              </div>
            </div>
          </div>

          {/* Strongest Skills */}
          <div className="sidebar-section">
            <h3>Top Skills 🌟</h3>
            <div className="skills-list">
              {mockMetrics.skills
                .sort((a, b) => b.proficiency - a.proficiency)
                .slice(0, 3)
                .map((skill) => (
                  <div key={skill.name} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level">{skill.proficiency}%</span>
                    </div>
                    <div className="skill-bar">
                      <div
                        className="skill-fill"
                        style={{ width: `${skill.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
