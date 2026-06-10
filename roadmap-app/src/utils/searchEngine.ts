// Advanced search engine with full-text search, filtering, and ranking
import { Module, TechLevel } from '../types/index';

export interface SearchFilters {
  categories?: string[];
  difficultyLevels?: TechLevel[];
  minHours?: number;
  maxHours?: number;
  skills?: string[];
  searchTerm?: string;
}

export interface SearchResult {
  module: Module;
  score: number;
  matchedTerms: string[];
  relevanceReason: string;
}

export type SortOption = 'relevance' | 'difficulty' | 'hours' | 'rating' | 'name';

// Simple but effective fuzzy search implementation
export function fuzzySearch(
  query: string,
  modules: Module[]
): SearchResult[] {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const module of modules) {
    let score = 0;
    const matchedTerms: string[] = [];

    // Exact match in name (highest priority)
    if (module.name.toLowerCase().includes(queryLower)) {
      score += 100;
      matchedTerms.push(module.name);
    }

    // Exact match in description
    if (module.description.toLowerCase().includes(queryLower)) {
      score += 50;
      matchedTerms.push(module.description);
    }

    // Match in key points
    module.key_points.forEach((point) => {
      if (point.toLowerCase().includes(queryLower)) {
        score += 30;
        matchedTerms.push(point);
      }
    });

    // Character-by-character fuzzy match (for typos)
    const fuzzyScore = calculateFuzzyScore(queryLower, module.name.toLowerCase());
    if (fuzzyScore > 0) {
      score += fuzzyScore;
    }

    if (score > 0) {
      results.push({
        module,
        score,
        matchedTerms,
        relevanceReason: determineRelevanceReason(matchedTerms, module),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// Calculate fuzzy match score (handles typos and partial matches)
function calculateFuzzyScore(query: string, text: string): number {
  let score = 0;
  let queryIndex = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 5;
      queryIndex++;
    }
  }

  // Bonus for finding all characters
  if (queryIndex === query.length) {
    score += 20;
  }

  return score;
}

function determineRelevanceReason(
  matchedTerms: string[],
  module: Module
): string {
  if (matchedTerms.some((t) => t === module.name)) {
    return 'Matches module name';
  }
  if (matchedTerms.some((t) => t === module.description)) {
    return 'Matches description';
  }
  return 'Matches key points';
}

// Filter modules based on multiple criteria
export function filterProjects(
  modules: Module[],
  filters: SearchFilters
): Module[] {
  return modules.filter((module) => {
    // Filter by difficulty
    if (filters.difficultyLevels && filters.difficultyLevels.length > 0) {
      const moduleHasDifficulty = filters.difficultyLevels.some(
        (level) => module.hours[level] > 0
      );
      if (!moduleHasDifficulty) return false;
    }

    // Filter by hours
    const avgHours =
      (module.hours.beginner + module.hours.intermediate + module.hours.advanced) /
      3;

    if (filters.minHours !== undefined && avgHours < filters.minHours) {
      return false;
    }

    if (filters.maxHours !== undefined && avgHours > filters.maxHours) {
      return false;
    }

    // Filter by skills (check key points for skill mentions)
    if (filters.skills && filters.skills.length > 0) {
      const hasSkill = filters.skills.some((skill) =>
        module.key_points.some((point) =>
          point.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasSkill) return false;
    }

    return true;
  });
}

// Rank results based on sort preference
export function rankResults(
  results: SearchResult[],
  sortBy: SortOption = 'relevance'
): SearchResult[] {
  const sorted = [...results];

  switch (sortBy) {
    case 'relevance':
      return sorted.sort((a, b) => b.score - a.score);

    case 'difficulty':
      return sorted.sort((a, b) => {
        const aAvg =
          (a.module.hours.beginner +
            a.module.hours.intermediate +
            a.module.hours.advanced) /
          3;
        const bAvg =
          (b.module.hours.beginner +
            b.module.hours.intermediate +
            b.module.hours.advanced) /
          3;
        return aAvg - bAvg;
      });

    case 'hours':
      return sorted.sort((a, b) => {
        const aAvg =
          (a.module.hours.beginner +
            a.module.hours.intermediate +
            a.module.hours.advanced) /
          3;
        const bAvg =
          (b.module.hours.beginner +
            b.module.hours.intermediate +
            b.module.hours.advanced) /
          3;
        return aAvg - bAvg;
      });

    case 'name':
      return sorted.sort((a, b) =>
        a.module.name.localeCompare(b.module.name)
      );

    case 'rating':
      // Future: integrate with rating system
      return sorted;

    default:
      return sorted;
  }
}

// Cache for search results
const searchCache = new Map<string, SearchResult[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export function cacheSearchResults(
  key: string,
  results: SearchResult[]
): void {
  searchCache.set(key, results);
  cacheTimestamps.set(key, Date.now());
}

export function getCachedSearchResults(key: string): SearchResult[] | null {
  const cached = searchCache.get(key);
  const timestamp = cacheTimestamps.get(key);

  if (!cached || !timestamp) return null;

  if (Date.now() - timestamp > CACHE_TTL) {
    searchCache.delete(key);
    cacheTimestamps.delete(key);
    return null;
  }

  return cached;
}

// Generate search suggestions based on query
export function getSearchSuggestions(
  query: string,
  modules: Module[],
  limit: number = 5
): string[] {
  if (!query.trim()) {
    // Return popular modules
    return modules.slice(0, limit).map((m) => m.name);
  }

  const queryLower = query.toLowerCase();
  const suggestions = new Set<string>();

  // Add matching module names
  for (const module of modules) {
    if (
      module.name.toLowerCase().includes(queryLower) &&
      suggestions.size < limit
    ) {
      suggestions.add(module.name);
    }
  }

  // Add matching key points
  for (const module of modules) {
    for (const point of module.key_points) {
      if (
        point.toLowerCase().includes(queryLower) &&
        suggestions.size < limit
      ) {
        suggestions.add(point.substring(0, 50)); // Truncate long key points
      }
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

// Search history manager
export class SearchHistoryManager {
  private maxHistory = 20;
  private storageKey = 'searchHistory';

  getHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addSearch(query: string): void {
    const history = this.getHistory();
    const filtered = history.filter((h) => h !== query); // Remove duplicates
    const updated = [query, ...filtered].slice(0, this.maxHistory);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Storage full or disabled, silently fail
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Storage error, silently fail
    }
  }
}

// Saved searches manager
export class SavedSearchesManager {
  private storageKey = 'savedSearches';

  getSavedSearches(): Array<{ name: string; filters: SearchFilters }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveSearch(name: string, filters: SearchFilters): void {
    const searches = this.getSavedSearches();
    const updated = [...searches, { name, filters }];

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Storage error, silently fail
    }
  }

  deleteSearch(name: string): void {
    const searches = this.getSavedSearches();
    const updated = searches.filter((s) => s.name !== name);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Storage error, silently fail
    }
  }
}
