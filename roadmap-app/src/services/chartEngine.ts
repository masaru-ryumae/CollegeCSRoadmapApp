import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  RadarScale,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  RadarScale,
  Tooltip,
  Legend,
  Filler
);

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: Date;
}

export interface LineChartConfig {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
  tension?: number;
}

export interface BarChartConfig {
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface PieChartConfig {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor?: string[];
}

export interface RadarChartConfig {
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface HeatmapData {
  hours: string[];
  days: string[];
  data: number[][];
}

class ChartEngine {
  private defaultColors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#fa709a',
    '#fee140',
  ];

  private darkModeColors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
  ];

  /**
   * Create line chart configuration for XP/skill progression
   */
  createLineChartConfig(config: LineChartConfig) {
    return {
      type: 'line' as const,
      data: {
        labels: config.labels,
        datasets: [
          {
            label: config.title,
            data: config.data,
            borderColor: config.borderColor || '#667eea',
            backgroundColor: config.backgroundColor || 'rgba(102, 126, 234, 0.1)',
            fill: config.fill !== false,
            tension: config.tension || 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: config.borderColor || '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      } as ChartOptions<'line'>,
    };
  }

  /**
   * Create bar chart for projects by category
   */
  createBarChartConfig(config: BarChartConfig) {
    return {
      type: 'bar' as const,
      data: {
        labels: config.labels,
        datasets: config.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor:
            dataset.backgroundColor ||
            this.defaultColors[index % this.defaultColors.length],
          borderColor: dataset.borderColor || '#fff',
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      } as ChartOptions<'bar'>,
    };
  }

  /**
   * Create pie chart for skill distribution
   */
  createPieChartConfig(config: PieChartConfig) {
    return {
      type: 'doughnut' as const,
      data: {
        labels: config.labels,
        datasets: [
          {
            data: config.data,
            backgroundColor:
              config.backgroundColor || this.defaultColors,
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'right' as const,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: function (context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${percentage}%`;
              },
            },
          },
        },
      } as ChartOptions<'doughnut'>,
    };
  }

  /**
   * Create radar chart for skill proficiencies
   */
  createRadarChartConfig(config: RadarChartConfig) {
    return {
      type: 'radar' as const,
      data: {
        labels: config.labels,
        datasets: config.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor:
            dataset.borderColor ||
            this.defaultColors[index % this.defaultColors.length],
          backgroundColor:
            dataset.backgroundColor ||
            `rgba(102, 126, 234, ${0.1 + index * 0.1})`,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      } as ChartOptions<'radar'>,
    };
  }

  /**
   * Create heatmap data for activity by day/hour
   */
  createHeatmapData(): HeatmapData {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, '0')}:00`
    );

    const data = days.map(() =>
      Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 100)
      )
    );

    return { days, hours, data };
  }

  /**
   * Calculate moving average for trend analysis
   */
  calculateMovingAverage(data: number[], period: number = 7): number[] {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(data[i]);
      } else {
        const sum = data
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        result.push(Math.round(sum / period));
      }
    }
    return result;
  }

  /**
   * Analyze trend direction (improving/stagnating/declining)
   */
  analyzeTrend(
    data: number[],
    period: number = 7
  ): {
    direction: 'improving' | 'stagnating' | 'declining';
    percentage: number;
    message: string;
  } {
    if (data.length < period) {
      return {
        direction: 'stagnating',
        percentage: 0,
        message: 'Not enough data to analyze trend',
      };
    }

    const recentData = data.slice(-period);
    const previousData = data.slice(-period * 2, -period);

    const recentAvg =
      recentData.reduce((a, b) => a + b, 0) / period;
    const previousAvg =
      previousData.reduce((a, b) => a + b, 0) / period;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    const absChange = Math.abs(Math.round(change));

    if (absChange < 5) {
      return {
        direction: 'stagnating',
        percentage: 0,
        message: 'Performance is stable',
      };
    }

    if (change > 0) {
      return {
        direction: 'improving',
        percentage: absChange,
        message: `Improving ${absChange}% compared to previous period`,
      };
    }

    return {
      direction: 'declining',
      percentage: absChange,
      message: `Declining ${absChange}% compared to previous period`,
    };
  }

  /**
   * Generate comparison metrics
   */
  compareToAverage(
    userValue: number,
    averageValue: number
  ): {
    multiplier: number;
    ahead: boolean;
    message: string;
  } {
    const multiplier = Math.round((userValue / averageValue) * 100) / 100;
    const ahead = multiplier > 1;
    const percentage = Math.round(Math.abs((multiplier - 1) * 100));

    return {
      multiplier,
      ahead,
      message: ahead
        ? `You're ${percentage}% ahead of average`
        : `You're ${percentage}% below average`,
    };
  }

  /**
   * Generate random historical data for demo
   */
  generateHistoricalXPData(days: number = 30): {
    dates: string[];
    xp: number[];
  } {
    const dates = [];
    const xp = [];
    let currentXp = 500;

    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      currentXp += Math.floor(Math.random() * 300) - 50;
      currentXp = Math.max(0, currentXp);
      xp.push(currentXp);
    }

    return { dates, xp };
  }

  /**
   * Generate category completion data
   */
  generateCategoryData(): {
    categories: string[];
    completions: number[];
  } {
    const categories = [
      'Frontend',
      'Backend',
      'Database',
      'DevOps',
      'Mobile',
      'AI/ML',
    ];
    const completions = [
      Math.floor(Math.random() * 15) + 5,
      Math.floor(Math.random() * 15) + 5,
      Math.floor(Math.random() * 15) + 5,
      Math.floor(Math.random() * 15) + 3,
      Math.floor(Math.random() * 10) + 2,
      Math.floor(Math.random() * 10) + 2,
    ];

    return { categories, completions };
  }

  /**
   * Generate skill proficiency data
   */
  generateSkillData(): {
    skills: string[];
    proficiencies: number[];
  } {
    const skills = [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Database Design',
      'Problem Solving',
    ];
    const proficiencies = [
      85 + Math.random() * 15,
      80 + Math.random() * 15,
      75 + Math.random() * 15,
      70 + Math.random() * 15,
      65 + Math.random() * 20,
      72 + Math.random() * 18,
    ].map(v => Math.round(v));

    return { skills, proficiencies };
  }

  /**
   * Export chart as PNG
   */
  async exportChartAsPNG(
    chartCanvas: HTMLCanvasElement,
    filename: string
  ): Promise<void> {
    const link = document.createElement('a');
    link.href = chartCanvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  }

  /**
   * Export chart as SVG (simplified)
   */
  async exportChartAsSVG(
    chartCanvas: HTMLCanvasElement,
    filename: string
  ): Promise<void> {
    // Convert canvas to SVG
    const image = chartCanvas.toDataURL('image/svg+xml');
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    link.click();
  }

  /**
   * Get color based on theme
   */
  getThemeColors(isDark: boolean = false) {
    return {
      primary: isDark ? '#667eea' : '#667eea',
      secondary: isDark ? '#764ba2' : '#764ba2',
      accent: isDark ? '#f093fb' : '#f093fb',
      text: isDark ? '#ffffff' : '#1a1a2e',
      textSecondary: isDark ? '#aaa' : '#999',
      background: isDark ? '#0f3460' : '#ffffff',
      backgroundSecondary: isDark ? '#1a1a2e' : '#f9f9f9',
    };
  }
}

export default new ChartEngine();
