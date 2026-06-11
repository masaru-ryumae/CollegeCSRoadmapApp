import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import chartEngine from '../services/chartEngine';
import './ChartsDisplay.css';

const ChartsDisplay: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'xp' | 'category' | 'skills' | 'heatmap'>('xp');

  // XP Progression Data
  const xpData = chartEngine.generateHistoricalXPData(30);
  const xpChartConfig = chartEngine.createLineChartConfig({
    title: 'XP Progression Over Time',
    labels: xpData.dates,
    data: xpData.xp,
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    fill: true,
    tension: 0.4,
  });

  // Category Data
  const categoryData = chartEngine.generateCategoryData();
  const categoryChartConfig = chartEngine.createBarChartConfig({
    title: 'Projects by Category',
    labels: categoryData.categories,
    datasets: [
      {
        label: 'Projects Completed',
        data: categoryData.completions,
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#4facfe',
          '#00f2fe',
          '#43e97b',
        ],
      },
    ],
  });

  // Skill Distribution Data
  const skillData = chartEngine.generateSkillData();
  const skillChartConfig = chartEngine.createPieChartConfig({
    title: 'Skill Distribution',
    labels: skillData.skills,
    data: skillData.proficiencies,
    backgroundColor: [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
    ],
  });

  // Radar Chart Data
  const radarChartConfig = chartEngine.createRadarChartConfig({
    title: 'Skill Proficiencies',
    labels: skillData.skills,
    datasets: [
      {
        label: 'Your Proficiency',
        data: skillData.proficiencies,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
      },
      {
        label: 'Average User',
        data: [70, 65, 75, 60, 55, 68],
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118, 75, 162, 0.2)',
      },
    ],
  });

  // Trend Analysis
  const trendAnalysis = chartEngine.analyzeTrend(xpData.xp);
  const comparison = chartEngine.compareToAverage(2850, 2000);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
  }, []);

  const handleExportPNG = (chartName: string) => {
    // In a real app, this would export the specific chart
    console.log(`Exporting ${chartName} as PNG`);
    alert(`Export functionality would save ${chartName}.png`);
  };

  const handleExportSVG = (chartName: string) => {
    console.log(`Exporting ${chartName} as SVG`);
    alert(`Export functionality would save ${chartName}.svg`);
  };

  return (
    <div className={`charts-display ${isDarkMode ? 'dark' : ''}`}>
      <div className="charts-header">
        <h1>Analytics Charts</h1>
        <div className="export-buttons">
          <button className="export-btn" onClick={() => handleExportPNG('charts')}>
            📥 Export as PNG
          </button>
          <button className="export-btn" onClick={() => handleExportSVG('charts')}>
            📄 Export as SVG
          </button>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <div className="insight-card success">
          <div className="insight-icon">📈</div>
          <div className="insight-content">
            <h3>Trend Analysis</h3>
            <p className="insight-message">{trendAnalysis.message}</p>
          </div>
        </div>

        <div className="insight-card info">
          <div className="insight-icon">⭐</div>
          <div className="insight-content">
            <h3>Performance Comparison</h3>
            <p className="insight-message">{comparison.message}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="chart-tabs">
        <button
          className={`tab ${activeTab === 'xp' ? 'active' : ''}`}
          onClick={() => setActiveTab('xp')}
        >
          📊 XP Progress
        </button>
        <button
          className={`tab ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          📚 Categories
        </button>
        <button
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          🎯 Skills
        </button>
        <button
          className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          🔥 Heatmap
        </button>
      </div>

      {/* Chart Container */}
      <div className="charts-container">
        {activeTab === 'xp' && (
          <div className="chart-wrapper">
            <div className="chart-header">
              <h2>XP Progression Over 30 Days</h2>
              <button
                className="export-small"
                onClick={() => handleExportPNG('xp-progress')}
              >
                💾 Export
              </button>
            </div>
            <div className="chart-content">
              <Line data={xpChartConfig.data} options={xpChartConfig.options} />
            </div>
            <div className="chart-stats">
              <div className="stat">
                <span className="stat-label">Total XP Earned</span>
                <span className="stat-value">
                  {xpData.xp[xpData.xp.length - 1] - xpData.xp[0]}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Average Daily XP</span>
                <span className="stat-value">
                  {Math.round(
                    xpData.xp.reduce((a, b) => a + b, 0) / xpData.xp.length
                  )}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Trend</span>
                <span className={`stat-value ${trendAnalysis.direction}`}>
                  {trendAnalysis.direction === 'improving' ? '📈' : '📉'}{' '}
                  {trendAnalysis.percentage}%
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="chart-wrapper">
            <div className="chart-header">
              <h2>Projects by Category</h2>
              <button
                className="export-small"
                onClick={() => handleExportPNG('category-breakdown')}
              >
                💾 Export
              </button>
            </div>
            <div className="chart-content">
              <Bar
                data={categoryChartConfig.data}
                options={categoryChartConfig.options}
              />
            </div>
            <div className="chart-stats">
              {categoryData.categories.map((cat, i) => (
                <div key={cat} className="stat">
                  <span className="stat-label">{cat}</span>
                  <span className="stat-value">{categoryData.completions[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="chart-wrapper dual-chart">
            <div className="sub-chart">
              <div className="chart-header">
                <h2>Skill Distribution (Pie)</h2>
              </div>
              <div className="chart-content small">
                <Doughnut
                  data={skillChartConfig.data}
                  options={skillChartConfig.options}
                />
              </div>
            </div>

            <div className="sub-chart">
              <div className="chart-header">
                <h2>Skill Proficiencies (Radar)</h2>
              </div>
              <div className="chart-content small">
                <Radar
                  data={radarChartConfig.data}
                  options={radarChartConfig.options}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="chart-wrapper">
            <div className="chart-header">
              <h2>Activity Heatmap (Demo)</h2>
            </div>
            <div className="heatmap-container">
              <p className="heatmap-note">
                This represents your activity patterns across days and hours.
              </p>
              <div className="heatmap-grid">
                <div className="heatmap-label">Time of Day →</div>
                {[
                  'Mon',
                  'Tue',
                  'Wed',
                  'Thu',
                  'Fri',
                  'Sat',
                  'Sun',
                ].map((day, dayIndex) => (
                  <div key={day} className="heatmap-cell day-header">
                    {day}
                  </div>
                ))}

                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const cells = [
                    <div key={`hour-${hourIndex}`} className="heatmap-cell hour-header">
                      {String(hourIndex).padStart(2, '0')}:00
                    </div>,
                  ];

                  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                    const intensity = Math.floor(Math.random() * 100);
                    cells.push(
                      <div
                        key={`heatmap-${hourIndex}-${dayIndex}`}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: `rgba(102, 126, 234, ${
                            intensity / 100
                          })`,
                        }}
                        title={`${intensity}% active`}
                      />
                    );
                  }

                  return (
                    <div key={`row-${hourIndex}`} className="heatmap-row">
                      {cells}
                    </div>
                  );
                })}
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                <div className="legend-gradient"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Insights */}
      <div className="additional-insights">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-box">
            <h3>Moving Average (7-day)</h3>
            <p>
              Your 7-day moving average shows consistent progress with periodic
              peaks during intensive learning sessions.
            </p>
          </div>

          <div className="insight-box">
            <h3>Strongest Skills</h3>
            <p>
              JavaScript and React are your strongest areas. Consider advanced
              projects combining these skills.
            </p>
          </div>

          <div className="insight-box">
            <h3>Areas for Growth</h3>
            <p>
              Database Design and Problem Solving show room for improvement.
              Focus on 2-3 projects in these areas.
            </p>
          </div>

          <div className="insight-box">
            <h3>Velocity Trends</h3>
            <p>
              Your project completion velocity has improved 18% over the last 2
              weeks. Keep up this momentum!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsDisplay;
