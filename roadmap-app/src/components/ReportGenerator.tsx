import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  generateWeeklyDigest,
  generateMonthlySummary,
  generateSkillProficiency,
  generateLearningSpeedMetrics,
  generateAchievementTimeline,
  exportReportAsPDF,
  exportReportAsCSV,
  exportReportAsJSON,
} from '../services/reportGenerator';
import './ReportGenerator.css';

type ReportType = 'weekly' | 'monthly' | 'skill' | 'speed';

export function ReportGenerator() {
  const { state } = useApp();
  const { roadmap } = state;
  const [activeReport, setActiveReport] = useState<ReportType>('weekly');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  if (!roadmap) {
    return (
      <div className="report-empty">
        <p>Start your roadmap to generate reports.</p>
      </div>
    );
  }

  const weeklyReport = generateWeeklyDigest(roadmap);
  const monthlyReport = generateMonthlySummary(roadmap);
  const skillReport = generateSkillProficiency(roadmap);
  const speedReport = generateLearningSpeedMetrics(roadmap);
  const timeline = generateAchievementTimeline(roadmap);

  const handleExport = (type: ReportType) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `learning-report-${type}-${timestamp}`;

    switch (type) {
      case 'weekly': {
        if (exportFormat === 'pdf') {
          exportReportAsPDF(weeklyReport, `${baseFilename}.pdf`);
        } else if (exportFormat === 'csv') {
          exportReportAsCSV(weeklyReport.metrics, `${baseFilename}.csv`);
        } else {
          exportReportAsJSON(weeklyReport, `${baseFilename}.json`);
        }
        break;
      }
      case 'monthly': {
        if (exportFormat === 'pdf') {
          exportReportAsPDF(monthlyReport, `${baseFilename}.pdf`);
        } else if (exportFormat === 'csv') {
          exportReportAsCSV(monthlyReport.metrics, `${baseFilename}.csv`);
        } else {
          exportReportAsJSON(monthlyReport, `${baseFilename}.json`);
        }
        break;
      }
      case 'skill': {
        if (exportFormat === 'pdf') {
          const skillsData = skillReport.proficiencies.reduce(
            (acc, p) => ({
              ...acc,
              [p.skill]: `${p.level} (${p.projectsCompleted} projects)`,
            }),
            {}
          );
          exportReportAsPDF(
            {
              title: 'Skill Proficiency Report',
              summary: `You've developed skills across ${skillReport.proficiencies.length} areas`,
              metrics: skillsData,
            },
            `${baseFilename}.pdf`
          );
        } else if (exportFormat === 'csv') {
          const metricsData = skillReport.proficiencies.reduce(
            (acc, p) => ({
              ...acc,
              [p.skill]: p.score,
            }),
            {}
          );
          exportReportAsCSV(metricsData, `${baseFilename}.csv`);
        } else {
          exportReportAsJSON(skillReport, `${baseFilename}.json`);
        }
        break;
      }
      case 'speed': {
        if (exportFormat === 'pdf') {
          exportReportAsPDF(
            {
              title: 'Learning Speed Analysis',
              summary: speedReport.message,
              metrics: {
                'Projects Per Week': speedReport.projectsPerWeek,
                'Hours Per Project': speedReport.hoursPerProject,
                'Learning Velocity': speedReport.learningVelocity,
                'Estimated Completion': speedReport.estimatedCompletionDate,
              },
            },
            `${baseFilename}.pdf`
          );
        } else if (exportFormat === 'csv') {
          exportReportAsCSV(
            {
              'Projects Per Week': speedReport.projectsPerWeek,
              'Hours Per Project': speedReport.hoursPerProject,
              'Learning Velocity': speedReport.learningVelocity,
              'On Track': speedReport.onTrack ? 'Yes' : 'No',
            },
            `${baseFilename}.csv`
          );
        } else {
          exportReportAsJSON(speedReport, `${baseFilename}.json`);
        }
        break;
      }
    }
  };

  return (
    <div className="report-generator">
      <div className="report-header">
        <h2>Learning Reports</h2>
        <p>Generate and export detailed analytics reports</p>
      </div>

      <div className="report-controls">
        <div className="report-tabs">
          {(['weekly', 'monthly', 'skill', 'speed'] as ReportType[]).map(type => (
            <button
              key={type}
              className={`report-tab ${activeReport === type ? 'active' : ''}`}
              onClick={() => setActiveReport(type)}
            >
              {type === 'weekly'
                ? 'Weekly Digest'
                : type === 'monthly'
                  ? 'Monthly Summary'
                  : type === 'skill'
                    ? 'Skill Report'
                    : 'Speed Analysis'}
            </button>
          ))}
        </div>

        <div className="export-controls">
          <select
            value={exportFormat}
            onChange={e => setExportFormat(e.target.value as 'pdf' | 'csv' | 'json')}
            className="export-format"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button
            className="export-btn"
            onClick={() => handleExport(activeReport)}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
              />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <div className="report-content">
        {activeReport === 'weekly' && (
          <div className="report-section">
            <div className="report-title">
              <h3>{weeklyReport.title}</h3>
            </div>
            <div className="report-summary">
              <p>{weeklyReport.summary}</p>
            </div>

            <div className="metrics-grid">
              {Object.entries(weeklyReport.metrics).map(([key, value]) => (
                <div key={key} className="metric-item">
                  <span className="metric-label">{key}</span>
                  <span className="metric-value">{value}</span>
                </div>
              ))}
            </div>

            {weeklyReport.highlights.length > 0 && (
              <div className="highlights-section">
                <h4>This Week's Highlights</h4>
                <ul>
                  {weeklyReport.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {weeklyReport.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h4>Recommendations</h4>
                <ul>
                  {weeklyReport.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeReport === 'monthly' && (
          <div className="report-section">
            <div className="report-title">
              <h3>{monthlyReport.title}</h3>
            </div>
            <div className="report-summary">
              <p>{monthlyReport.summary}</p>
            </div>

            <div className="metrics-grid">
              {Object.entries(monthlyReport.metrics).map(([key, value]) => (
                <div key={key} className="metric-item">
                  <span className="metric-label">{key}</span>
                  <span className="metric-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="two-column">
              {monthlyReport.insights.length > 0 && (
                <div className="insights-section">
                  <h4>Key Insights</h4>
                  <ul>
                    {monthlyReport.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {monthlyReport.achievements.length > 0 && (
                <div className="achievements-section">
                  <h4>Achievements</h4>
                  <ul>
                    {monthlyReport.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeReport === 'skill' && (
          <div className="report-section">
            <div className="report-title">
              <h3>Skill Proficiency Report</h3>
            </div>

            <div className="skill-grid">
              {skillReport.proficiencies.map(skill => (
                <div key={skill.skill} className="skill-card">
                  <div className="skill-header">
                    <h4>{skill.skill}</h4>
                    <span className={`skill-level ${skill.level}`}>{skill.level}</span>
                  </div>
                  <div className="skill-metrics">
                    <div className="skill-metric">
                      <span>Projects</span>
                      <strong>{skill.projectsCompleted}</strong>
                    </div>
                    <div className="skill-metric">
                      <span>Hours</span>
                      <strong>{skill.hoursLogged}</strong>
                    </div>
                    <div className="skill-metric">
                      <span>Score</span>
                      <strong>{skill.score}%</strong>
                    </div>
                  </div>
                  <div className="skill-bar">
                    <div
                      className="skill-progress"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="skill-summary">
              <div className="summary-box">
                <h4>Top Skills</h4>
                <ul>
                  {skillReport.topSkills.map(skill => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
              <div className="summary-box">
                <h4>Skills to Improve</h4>
                <ul>
                  {skillReport.skillsToImprove.map(skill => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'speed' && (
          <div className="report-section">
            <div className="report-title">
              <h3>Learning Speed Analysis</h3>
            </div>

            <div className={`speed-status ${speedReport.onTrack ? 'on-track' : 'behind-track'}`}>
              <p>{speedReport.message}</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Projects Per Week</span>
                <span className="metric-value">{speedReport.projectsPerWeek}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Hours Per Project</span>
                <span className="metric-value">{speedReport.hoursPerProject}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Learning Velocity</span>
                <span className="metric-value metric-capitalize">{speedReport.learningVelocity}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Est. Completion</span>
                <span className="metric-value">{speedReport.estimatedCompletionDate}</span>
              </div>
            </div>

            <div className="timeline-section">
              <h4>Recent Achievements</h4>
              <div className="timeline">
                {timeline.slice(0, 5).map((event, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="timeline-date">{event.date}</p>
                      <p className="timeline-achievement">{event.achievement}</p>
                      <span className="timeline-xp">+{event.xpEarned} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
