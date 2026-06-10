import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMetrics } from '../utils/analyticsEngine';
import type { AnalyticsMetrics } from '../types';
import './AnalyticsDashboard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: number;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function MetricCard({ title, value, label, icon, trend, color }: MetricCardProps) {
  const colorClass = {
    blue: 'metric-blue',
    green: 'metric-green',
    purple: 'metric-purple',
    orange: 'metric-orange',
    red: 'metric-red',
  }[color];

  return (
    <div className={`metric-card ${colorClass}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <p className="metric-title">{title}</p>
        <div className="metric-value-row">
          <span className="metric-value">{value}</span>
          {trend && (
            <span className={`metric-trend ${trend.direction}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        <p className="metric-label">{label}</p>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const { state } = useApp();
  const { roadmap } = state;
  const [period, setPeriod] = useState<'week' | 'month' | '3-months' | 'year' | 'all-time'>(
    'month'
  );

  const metrics = useMemo<AnalyticsMetrics | null>(() => {
    return roadmap ? calculateMetrics(roadmap, period) : null;
  }, [roadmap, period]);

  const previousMetrics = useMemo<AnalyticsMetrics | null>(() => {
    if (!roadmap) return null;
    const prevPeriod =
      period === 'week'
        ? 'month'
        : period === 'month'
          ? '3-months'
          : period === '3-months'
            ? 'year'
            : 'all-time';
    return calculateMetrics(roadmap, prevPeriod);
  }, [roadmap, period]);

  if (!roadmap || !metrics) {
    return (
      <div className="analytics-empty">
        <p>Start your roadmap to see detailed analytics.</p>
      </div>
    );
  }

  const projectsTrend = previousMetrics
    ? Math.round(
        ((metrics.projects.totalCompleted - previousMetrics.projects.totalCompleted) /
          Math.max(1, previousMetrics.projects.totalCompleted)) *
          100
      )
    : 0;

  const hoursTrend = previousMetrics
    ? Math.round(
        ((metrics.time.thisMonth - previousMetrics.time.thisMonth) /
          Math.max(1, previousMetrics.time.thisMonth)) *
          100
      )
    : 0;

  const xpTrend = previousMetrics
    ? Math.round(
        ((metrics.gamification.totalXP - previousMetrics.gamification.totalXP) /
          Math.max(1, previousMetrics.gamification.totalXP)) *
          100
      )
    : 0;

  const streakTrend = metrics.gamification.streakCount > 3 ? 1 : -1;

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-title">
          <h1>Analytics & Insights</h1>
          <p>Track your progress and performance</p>
        </div>

        {/* Period Selector */}
        <div className="period-selector">
          {(['week', 'month', '3-months', 'year', 'all-time'] as const).map(
            (p) => (
              <button
                key={p}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'week'
                  ? 'Week'
                  : p === 'month'
                    ? 'Month'
                    : p === '3-months'
                      ? '3 Months'
                      : p === 'year'
                        ? 'Year'
                        : 'All Time'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Projects Completed"
          value={metrics.projects.totalCompleted}
          label={`of ${metrics.projects.totalProjects} total`}
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{
            direction: projectsTrend >= 0 ? 'up' : 'down',
            value: Math.abs(projectsTrend),
          }}
          color="blue"
        />

        <MetricCard
          title="Hours Logged"
          value={metrics.time.thisMonth}
          label={`${metrics.time.averageHoursPerDay.toFixed(1)} hours/day avg`}
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{
            direction: hoursTrend >= 0 ? 'up' : 'down',
            value: Math.abs(hoursTrend),
          }}
          color="orange"
        />

        <MetricCard
          title="Completion Rate"
          value={`${metrics.projects.completionRate}%`}
          label={`${Math.round(metrics.projects.averageCompletionTime)} days average`}
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          color="green"
        />

        <MetricCard
          title="Total XP"
          value={metrics.gamification.totalXP}
          label={`Level ${metrics.gamification.currentLevel}`}
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{
            direction: xpTrend >= 0 ? 'up' : 'down',
            value: Math.abs(xpTrend),
          }}
          color="purple"
        />

        <MetricCard
          title="Current Streak"
          value={metrics.gamification.streakCount}
          label={`Longest: ${metrics.gamification.longestStreak}`}
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657L13.414 22.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
            </svg>
          }
          trend={{
            direction: streakTrend > 0 ? 'up' : 'down',
            value: 7,
          }}
          color="red"
        />

        <MetricCard
          title="Badges Earned"
          value={metrics.gamification.badgesEarned}
          label="Achievements unlocked"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Progress Section */}
      <div className="analytics-section">
        <h2>Progress Overview</h2>
        <div className="progress-cards">
          <div className="progress-card">
            <div className="progress-header">
              <h3>Completion Progress</h3>
              <span className="progress-percent">{metrics.projects.completionRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${metrics.projects.completionRate}%` }}
              />
            </div>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{metrics.projects.totalCompleted}</span>
              </div>
              <div className="stat">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{metrics.projects.inProgress}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Pending</span>
                <span className="stat-value">
                  {metrics.projects.totalProjects -
                    metrics.projects.totalCompleted -
                    metrics.projects.inProgress}
                </span>
              </div>
            </div>
          </div>

          <div className="progress-card">
            <div className="progress-header">
              <h3>Level Progress</h3>
              <span className="progress-percent">{Math.round(metrics.gamification.nextLevelProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill gold"
                style={{ width: `${metrics.gamification.nextLevelProgress}%` }}
              />
            </div>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-label">Current Level</span>
                <span className="stat-value">{metrics.gamification.currentLevel}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total XP</span>
                <span className="stat-value">{metrics.gamification.totalXP}</span>
              </div>
              <div className="stat">
                <span className="stat-label">To Next Level</span>
                <span className="stat-value">{Math.round(500 - (metrics.gamification.totalXP % 500))} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="analytics-section">
        <h2>Performance Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Success Rate</span>
            <span className="summary-value">{metrics.performance.successRate}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Avg Completion Time</span>
            <span className="summary-value">{metrics.performance.averageCompletionTime} days</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Above Average</span>
            <span className="summary-value">{metrics.performance.projectsAboveAverage} projects</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">This Period</span>
            <span className="summary-value">{period.replace('-', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
