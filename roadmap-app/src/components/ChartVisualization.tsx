import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js';
import { useApp } from '../context/AppContext';
import {
  generateXPProgressionChart,
  generateProjectsByCategoryChart,
  generateSkillDistributionChart,
  generateActivityHeatmapChart,
  generateProgressTimelineChart,
  createChartConfig,
  exportChartAsPNG,
  analyzeTrend,
} from '../services/chartEngine';
import './ChartVisualization.css';

type ChartType = 'xp-progression' | 'projects-by-category' | 'skill-distribution' | 'activity-heatmap' | 'progress-timeline';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  title: string;
  description: string;
}

const chartConfigs: Record<ChartType, ChartConfig> = {
  'xp-progression': {
    type: 'line',
    title: 'XP Progression Over Time',
    description: 'Track your experience points as you complete modules',
  },
  'projects-by-category': {
    type: 'bar',
    title: 'Projects by Category',
    description: 'See how many projects you\'ve completed in each category',
  },
  'skill-distribution': {
    type: 'pie',
    title: 'Skill Distribution',
    description: 'Visual breakdown of your skills development',
  },
  'activity-heatmap': {
    type: 'bar',
    title: 'Activity by Day of Week',
    description: 'Identify your most productive days',
  },
  'progress-timeline': {
    type: 'line',
    title: 'Progress Timeline',
    description: 'Compare planned vs actual progress',
  },
};

function ChartCard({
  chartType,
  config,
}: {
  chartType: ChartType;
  config: ChartConfig;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const { state } = useApp();
  const { roadmap } = state;
  const [trend, setTrend] = useState<string>('');

  useEffect(() => {
    if (!canvasRef.current || !roadmap) return;

    // Get chart data based on type
    let chartData;
    switch (chartType) {
      case 'xp-progression':
        chartData = generateXPProgressionChart(roadmap);
        break;
      case 'projects-by-category':
        chartData = generateProjectsByCategoryChart(roadmap);
        break;
      case 'skill-distribution':
        chartData = generateSkillDistributionChart(roadmap);
        break;
      case 'activity-heatmap':
        chartData = generateActivityHeatmapChart(roadmap);
        break;
      case 'progress-timeline':
        chartData = generateProgressTimelineChart(roadmap);
        break;
      default:
        return;
    }

    // Analyze trend if we have numeric data
    if (chartData.datasets[0].data && typeof chartData.datasets[0].data[0] === 'number') {
      const analysis = analyzeTrend(chartData.datasets[0].data as number[]);
      setTrend(`${analysis.direction} (${analysis.changePercent > 0 ? '+' : ''}${analysis.changePercent}%)`);
    }

    // Create chart config
    const chartConfig = createChartConfig(chartData, config.type, config.title);

    // Destroy previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      chartRef.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [roadmap, chartType]);

  const handleExport = () => {
    if (canvasRef.current) {
      exportChartAsPNG(canvasRef.current, `chart-${chartType}.png`);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>{config.title}</h3>
          <p className="chart-description">{config.description}</p>
        </div>
        <div className="chart-controls">
          {trend && <span className="chart-trend">{trend}</span>}
          <button className="chart-export-btn" onClick={handleExport} title="Export as PNG">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="chart-container">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export function ChartVisualization() {
  const { state } = useApp();
  const { roadmap } = state;
  const [visibleCharts, setVisibleCharts] = useState<ChartType[]>([
    'xp-progression',
    'projects-by-category',
  ]);

  if (!roadmap) {
    return (
      <div className="chart-empty">
        <p>Start your roadmap to see visualizations.</p>
      </div>
    );
  }

  const toggleChart = (chartType: ChartType) => {
    setVisibleCharts(prev =>
      prev.includes(chartType)
        ? prev.filter(c => c !== chartType)
        : [...prev, chartType]
    );
  };

  return (
    <div className="chart-visualization">
      <div className="viz-header">
        <h2>Analytics Visualizations</h2>
        <div className="chart-selector">
          {(Object.keys(chartConfigs) as ChartType[]).map(chartType => (
            <button
              key={chartType}
              className={`chart-toggle ${visibleCharts.includes(chartType) ? 'active' : ''}`}
              onClick={() => toggleChart(chartType)}
            >
              {chartConfigs[chartType].title}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        {visibleCharts.map(chartType => (
          <ChartCard
            key={chartType}
            chartType={chartType}
            config={chartConfigs[chartType]}
          />
        ))}
      </div>
    </div>
  );
}
