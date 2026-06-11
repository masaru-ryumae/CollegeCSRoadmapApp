import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

interface StatsData {
  projectsCompleted: number;
  xpEarned: number;
  currentStreak: number;
  userRank: string;
  currentLevel: number;
  maxLevel: number;
  xpInLevel: number;
  xpForNextLevel: number;
  completionRate: number;
  avgCompletionTime: number;
  avgDifficulty: string;
}

interface RecentProject {
  id: string;
  title: string;
  category: string;
  completedAt: string;
  xpEarned: number;
  difficulty: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  difficulty: string;
  estimatedTime: number;
  category: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    projectsCompleted: 24,
    xpEarned: 4850,
    currentStreak: 12,
    userRank: 'Senior Developer',
    currentLevel: 8,
    maxLevel: 20,
    xpInLevel: 750,
    xpForNextLevel: 1000,
    completionRate: 87,
    avgCompletionTime: 4.2,
    avgDifficulty: 'Intermediate',
  });

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([
    {
      id: '1',
      title: 'Build a REST API',
      category: 'Backend',
      completedAt: '2 hours ago',
      xpEarned: 150,
      difficulty: 'Intermediate',
    },
    {
      id: '2',
      title: 'React Hooks Deep Dive',
      category: 'Frontend',
      completedAt: '1 day ago',
      xpEarned: 200,
      difficulty: 'Advanced',
    },
    {
      id: '3',
      title: 'Database Optimization',
      category: 'Backend',
      completedAt: '3 days ago',
      xpEarned: 180,
      difficulty: 'Advanced',
    },
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      name: 'Code Master',
      description: 'Completed 20 projects',
      icon: '⭐',
      unlockedAt: '5 days ago',
    },
    {
      id: '2',
      name: 'Speed Runner',
      description: 'Completed project in under 2 hours',
      icon: '⚡',
      unlockedAt: '2 days ago',
    },
    {
      id: '3',
      name: 'Streak Warrior',
      description: 'Maintained 10-day streak',
      icon: '🔥',
      unlockedAt: '1 day ago',
    },
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: '1',
      title: 'Advanced TypeScript Patterns',
      reason: 'You\'re progressing 2x faster than average',
      difficulty: 'Advanced',
      estimatedTime: 6,
      category: 'Frontend',
    },
    {
      id: '2',
      title: 'Microservices Architecture',
      reason: 'Next natural step after REST APIs',
      difficulty: 'Expert',
      estimatedTime: 8,
      category: 'Backend',
    },
  ]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Load analytics data from localStorage if available
    const cachedStats = localStorage.getItem('analyticsStats');
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        // Keep default stats
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const progressPercentage = (stats.xpInLevel / stats.xpForNextLevel) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600';
      case 'Intermediate':
        return 'text-blue-600';
      case 'Advanced':
        return 'text-purple-600';
      case 'Expert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRankColor = (rank: string) => {
    if (rank.includes('Expert') || rank.includes('Master')) return 'text-yellow-600';
    if (rank.includes('Senior')) return 'text-purple-600';
    if (rank.includes('Intermediate')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className={`analytics-dashboard ${isDarkMode ? 'dark' : ''}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats.projectsCompleted}</div>
              <div className="stat-label">Projects Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{stats.xpEarned}</div>
              <div className="stat-label">XP Earned</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.currentStreak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>

          <div className="stat-card">
            <div className={`stat-icon ${getRankColor(stats.userRank)}`}>👑</div>
            <div className="stat-content">
              <div className="stat-value">{stats.userRank}</div>
              <div className="stat-label">Current Rank</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="level-progress-section">
          <div className="section-header">
            <h2>Level Progress</h2>
            <span className="level-info">
              Level {stats.currentLevel} / {stats.maxLevel}
            </span>
          </div>

          <div className="level-container">
            <div className="progress-bar-wrapper">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="progress-text">
                {stats.xpInLevel} / {stats.xpForNextLevel} XP
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="performance-summary">
          <h2>Performance Summary</h2>
          <div className="performance-grid">
            <div className="performance-item">
              <div className="performance-label">Completion Rate</div>
              <div className="performance-value">{stats.completionRate}%</div>
              <div className="performance-bar">
                <div
                  className="performance-fill"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>

            <div className="performance-item">
              <div className="performance-label">Avg Time per Project</div>
              <div className="performance-value">{stats.avgCompletionTime}h</div>
            </div>

            <div className="performance-item">
              <div className="performance-label">Average Difficulty</div>
              <div className={`performance-value ${getDifficultyColor(stats.avgDifficulty)}`}>
                {stats.avgDifficulty}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="content-grid">
          {/* Recent Projects */}
          <div className="section recent-projects">
            <div className="section-header">
              <h2>Recently Completed</h2>
              <a href="#" className="view-all">View All</a>
            </div>

            <div className="projects-list">
              {recentProjects.map((project) => (
                <div key={project.id} className="project-item">
                  <div className="project-info">
                    <div className="project-title">{project.title}</div>
                    <div className="project-meta">
                      <span className="project-category">{project.category}</span>
                      <span className="project-time">{project.completedAt}</span>
                    </div>
                  </div>
                  <div className="project-stats">
                    <span className={`project-difficulty ${getDifficultyColor(project.difficulty)}`}>
                      {project.difficulty}
                    </span>
                    <span className="project-xp">+{project.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="section achievements">
            <div className="section-header">
              <h2>Latest Achievements</h2>
              <a href="#" className="view-all">View All</a>
            </div>

            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-content">
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-description">{achievement.description}</div>
                    <div className="achievement-time">{achievement.unlockedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="section recommendations">
          <div className="section-header">
            <h2>Recommended Next Steps</h2>
          </div>

          <div className="recommendations-list">
            {recommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card">
                <div className="recommendation-content">
                  <div className="recommendation-title">{rec.title}</div>
                  <div className="recommendation-reason">{rec.reason}</div>
                  <div className="recommendation-meta">
                    <span className={`recommendation-difficulty ${getDifficultyColor(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                    <span className="recommendation-time">~{rec.estimatedTime}h</span>
                    <span className="recommendation-category">{rec.category}</span>
                  </div>
                </div>
                <button className="recommendation-button">Start Project</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
