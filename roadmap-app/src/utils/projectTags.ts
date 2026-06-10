// Project tagging system for categorizing and searching projects

export interface ProjectTag {
  id: string;
  name: string;
  category: 'skill' | 'topic' | 'usecase';
  color?: string;
}

export interface TaggedProject {
  projectId: string;
  projectName: string;
  tags: ProjectTag[];
  matchCount: number;
}

// Tag database
const TAGS_DATABASE: Record<string, ProjectTag> = {
  // Skill tags
  'tag-web': {
    id: 'tag-web',
    name: 'Web Development',
    category: 'skill',
    color: '#2196f3'
  },
  'tag-iot': {
    id: 'tag-iot',
    name: 'IoT',
    category: 'skill',
    color: '#4caf50'
  },
  'tag-robotics': {
    id: 'tag-robotics',
    name: 'Robotics',
    category: 'skill',
    color: '#ff9800'
  },
  'tag-datascience': {
    id: 'tag-datascience',
    name: 'Data Science',
    category: 'skill',
    color: '#f44336'
  },
  'tag-hardware': {
    id: 'tag-hardware',
    name: 'Hardware',
    category: 'skill',
    color: '#9c27b0'
  },
  'tag-backend': {
    id: 'tag-backend',
    name: 'Backend',
    category: 'skill',
    color: '#00bcd4'
  },
  'tag-frontend': {
    id: 'tag-frontend',
    name: 'Frontend',
    category: 'skill',
    color: '#e91e63'
  },
  'tag-ml': {
    id: 'tag-ml',
    name: 'Machine Learning',
    category: 'skill',
    color: '#673ab7'
  },

  // Topic tags
  'tag-api': {
    id: 'tag-api',
    name: 'API',
    category: 'topic',
    color: '#607d8b'
  },
  'tag-database': {
    id: 'tag-database',
    name: 'Database',
    category: 'topic',
    color: '#455a64'
  },
  'tag-ui': {
    id: 'tag-ui',
    name: 'UI/UX',
    category: 'topic',
    color: '#5e35b1'
  },
  'tag-auth': {
    id: 'tag-auth',
    name: 'Authentication',
    category: 'topic',
    color: '#d32f2f'
  },
  'tag-realtime': {
    id: 'tag-realtime',
    name: 'Real-time',
    category: 'topic',
    color: '#f57c00'
  },

  // Use case tags
  'tag-portfolio': {
    id: 'tag-portfolio',
    name: 'Portfolio Project',
    category: 'usecase',
    color: '#1976d2'
  },
  'tag-learning': {
    id: 'tag-learning',
    name: 'Learning Project',
    category: 'usecase',
    color: '#388e3c'
  },
  'tag-competition': {
    id: 'tag-competition',
    name: 'Competition',
    category: 'usecase',
    color: '#fbc02d'
  },
  'tag-social': {
    id: 'tag-social',
    name: 'Social Impact',
    category: 'usecase',
    color: '#c2185b'
  }
};

// Project-to-tags mapping
const PROJECT_TAGS_MAPPING: Record<string, string[]> = {
  'proj_1': ['tag-web', 'tag-learning', 'tag-frontend'],
  'proj_2': ['tag-web', 'tag-api', 'tag-learning', 'tag-frontend'],
  'proj_3': ['tag-web', 'tag-realtime', 'tag-database', 'tag-portfolio'],
  'proj_4': ['tag-web', 'tag-frontend', 'tag-ui', 'tag-portfolio'],
  'proj_5': ['tag-datascience', 'tag-database', 'tag-learning'],
  'proj_6': ['tag-datascience', 'tag-ml', 'tag-portfolio'],
  'proj_7': ['tag-backend', 'tag-database', 'tag-api'],
  'proj_8': ['tag-ml', 'tag-datascience', 'tag-portfolio'],
  'proj_9': ['tag-backend', 'tag-datascience', 'tag-portfolio', 'tag-competition'],
  'proj_10': ['tag-web', 'tag-portfolio', 'tag-social'],
  'proj_11': ['tag-hardware', 'tag-iot', 'tag-learning']
};

const TAG_PREFERENCES_KEY = 'cs-roadmap-tag-preferences';
const PROJECT_TAGS_CACHE_KEY = 'cs-roadmap-project-tags';

// Get all available tags
export function getAllTags(): ProjectTag[] {
  return Object.values(TAGS_DATABASE);
}

// Get tags by category
export function getTagsByCategory(category: 'skill' | 'topic' | 'usecase'): ProjectTag[] {
  return Object.values(TAGS_DATABASE).filter(tag => tag.category === category);
}

// Get tag by ID
export function getTag(tagId: string): ProjectTag | null {
  return TAGS_DATABASE[tagId] || null;
}

// Get all popular tags
export function getPopularTags(): ProjectTag[] {
  // Return tags in order of popularity
  const popularTagIds = [
    'tag-web',
    'tag-datascience',
    'tag-ml',
    'tag-api',
    'tag-database',
    'tag-portfolio',
    'tag-learning'
  ];

  return popularTagIds
    .map(id => getTag(id))
    .filter((tag): tag is ProjectTag => tag !== null);
}

// Get tags for a specific project
export function getProjectTags(projectId: string): ProjectTag[] {
  const tagIds = PROJECT_TAGS_MAPPING[projectId] || [];
  return tagIds
    .map(id => getTag(id))
    .filter((tag): tag is ProjectTag => tag !== null);
}

// Search projects by tag
export function searchByTag(tagId: string): TaggedProject[] {
  const tag = getTag(tagId);
  if (!tag) return [];

  const projects: TaggedProject[] = [];

  Object.entries(PROJECT_TAGS_MAPPING).forEach(([projectId, tagIds]) => {
    if (tagIds.includes(tagId)) {
      const tags = getProjectTags(projectId);
      projects.push({
        projectId,
        projectName: `Project ${projectId}`,
        tags,
        matchCount: 1
      });
    }
  });

  return projects;
}

// Search projects by multiple tags (AND operation)
export function searchByTags(tagIds: string[]): TaggedProject[] {
  if (tagIds.length === 0) {
    return Object.entries(PROJECT_TAGS_MAPPING).map(([projectId, tags]) => ({
      projectId,
      projectName: `Project ${projectId}`,
      tags: getProjectTags(projectId),
      matchCount: tags.length
    }));
  }

  const tagSet = new Set(tagIds);
  const projects: TaggedProject[] = [];

  Object.entries(PROJECT_TAGS_MAPPING).forEach(([projectId, projectTagIds]) => {
    const matchedTags = projectTagIds.filter(tag => tagSet.has(tag));

    if (matchedTags.length > 0) {
      projects.push({
        projectId,
        projectName: `Project ${projectId}`,
        tags: getProjectTags(projectId),
        matchCount: matchedTags.length
      });
    }
  });

  // Sort by match count (most relevant first)
  return projects.sort((a, b) => b.matchCount - a.matchCount);
}

// Get tag preferences for user
export function getUserTagPreferences(userId: string): string[] {
  try {
    const stored = localStorage.getItem(TAG_PREFERENCES_KEY);
    if (!stored) return [];

    const preferences = JSON.parse(stored);
    return preferences[userId] || [];
  } catch (error) {
    console.error('Error loading tag preferences:', error);
    return [];
  }
}

// Save tag preferences for user
export function saveUserTagPreferences(userId: string, tagIds: string[]): void {
  try {
    const stored = localStorage.getItem(TAG_PREFERENCES_KEY);
    const preferences = stored ? JSON.parse(stored) : {};

    preferences[userId] = tagIds;
    localStorage.setItem(TAG_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving tag preferences:', error);
  }
}

// Add tag to user preferences
export function addTagPreference(userId: string, tagId: string): void {
  const prefs = getUserTagPreferences(userId);
  if (!prefs.includes(tagId)) {
    prefs.push(tagId);
    saveUserTagPreferences(userId, prefs);
  }
}

// Remove tag from user preferences
export function removeTagPreference(userId: string, tagId: string): void {
  const prefs = getUserTagPreferences(userId).filter(id => id !== tagId);
  saveUserTagPreferences(userId, prefs);
}

// Get recommended projects based on user tag preferences
export function getRecommendedProjectsByTags(userId: string): TaggedProject[] {
  const userPrefs = getUserTagPreferences(userId);

  if (userPrefs.length === 0) {
    // Return all projects if no preferences
    return Object.entries(PROJECT_TAGS_MAPPING).map(([projectId, tagIds]) => ({
      projectId,
      projectName: `Project ${projectId}`,
      tags: getProjectTags(projectId),
      matchCount: tagIds.length
    }));
  }

  return searchByTags(userPrefs);
}

// Get tag cloud data
export interface TagCloudItem {
  tag: ProjectTag;
  frequency: number;
  percentage: number;
}

export function getTagCloud(): TagCloudItem[] {
  const frequencyMap: Record<string, number> = {};

  // Count tag frequency
  Object.values(PROJECT_TAGS_MAPPING).forEach(tagIds => {
    tagIds.forEach(tagId => {
      frequencyMap[tagId] = (frequencyMap[tagId] || 0) + 1;
    });
  });

  const maxFreq = Math.max(...Object.values(frequencyMap), 1);
  const totalProjects = Object.keys(PROJECT_TAGS_MAPPING).length;

  return Object.entries(frequencyMap)
    .map(([tagId, frequency]) => {
      const tag = getTag(tagId);
      return tag
        ? {
            tag,
            frequency,
            percentage: (frequency / totalProjects) * 100
          }
        : null;
    })
    .filter((item): item is TagCloudItem => item !== null)
    .sort((a, b) => b.frequency - a.frequency);
}

// Search projects by keyword (searches tag names and project info)
export function searchProjects(query: string): TaggedProject[] {
  const lowerQuery = query.toLowerCase();
  const matchingTagIds = Object.entries(TAGS_DATABASE)
    .filter(([, tag]) => tag.name.toLowerCase().includes(lowerQuery))
    .map(([id]) => id);

  if (matchingTagIds.length === 0) return [];

  const projects: TaggedProject[] = [];
  const projectSet = new Set<string>();

  matchingTagIds.forEach(tagId => {
    searchByTag(tagId).forEach(project => {
      if (!projectSet.has(project.projectId)) {
        projectSet.add(project.projectId);
        projects.push(project);
      }
    });
  });

  return projects;
}

// Get suggested tags (based on popularity and user history)
export function getSuggestedTags(userId: string): ProjectTag[] {
  const userPrefs = new Set(getUserTagPreferences(userId));
  const popular = getPopularTags();

  // Return popular tags not yet in user preferences
  return popular.filter(tag => !userPrefs.has(tag.id)).slice(0, 5);
}

// Clear user tag cache when needed
export function clearTagCache(userId: string): void {
  try {
    const stored = localStorage.getItem(PROJECT_TAGS_CACHE_KEY);
    if (stored) {
      const cache = JSON.parse(stored);
      delete cache[userId];
      localStorage.setItem(PROJECT_TAGS_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error clearing tag cache:', error);
  }
}
