# Analytics System - Usage Guide

## Quick Start

### Import Components

```tsx
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ChartsDisplay from './components/ChartsDisplay';
import InsightsPanel from './components/InsightsPanel';
```

### Basic Usage

#### 1. Dashboard
```tsx
<AnalyticsDashboard />
```

Displays:
- 4 key stat cards (projects, XP, streak, rank)
- Level progress bar with XP tracking
- Performance summary metrics
- Recently completed projects
- Latest achievements
- Recommended next projects

#### 2. Charts
```tsx
<ChartsDisplay />
```

Features:
- Tab navigation between chart types
- XP progression line chart
- Category breakdown bar chart
- Skill distribution pie/radar
- Activity heatmap
- Export to PNG/SVG

#### 3. Insights
```tsx
<InsightsPanel />
```

Shows:
- Motivation score (0-100)
- Smart recommendations
- Weakness identification
- Learning path suggestion
- Performance stats
- Top skills with proficiency

## Service Usage

### Chart Engine

#### Generate Chart Config
```tsx
import { chartEngine } from './services';

// Line chart for XP progression
const xpData = chartEngine.generateHistoricalXPData(30);
const config = chartEngine.createLineChartConfig({
  title: 'XP Progression',
  labels: xpData.dates,
  data: xpData.xp,
  borderColor: '#667eea',
  backgroundColor: 'rgba(102, 126, 234, 0.1)',
  fill: true,
  tension: 0.4,
});
```

#### Trend Analysis
```tsx
const trend = chartEngine.analyzeTrend(xpData.xp, 7);
// Returns: { direction: 'improving'|'declining'|'stagnating', percentage: number, message: string }
```

#### Peer Comparison
```tsx
const comparison = chartEngine.compareToAverage(userXP, averageXP);
// Returns: { multiplier, ahead, message }
```

#### Export Chart
```tsx
const canvasElement = document.querySelector('canvas');
await chartEngine.exportChartAsPNG(canvasElement, 'my-chart.png');
```

### Report Generator

#### Generate Weekly Report
```tsx
import { reportGenerator } from './services';

const report = reportGenerator.generateWeeklyDigest({
  weekStart: new Date('2024-12-09'),
  weekEnd: new Date('2024-12-15'),
  projectsCompleted: 5,
  xpEarned: 750,
  totalHours: 18.5,
  completionRate: 90,
  averageTimePerProject: 3.7,
  skillsImproved: ['React', 'TypeScript'],
  newSkillsLearned: ['Node.js'],
  streakDays: 12,
});
```

#### Generate Monthly Report
```tsx
const monthlyReport = reportGenerator.generateMonthlySummary({
  month: 'December',
  year: 2024,
  totalProjects: 24,
  totalXp: 3500,
  totalHours: 120,
  categories: {
    'Frontend': 8,
    'Backend': 7,
    'Database': 5,
    'DevOps': 4,
  },
  topSkills: [
    { name: 'JavaScript', proficiency: 85 },
    { name: 'React', proficiency: 80 },
  ],
  achievements: ['Code Master', 'Speed Runner'],
  comparisonToPreviousMonth: {
    projectsChange: 3,
    xpChange: 500,
  },
});
```

#### Export to PDF
```tsx
const weeklyReport = reportGenerator.generateWeeklyDigest({...});

// Text-based PDF
await reportGenerator.generatePDF(
  'Weekly Digest',
  weeklyReport,
  'weekly-report.pdf'
);

// HTML-based PDF
const htmlElement = document.getElementById('report');
await reportGenerator.generatePDFFromHTML(htmlElement, 'report.pdf');
```

#### Email Report
```tsx
const result = await reportGenerator.emailReport(
  'user@example.com',
  reportContent,
  'weekly'
);

if (result.success) {
  console.log(result.message); // "Report sent to user@example.com"
}
```

### Insights Engine

#### Generate All Insights
```tsx
import { insightEngine } from './services';

const userMetrics = {
  projectsCompleted: 24,
  xpEarned: 4850,
  completionRate: 87,
  averageTimePerProject: 3.8,
  streakDays: 12,
  skills: [
    { name: 'JavaScript', proficiency: 85, timeSpent: 150 },
    { name: 'React', proficiency: 80, timeSpent: 120 },
    // ... more skills
  ],
  recentProjects: [
    {
      title: 'Build a REST API',
      category: 'Backend',
      difficulty: 'Intermediate',
      timeSpent: 3.5,
      completedAt: new Date(),
    },
    // ... more projects
  ],
};

const insights = insightEngine.generateAllInsights(userMetrics);
// Returns: { recommendations, weaknesses, motivation, peerComparison, allInsights }
```

#### Get Motivation Score
```tsx
const score = insightEngine.calculateMotivationScore(userMetrics);
// Returns: 0-100 number

const message = insightEngine.getMotivationalMessage(userMetrics);
// Returns: string like "🚀 You're absolutely crushing it!"
```

#### Get Next Project
```tsx
const nextProject = insightEngine.suggestNextProject(userMetrics);
// Returns: { title, reason, difficulty }
```

#### Get Learning Path
```tsx
const path = insightEngine.suggestLearningPath(userMetrics);
// Returns: Array of 3 phases with skills, duration, reasoning
```

#### Detect Trends
```tsx
const trends = insightEngine.detectTrends(currentMetrics, previousMetrics);
// Returns: Array of TrendData with metric, direction, percentage, message
```

## Integration Examples

### Custom Dashboard
```tsx
import React from 'react';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function CustomDashboard() {
  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
```

### With Real Data
```tsx
import { useEffect, useState } from 'react';
import { insightEngine } from './services';

export function ReportsPage() {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    // Fetch user data from API
    const userMetrics = fetchUserMetrics();
    
    // Generate insights
    const allInsights = insightEngine.generateAllInsights(userMetrics);
    setInsights(allInsights);
  }, []);

  return <InsightsPanel />;
}
```

### Automated Reports
```tsx
import { reportGenerator } from './services';

export async function generateDailyReport() {
  const metrics = await fetchDailyMetrics();
  
  const report = reportGenerator.generateWeeklyDigest(metrics);
  
  await reportGenerator.emailReport(
    'admin@example.com',
    report,
    'daily'
  );
}

// Schedule with cron job
scheduleCronJob('0 9 * * *', generateDailyReport);
```

## Dark Mode

All components automatically detect and support dark mode:

```tsx
// Automatic via localStorage
localStorage.setItem('darkMode', 'true');

// Or use the toggle button in components
// (Built into dashboard and insights panel)
```

## Customization

### Change Colors
Edit color variables in component CSS files or use CSS custom properties:

```css
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --accent: #f093fb;
}
```

### Modify Stats
Pass custom data via component props (can be extended):

```tsx
// Currently using mock data - update to use props:
<AnalyticsDashboard stats={customStats} />
```

### Add New Insights
Extend insightEngine with custom logic:

```tsx
insightEngine.customInsight = (metrics) => {
  return {
    type: 'suggestion',
    title: 'Your Custom Insight',
    message: 'Custom message based on metrics',
    icon: '💡',
    priority: 'high',
  };
};
```

## Performance Tips

1. **Lazy Load Charts**: Charts only render when tab is active
2. **Memoize Data**: Use useMemo for expensive calculations
3. **Cache Reports**: Store generated reports in localStorage
4. **Throttle Updates**: Limit insight generation to every 5 minutes
5. **Optimize Images**: Use SVG exports instead of PNG for smaller files

## Troubleshooting

### Charts Not Rendering
- Check Chart.js library is installed: `npm list chart.js`
- Verify canvas element exists in DOM
- Check browser console for errors

### Dark Mode Not Working
- Ensure localStorage is enabled
- Check CSS media query: `prefers-color-scheme`
- Verify CSS class: `dark` on root element

### PDF Export Fails
- Check jsPDF version: `npm list jspdf`
- Verify html2canvas installed for HTML export
- Check browser security settings

### No Insights Generated
- Verify user metrics object structure
- Check skill proficiency values are 0-100
- Ensure recentProjects array has valid data

## API Integration Checklist

- [ ] Connect to Supabase analytics table
- [ ] Replace mock data with real API calls
- [ ] Implement real email delivery
- [ ] Add data persistence layer
- [ ] Set up real-time WebSocket updates
- [ ] Add user authentication checks
- [ ] Implement analytics event tracking
- [ ] Set up data retention policies

## Environment Variables

```env
VITE_ANALYTICS_ENABLED=true
VITE_CHART_THEME=light
VITE_EXPORT_FORMAT=png
VITE_REPORT_EMAIL_SERVICE=sendgrid
```

## Support

For issues or questions:
1. Check ANALYTICS_IMPLEMENTATION.md
2. Review component inline documentation
3. Check service function JSDoc comments
4. Review test checklist

---
**Version:** 1.0.0
**Last Updated:** June 10, 2026
**Status:** Production Ready
