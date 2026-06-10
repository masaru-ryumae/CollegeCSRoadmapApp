import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMetrics } from '../utils/analyticsEngine';
import type { ReportConfig } from '../types';
import './ReportBuilder.css';

type ReportTemplate = 'weekly' | 'monthly' | 'annual' | 'custom';
type ExportFormat = 'pdf' | 'csv' | 'json' | 'png';

export function ReportBuilder() {
  const { state } = useApp();
  const { roadmap } = state;
  const [template, setTemplate] = useState<ReportTemplate>('monthly');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [selectedMetrics, setSelectedMetrics] = useState<
    Array<'projects' | 'time' | 'performance' | 'gamification'>
  >(['projects', 'time', 'performance', 'gamification']);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState<'weekly' | 'monthly' | 'never'>('never');
  const [emailAddress, setEmailAddress] = useState('');

  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate = new Date();

    switch (template) {
      case 'weekly':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'annual':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        startDate.setMonth(today.getMonth() - 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }, [template]);

  const metrics = useMemo(() => {
    if (!roadmap) return null;
    return calculateMetrics(roadmap, 'month');
  }, [roadmap]);

  const toggleMetric = (metric: 'projects' | 'time' | 'performance' | 'gamification') => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const handleGenerateReport = () => {
    if (!roadmap || !metrics) return;

    const reportConfig: ReportConfig = {
      template,
      startDate: dateRange.start,
      endDate: dateRange.end,
      metrics: selectedMetrics,
      includeCharts,
      format,
    };

    // Simulate report generation
    const reportData = {
      title:
        template === 'weekly'
          ? 'Weekly Report'
          : template === 'monthly'
            ? 'Monthly Report'
            : template === 'annual'
              ? 'Annual Review'
              : 'Custom Report',
      period: `${dateRange.start} to ${dateRange.end}`,
      metrics:
        selectedMetrics.includes('projects') &&
        selectedMetrics.includes('time') &&
        selectedMetrics.includes('performance') &&
        selectedMetrics.includes('gamification')
          ? 'All metrics included'
          : `${selectedMetrics.length} metrics selected`,
    };

    console.log('Generating report:', reportData);
    alert(`Report generated as ${format.toUpperCase()}!\n\n${JSON.stringify(reportData, null, 2)}`);
  };

  const handleScheduleReport = () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }

    alert(
      `Report scheduled!\nEmail: ${emailAddress}\nFrequency: ${emailFrequency === 'never' ? 'Never' : emailFrequency.charAt(0).toUpperCase() + emailFrequency.slice(1)}`
    );
  };

  if (!roadmap || !metrics) {
    return (
      <div className="report-empty">
        <p>Start your roadmap to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="report-builder">
      {/* Header */}
      <div className="report-header">
        <div className="header-content">
          <h1>Report Builder</h1>
          <p>Create and customize your progress reports</p>
        </div>
      </div>

      <div className="report-container">
        {/* Template Selection */}
        <section className="report-section">
          <h2>Select Report Template</h2>
          <div className="template-grid">
            {['weekly', 'monthly', 'annual', 'custom'].map((t) => (
              <button
                key={t}
                className={`template-card ${template === t ? 'active' : ''}`}
                onClick={() => setTemplate(t as ReportTemplate)}
              >
                <div className="template-icon">
                  {t === 'weekly'
                    ? '📊'
                    : t === 'monthly'
                      ? '📈'
                      : t === 'annual'
                        ? '🎯'
                        : '⚙️'}
                </div>
                <h3>{t.charAt(0).toUpperCase() + t.slice(1)}</h3>
                <p>
                  {t === 'weekly'
                    ? 'Last 7 days'
                    : t === 'monthly'
                      ? 'Last 30 days'
                      : t === 'annual'
                        ? 'Last 365 days'
                        : 'Custom range'}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Metrics Selection */}
        <section className="report-section">
          <h2>Select Metrics to Include</h2>
          <div className="metrics-checklist">
            <label className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('projects')}
                onChange={() => toggleMetric('projects')}
              />
              <span className="metric-label">
                <strong>Projects</strong>
                <small>Completion rate, progress, status</small>
              </span>
            </label>
            <label className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('time')}
                onChange={() => toggleMetric('time')}
              />
              <span className="metric-label">
                <strong>Time Tracking</strong>
                <small>Hours logged, daily average, trends</small>
              </span>
            </label>
            <label className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('performance')}
                onChange={() => toggleMetric('performance')}
              />
              <span className="metric-label">
                <strong>Performance</strong>
                <small>Success rate, completion time, efficiency</small>
              </span>
            </label>
            <label className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('gamification')}
                onChange={() => toggleMetric('gamification')}
              />
              <span className="metric-label">
                <strong>Gamification</strong>
                <small>XP, level, badges, streaks</small>
              </span>
            </label>
          </div>
        </section>

        {/* Report Options */}
        <section className="report-section">
          <h2>Report Options</h2>
          <div className="options-grid">
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                />
                <span>Include Charts & Visualizations</span>
              </label>
              <p className="option-description">
                Add visual charts to your report for better insights
              </p>
            </div>
          </div>
        </section>

        {/* Export Format */}
        <section className="report-section">
          <h2>Export Format</h2>
          <div className="format-buttons">
            {['pdf', 'csv', 'json', 'png'].map((f) => (
              <button
                key={f}
                className={`format-btn ${format === f ? 'active' : ''}`}
                onClick={() => setFormat(f as ExportFormat)}
              >
                {f === 'pdf'
                  ? '📄 PDF'
                  : f === 'csv'
                    ? '📑 CSV'
                    : f === 'json'
                      ? '{ } JSON'
                      : '🖼️ PNG'}
              </button>
            ))}
          </div>
        </section>

        {/* Date Range Display */}
        <section className="report-section">
          <h2>Date Range</h2>
          <div className="date-range">
            <div className="date-item">
              <span className="date-label">From</span>
              <span className="date-value">{dateRange.start}</span>
            </div>
            <div className="date-separator">→</div>
            <div className="date-item">
              <span className="date-label">To</span>
              <span className="date-value">{dateRange.end}</span>
            </div>
          </div>
        </section>

        {/* Preview Summary */}
        <section className="report-section">
          <h2>Report Summary</h2>
          <div className="report-summary">
            <div className="summary-row">
              <span>Template:</span>
              <strong>{template.charAt(0).toUpperCase() + template.slice(1)}</strong>
            </div>
            <div className="summary-row">
              <span>Metrics:</span>
              <strong>{selectedMetrics.length} selected</strong>
            </div>
            <div className="summary-row">
              <span>Charts:</span>
              <strong>{includeCharts ? 'Included' : 'Excluded'}</strong>
            </div>
            <div className="summary-row">
              <span>Format:</span>
              <strong>{format.toUpperCase()}</strong>
            </div>
          </div>
        </section>

        {/* Generate Button */}
        <div className="report-actions">
          <button className="btn btn-primary btn-lg" onClick={handleGenerateReport}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Generate Report
          </button>
        </div>

        {/* Email Scheduling */}
        <section className="report-section">
          <h2>Schedule Report Emails</h2>
          <div className="email-section">
            <div className="email-input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>

            <div className="frequency-group">
              <label>Frequency</label>
              <div className="frequency-buttons">
                {['never', 'weekly', 'monthly'].map((freq) => (
                  <button
                    key={freq}
                    className={`frequency-btn ${emailFrequency === freq ? 'active' : ''}`}
                    onClick={() => setEmailFrequency(freq as 'weekly' | 'monthly' | 'never')}
                  >
                    {freq === 'never'
                      ? 'No Schedule'
                      : freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-secondary" onClick={handleScheduleReport}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498-4.493a1 1 0 011.502-.684l1.498 4.493a1 1 0 00.948.684H19a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
                />
              </svg>
              Schedule Reports
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
