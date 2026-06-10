// Budget calculation and cost estimation utilities
import { Module } from '../types/index';

export interface BudgetItem {
  id: string;
  name: string;
  category: 'hardware' | 'software' | 'service' | 'course' | 'other';
  minCost: number;
  avgCost: number;
  maxCost: number;
  frequency: 'one-time' | 'monthly' | 'yearly'; // For recurring costs
  isOptional: boolean;
  description?: string;
}

export interface ProjectBudget {
  projectId: string;
  projectName: string;
  items: BudgetItem[];
  totalMinCost: number;
  totalAvgCost: number;
  totalMaxCost: number;
  breakdown: CostBreakdown;
}

export interface CostBreakdown {
  hardware: number;
  software: number;
  service: number;
  course: number;
  other: number;
}

export interface BudgetAlternative {
  name: string;
  description: string;
  cost: number;
  savings: number;
  isRecommended: boolean;
}

// Default budget items for common project categories
const DEFAULT_BUDGET_ITEMS: Record<string, BudgetItem[]> = {
  'fullstack-web': [
    {
      id: 'pc-hardware',
      name: 'Computer/Laptop',
      category: 'hardware',
      minCost: 600,
      avgCost: 1200,
      maxCost: 2500,
      frequency: 'one-time',
      isOptional: false,
      description: 'Development machine',
    },
    {
      id: 'code-editor',
      name: 'Code Editor (VS Code)',
      category: 'software',
      minCost: 0,
      avgCost: 0,
      maxCost: 0,
      frequency: 'one-time',
      isOptional: false,
      description: 'Free with optional paid extensions',
    },
    {
      id: 'hosting',
      name: 'Web Hosting (Render/Vercel)',
      category: 'service',
      minCost: 0,
      avgCost: 5,
      maxCost: 20,
      frequency: 'monthly',
      isOptional: false,
      description: 'Free tier available, optional paid plans',
    },
    {
      id: 'database',
      name: 'Database (PostgreSQL)',
      category: 'service',
      minCost: 0,
      avgCost: 5,
      maxCost: 50,
      frequency: 'monthly',
      isOptional: false,
      description: 'Free tier with major providers',
    },
    {
      id: 'domain',
      name: 'Domain Name',
      category: 'service',
      minCost: 10,
      avgCost: 15,
      maxCost: 30,
      frequency: 'yearly',
      isOptional: true,
      description: 'Custom domain for production',
    },
    {
      id: 'ssl-cert',
      name: 'SSL Certificate',
      category: 'service',
      minCost: 0,
      avgCost: 0,
      maxCost: 0,
      frequency: 'yearly',
      isOptional: true,
      description: 'Free with Let\'s Encrypt',
    },
    {
      id: 'premium-course',
      name: 'Learning Resources (Udemy/Pluralsight)',
      category: 'course',
      minCost: 0,
      avgCost: 15,
      maxCost: 50,
      frequency: 'one-time',
      isOptional: true,
      description: 'Optional paid courses for deep learning',
    },
  ],
  'mobile-app': [
    {
      id: 'mobile-device',
      name: 'Mobile Device for Testing',
      category: 'hardware',
      minCost: 0,
      avgCost: 300,
      maxCost: 1000,
      frequency: 'one-time',
      isOptional: true,
      description: 'Optional - can use emulator',
    },
    {
      id: 'android-studio',
      name: 'Android Studio',
      category: 'software',
      minCost: 0,
      avgCost: 0,
      maxCost: 0,
      frequency: 'one-time',
      isOptional: false,
      description: 'Free IDE',
    },
    {
      id: 'app-store-account',
      name: 'App Store Developer Account',
      category: 'service',
      minCost: 25,
      avgCost: 25,
      maxCost: 99,
      frequency: 'yearly',
      isOptional: true,
      description: 'Required for publishing to stores',
    },
  ],
  'ml-ai': [
    {
      id: 'gpu-credits',
      name: 'GPU Credits (Google Colab/AWS)',
      category: 'service',
      minCost: 0,
      avgCost: 10,
      maxCost: 100,
      frequency: 'monthly',
      isOptional: false,
      description: 'Free tier available, paid for intensive training',
    },
    {
      id: 'ml-tools',
      name: 'ML Tools (TensorFlow/PyTorch)',
      category: 'software',
      minCost: 0,
      avgCost: 0,
      maxCost: 0,
      frequency: 'one-time',
      isOptional: false,
      description: 'Free open-source',
    },
    {
      id: 'data-storage',
      name: 'Data Storage (S3/GCS)',
      category: 'service',
      minCost: 0,
      avgCost: 5,
      maxCost: 50,
      frequency: 'monthly',
      isOptional: false,
      description: 'For dataset storage and management',
    },
  ],
};

// Calculate total budget for a project
export function calculateTotalBudget(
  projectId: string,
  items: BudgetItem[]
): ProjectBudget {
  let totalMinCost = 0;
  let totalAvgCost = 0;
  let totalMaxCost = 0;

  const breakdown: CostBreakdown = {
    hardware: 0,
    software: 0,
    service: 0,
    course: 0,
    other: 0,
  };

  items.forEach((item) => {
    // For recurring costs, annualize them (12 months)
    const multiplier =
      item.frequency === 'monthly'
        ? 12
        : item.frequency === 'yearly'
          ? 1
          : 1;

    totalMinCost += item.minCost * multiplier;
    totalAvgCost += item.avgCost * multiplier;
    totalMaxCost += item.maxCost * multiplier;

    breakdown[item.category] += item.avgCost * multiplier;
  });

  return {
    projectId,
    projectName: '',
    items,
    totalMinCost,
    totalAvgCost,
    totalMaxCost,
    breakdown,
  };
}

// Estimate project cost based on project type
export function estimateProjectCost(project: Module): ProjectBudget {
  let budgetItems: BudgetItem[] = [];

  // Determine project type from name/description
  const name = project.name.toLowerCase();
  const desc = project.description.toLowerCase();

  if (
    name.includes('fullstack') ||
    name.includes('web') ||
    name.includes('portfolio')
  ) {
    budgetItems = DEFAULT_BUDGET_ITEMS['fullstack-web'];
  } else if (
    name.includes('mobile') ||
    name.includes('app') ||
    name.includes('ios') ||
    name.includes('android')
  ) {
    budgetItems = DEFAULT_BUDGET_ITEMS['mobile-app'];
  } else if (
    name.includes('ml') ||
    name.includes('ai') ||
    name.includes('machine learning')
  ) {
    budgetItems = DEFAULT_BUDGET_ITEMS['ml-ai'];
  } else {
    // Default budget for general projects
    budgetItems = DEFAULT_BUDGET_ITEMS['fullstack-web'].slice(0, 2);
  }

  const budget = calculateTotalBudget(project.id, budgetItems);
  budget.projectName = project.name;

  return budget;
}

// Find cheaper alternatives to a project
export function findCheaperAlternatives(
  budget: number,
  projects: Module[]
): BudgetAlternative[] {
  const alternatives: BudgetAlternative[] = [];

  projects.forEach((project) => {
    const projectBudget = estimateProjectCost(project);

    if (projectBudget.totalAvgCost < budget) {
      const savings = budget - projectBudget.totalAvgCost;
      alternatives.push({
        name: project.name,
        description: project.description,
        cost: projectBudget.totalAvgCost,
        savings,
        isRecommended: savings > budget * 0.3, // Save 30% or more
      });
    }
  });

  return alternatives.sort((a, b) => b.savings - a.savings);
}

// Get pricing trends for items
export interface PriceTrend {
  itemName: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  forecast: string;
}

export function getPriceHistory(itemName: string): PriceTrend {
  // Simulated price history - in real scenario, this would query a database
  const trends: Record<string, PriceTrend> = {
    'hosting': {
      itemName: 'Web Hosting',
      trend: 'decreasing',
      change: -15,
      forecast: 'Prices continue to drop due to competition. Good time to lock in a plan.',
    },
    'cloud-storage': {
      itemName: 'Cloud Storage',
      trend: 'decreasing',
      change: -20,
      forecast: 'AWS and GCP are aggressively competing. Best rates in 5 years.',
    },
    'domain': {
      itemName: 'Domain Names',
      trend: 'stable',
      change: 0,
      forecast: 'Prices remain stable around $10-15/year.',
    },
    'gpu-credits': {
      itemName: 'GPU Credits',
      trend: 'increasing',
      change: 5,
      forecast: 'Demand rising for AI/ML. Free tiers shrinking, paid usage up 5%.',
    },
    'default': {
      itemName: itemName,
      trend: 'stable',
      change: 0,
      forecast: 'Price trend data not available.',
    },
  };

  return trends[itemName.toLowerCase()] || trends['default'];
}

// Categorize budget items into must-haves vs nice-to-haves
export interface BudgetTiers {
  mustHaves: BudgetItem[];
  niceToHaves: BudgetItem[];
  totalMustHavenCost: number;
  totalNiceToHaveCost: number;
  percentageRequired: number;
}

export function categorizeBudgetItems(items: BudgetItem[]): BudgetTiers {
  const mustHaves = items.filter((item) => !item.isOptional);
  const niceToHaves = items.filter((item) => item.isOptional);

  const totalMustHavenCost = mustHaves.reduce((sum, item) => {
    const multiplier =
      item.frequency === 'monthly'
        ? 12
        : item.frequency === 'yearly'
          ? 1
          : 1;
    return sum + item.avgCost * multiplier;
  }, 0);

  const totalNiceToHaveCost = niceToHaves.reduce((sum, item) => {
    const multiplier =
      item.frequency === 'monthly'
        ? 12
        : item.frequency === 'yearly'
          ? 1
          : 1;
    return sum + item.avgCost * multiplier;
  }, 0);

  const totalCost = totalMustHavenCost + totalNiceToHaveCost;
  const percentageRequired =
    totalCost > 0 ? (totalMustHavenCost / totalCost) * 100 : 0;

  return {
    mustHaves,
    niceToHaves,
    totalMustHavenCost,
    totalNiceToHaveCost,
    percentageRequired,
  };
}

// Suggest budget-friendly alternatives for expensive items
export interface CostReduction {
  originalItem: BudgetItem;
  alternative: BudgetItem;
  savings: number;
  tradeoff: string;
}

export function suggestBudgetAlternatives(
  items: BudgetItem[]
): CostReduction[] {
  const alternatives: CostReduction[] = [];

  items.forEach((item) => {
    const multiplier =
      item.frequency === 'monthly'
        ? 12
        : item.frequency === 'yearly'
          ? 1
          : 1;

    if (item.category === 'hardware') {
      // Suggest cloud alternative
      if (item.name.includes('Computer') || item.name.includes('Laptop')) {
        const cloudAlternative: BudgetItem = {
          id: item.id + '-cloud',
          name: 'Cloud Dev Environment (GitHub Codespaces)',
          category: 'service',
          minCost: 0,
          avgCost: 5,
          maxCost: 20,
          frequency: 'monthly',
          isOptional: true,
          description: 'Free tier with paid options',
        };

        alternatives.push({
          originalItem: item,
          alternative: cloudAlternative,
          savings: (item.avgCost - cloudAlternative.avgCost * 12) * multiplier,
          tradeoff:
            'Cloud environment: less powerful but no upfront cost',
        });
      }
    }

    if (item.category === 'service') {
      if (item.name.includes('Hosting')) {
        const freeAlternative: BudgetItem = {
          id: item.id + '-free',
          name: 'Free Hosting (GitHub Pages / Railway Free Tier)',
          category: 'service',
          minCost: 0,
          avgCost: 0,
          maxCost: 0,
          frequency: 'monthly',
          isOptional: true,
          description: 'Free tier with limitations',
        };

        alternatives.push({
          originalItem: item,
          alternative: freeAlternative,
          savings: item.avgCost * 12 * multiplier,
          tradeoff:
            'Free tier: storage/bandwidth limits and potential rate limiting',
        });
      }
    }
  });

  return alternatives.sort((a, b) => b.savings - a.savings);
}
