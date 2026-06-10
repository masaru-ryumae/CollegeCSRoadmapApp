import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMetrics } from '../utils/analyticsEngine';
import type { PersonalizedRoadmap, AnalyticsMetrics } from '../types';
import './Charts.css';

interface ChartData {
  labels: string[];
  values: number[];
}

function LineChart({ data, title }: { data: ChartData; title: string }) {
  const maxValue = Math.max(...data.values, 1);
  const height = 300;
  const padding = 40;
  const width = 100;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <svg
        viewBox={`0 0 ${width * (data.labels.length - 1) + padding * 2} ${height + padding * 2}`}
        className="chart-svg line-chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + i * (height - padding)}
            x2={width * (data.labels.length - 1) + padding}
            y2={padding + i * (height - padding)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <text
            key={`label-${i}`}
            x={padding - 5}
            y={padding + (1 - i) * height + 5}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {Math.round(maxValue * i)}
          </text>
        ))}

        {/* Path */}
        <polyline
          points={data.values
            .map(
              (v, i) =>
                `${padding + (i / (data.labels.length - 1)) * (width * (data.labels.length - 1))},${padding + height - (v / maxValue) * height}`
            )
            .join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Data points */}
        {data.values.map((v, i) => (
          <circle
            key={`point-${i}`}
            cx={padding + (i / (data.labels.length - 1)) * (width * (data.labels.length - 1))}
            cy={padding + height - (v / maxValue) * height}
            r="3"
            fill="#3b82f6"
          />
        ))}

        {/* X axis labels */}
        {data.labels.map((label, i) => (
          <text
            key={`x-label-${i}`}
            x={padding + (i / (data.labels.length - 1)) * (width * (data.labels.length - 1))}
            y={padding + height + 20}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BarChart({ data, title }: { data: ChartData; title: string }) {
  const maxValue = Math.max(...data.values, 1);
  const barWidth = 30;
  const barGap = 10;
  const height = 300;
  const padding = 40;
  const width = barWidth + barGap;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <svg
        viewBox={`0 0 ${width * data.labels.length + padding * 2} ${height + padding * 2}`}
        className="chart-svg bar-chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + i * (height - padding)}
            x2={width * data.labels.length + padding}
            y2={padding + i * (height - padding)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <text
            key={`label-${i}`}
            x={padding - 5}
            y={padding + (1 - i) * (height - padding) + 5}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {Math.round(maxValue * i)}
          </text>
        ))}

        {/* Bars */}
        {data.values.map((v, i) => (
          <g key={`bar-${i}`}>
            <rect
              x={padding + i * width + barGap / 2}
              y={padding + (height - padding) - (v / maxValue) * (height - padding)}
              width={barWidth}
              height={(v / maxValue) * (height - padding)}
              fill="#3b82f6"
            />
            <text
              x={padding + i * width + barGap / 2 + barWidth / 2}
              y={padding + height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {data.labels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PieChart({ data, title }: { data: ChartData; title: string }) {
  const total = data.values.reduce((a, b) => a + b, 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  let currentAngle = -Math.PI / 2;
  const slices = data.values.map((v, i) => {
    const sliceAngle = (v / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startX = 100 + 80 * Math.cos(startAngle);
    const startY = 100 + 80 * Math.sin(startAngle);
    const endX = 100 + 80 * Math.cos(endAngle);
    const endY = 100 + 80 * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    return {
      path: `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY} Z`,
      fill: colors[i % colors.length],
      label: data.labels[i],
      value: v,
    };
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="pie-chart-wrapper">
        <svg viewBox="0 0 200 200" className="chart-svg pie-chart">
          {slices.map((slice, i) => (
            <path key={`slice-${i}`} d={slice.path} fill={slice.fill} />
          ))}
        </svg>
        <div className="pie-legend">
          {slices.map((slice, i) => (
            <div key={`legend-${i}`} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: slice.fill }}
              />
              <span>{slice.label}</span>
              <span className="legend-value">{slice.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Heatmap({ data, title }: { data: ChartData; title: string }) {
  const maxValue = Math.max(...data.values, 1);
  const cellSize = 20;
  const gap = 2;

  // Create a grid of days
  const weeksCount = Math.ceil(data.values.length / 7);
  const gridWidth = 7;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="heatmap-wrapper">
        <svg
          viewBox={`0 0 ${gridWidth * (cellSize + gap) + 60} ${weeksCount * (cellSize + gap) + 40}`}
          className="chart-svg heatmap"
        >
          {data.values.map((v, i) => {
            const dayOfWeek = i % 7;
            const week = Math.floor(i / 7);
            const intensity = v / maxValue;
            const color = `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`;

            return (
              <rect
                key={`cell-${i}`}
                x={40 + dayOfWeek * (cellSize + gap)}
                y={20 + week * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                fill={color}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          {/* Day labels */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <text
              key={`day-${i}`}
              x={40 + i * (cellSize + gap) + cellSize / 2}
              y={15}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function Charts() {
  const { state } = useApp();
  const { roadmap } = state;
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar' | 'pie' | 'heatmap'>('line');

  const chartData = useMemo(() => {
    if (!roadmap) return null;

    // Generate data for different charts
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
    const projectsByWeek = [2, 3, 2, 4, 5];
    const hoursByCategory: ChartData = {
      labels: ['DSA', 'System Design', 'Web Dev', 'Mobile', 'Other'],
      values: [15, 12, 18, 10, 5],
    };
    const projectStatus: ChartData = {
      labels: ['Completed', 'In Progress', 'Pending'],
      values: [
        roadmap.modules.filter((m) => m.status === 'done').length,
        roadmap.modules.filter((m) => m.status === 'in-progress').length,
        roadmap.modules.filter((m) => m.status === 'pending').length,
      ],
    };
    const activityHeatmap: ChartData = {
      labels: Array(49).fill('').map((_, i) => `D${i + 1}`),
      values: Array(49).fill(0).map(() => Math.round(Math.random() * 8)),
    };

    return {
      projectCompletion: {
        labels: weeks,
        values: projectsByWeek,
      },
      hoursByCategory,
      projectStatus,
      activityHeatmap,
    };
  }, [roadmap]);

  if (!roadmap || !chartData) {
    return <div className="charts-empty">Start your roadmap to see detailed charts.</div>;
  }

  return (
    <div className="charts-container">
      <div className="charts-header">
        <h1>Visualizations & Charts</h1>
        <div className="chart-selector">
          {(['line', 'bar', 'pie', 'heatmap'] as const).map((chart) => (
            <button
              key={chart}
              className={`chart-btn ${selectedChart === chart ? 'active' : ''}`}
              onClick={() => setSelectedChart(chart)}
            >
              {chart === 'line'
                ? 'Line'
                : chart === 'bar'
                  ? 'Bar'
                  : chart === 'pie'
                    ? 'Pie'
                    : 'Heatmap'}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        {selectedChart === 'line' && (
          <LineChart
            data={chartData.projectCompletion}
            title="Projects Completed Over Time"
          />
        )}
        {selectedChart === 'bar' && (
          <BarChart
            data={chartData.hoursByCategory}
            title="Hours Spent by Category"
          />
        )}
        {selectedChart === 'pie' && (
          <PieChart
            data={chartData.projectStatus}
            title="Project Status Distribution"
          />
        )}
        {selectedChart === 'heatmap' && (
          <Heatmap
            data={chartData.activityHeatmap}
            title="Activity Heatmap (Last 7 Weeks)"
          />
        )}

        {/* Secondary chart */}
        <div className="chart-secondary">
          {selectedChart !== 'pie' && (
            <PieChart
              data={chartData.projectStatus}
              title="Project Status"
            />
          )}
          {selectedChart !== 'heatmap' && selectedChart !== 'pie' && (
            <Heatmap
              data={chartData.activityHeatmap}
              title="7-Week Activity"
            />
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="charts-export">
        <h3>Export Charts</h3>
        <div className="export-buttons">
          <button className="export-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            PNG
          </button>
          <button className="export-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            PDF
          </button>
          <button className="export-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
