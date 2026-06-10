import { useState, useEffect, useRef } from 'react';
import { Module, TechLevel } from '../types/index';
import {
  fuzzySearch,
  filterProjects,
  rankResults,
  getSearchSuggestions,
  SearchFilters,
  SearchResult,
  SearchHistoryManager,
  SavedSearchesManager,
  getCachedSearchResults,
  cacheSearchResults,
} from '../utils/searchEngine';
import '../styles/AdvancedSearch.css';

interface AdvancedSearchProps {
  modules: Module[];
  onSelect?: (module: Module) => void;
}

export function AdvancedSearch({ modules, onSelect }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'difficulty' | 'hours' | 'name'>(
    'relevance'
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<
    Array<{ name: string; filters: SearchFilters }>
  >([]);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'saved'>(
    'search'
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyManager = useRef(new SearchHistoryManager());
  const savedSearchesManager = useRef(new SavedSearchesManager());

  // Load history and saved searches on mount
  useEffect(() => {
    setSearchHistory(historyManager.current.getHistory());
    setSavedSearches(savedSearchesManager.current.getSavedSearches());
  }, []);

  // Perform search
  useEffect(() => {
    const performSearch = () => {
      // Check cache first
      const cacheKey = `${searchQuery}|${JSON.stringify(filters)}`;
      const cached = getCachedSearchResults(cacheKey);

      if (cached) {
        const sorted = rankResults(cached, sortBy);
        setResults(sorted);
        return;
      }

      // Filter modules
      let filtered = filterProjects(modules, filters);

      // Perform text search if query exists
      let searched: SearchResult[] = [];
      if (searchQuery.trim()) {
        searched = fuzzySearch(searchQuery, filtered);
      } else {
        searched = filtered.map((module) => ({
          module,
          score: 50,
          matchedTerms: [],
          relevanceReason: 'Matches filters',
        }));
      }

      // Rank results
      const sorted = rankResults(searched, sortBy);

      // Cache results
      cacheSearchResults(cacheKey, sorted);

      setResults(sorted);
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, sortBy, modules]);

  // Generate suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const newSuggestions = getSearchSuggestions(searchQuery, modules, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, modules]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    historyManager.current.addSearch(query);
    setSearchHistory(historyManager.current.getHistory());
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleSaveSearch = () => {
    const name = prompt('Name for this search:');
    if (name) {
      savedSearchesManager.current.saveSearch(name, filters);
      setSavedSearches(savedSearchesManager.current.getSavedSearches());
    }
  };

  const handleLoadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    setActiveTab('search');
  };

  const handleDeleteSavedSearch = (name: string) => {
    savedSearchesManager.current.deleteSearch(name);
    setSavedSearches(savedSearchesManager.current.getSavedSearches());
  };

  const handleClearHistory = () => {
    historyManager.current.clearHistory();
    setSearchHistory([]);
  };

  const difficultyLevels: TechLevel[] = [
    'beginner',
    'intermediate',
    'advanced',
  ];

  return (
    <div className="advanced-search-container">
      <div className="search-header">
        <h2>Advanced Project Search</h2>
        <p>Find the perfect project for your skill level and timeline</p>
      </div>

      <div className="search-input-wrapper">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search modules by name, skill, or topic..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
          className="search-input"
          aria-label="Search modules"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setResults([]);
            }}
            className="clear-search-btn"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="suggestion-item"
                onClick={() => handleSearch(suggestion)}
              >
                <span className="suggestion-icon">🔍</span>
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="search-controls">
        <div className="filter-group">
          <label>Difficulty Level</label>
          <div className="checkbox-group">
            {difficultyLevels.map((level) => (
              <label key={level} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.difficultyLevels?.includes(level) || false}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...(filters.difficultyLevels || []), level]
                      : filters.difficultyLevels?.filter((d) => d !== level) ||
                        [];
                    handleFilterChange({ difficultyLevels: updated });
                  }}
                />
                <span className="checkbox-text">
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="min-hours">Min Hours: {filters.minHours || 'any'}</label>
          <input
            id="min-hours"
            type="range"
            min="0"
            max="40"
            step="1"
            value={filters.minHours || 0}
            onChange={(e) =>
              handleFilterChange({
                minHours: parseInt(e.target.value) || undefined,
              })
            }
            className="range-slider"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="max-hours">Max Hours: {filters.maxHours || 'any'}</label>
          <input
            id="max-hours"
            type="range"
            min="0"
            max="40"
            step="1"
            value={filters.maxHours || 40}
            onChange={(e) =>
              handleFilterChange({
                maxHours: parseInt(e.target.value) || undefined,
              })
            }
            className="range-slider"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort By</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as 'relevance' | 'difficulty' | 'hours' | 'name'
              )
            }
            className="select-input"
          >
            <option value="relevance">Relevance</option>
            <option value="difficulty">Difficulty</option>
            <option value="hours">Duration</option>
            <option value="name">Name</option>
          </select>
        </div>

        <button
          onClick={handleSaveSearch}
          className="save-search-btn"
          title="Save current search filters"
        >
          💾 Save Search
        </button>
      </div>

      <div className="search-tabs">
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Results ({results.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({searchHistory.length})
        </button>
        <button
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved ({savedSearches.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="search-results">
          {results.length === 0 && searchQuery && (
            <div className="no-results">
              <p>No projects found matching your criteria.</p>
              <p className="help-text">Try adjusting your filters or search term.</p>
            </div>
          )}

          {results.length === 0 && !searchQuery && filters.difficultyLevels && (
            <div className="no-results">
              <p>No projects match your filters.</p>
            </div>
          )}

          {results.map((result, idx) => (
            <div
              key={idx}
              className="search-result-card"
              onClick={() => onSelect?.(result.module)}
            >
              <div className="result-header">
                <h3>{result.module.name}</h3>
                <span className="relevance-score">
                  Match: {Math.round(result.score / 10)}%
                </span>
              </div>
              <p className="result-description">{result.module.description}</p>
              <div className="result-meta">
                <span className="meta-item">
                  📚 {result.module.hours.intermediate.toFixed(1)}h avg
                </span>
                <span className="meta-item">
                  {result.module.dependencies.length > 0
                    ? `🔗 ${result.module.dependencies.length} prerequisite(s)`
                    : '✓ No prerequisites'}
                </span>
                <span className="relevance-reason">
                  {result.relevanceReason}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-list">
          {searchHistory.length === 0 ? (
            <p className="empty-state">No search history yet.</p>
          ) : (
            <>
              <div className="history-items">
                {searchHistory.map((query, idx) => (
                  <div
                    key={idx}
                    className="history-item"
                    onClick={() => handleSearch(query)}
                  >
                    <span className="history-icon">🕐</span>
                    {query}
                  </div>
                ))}
              </div>
              <button onClick={handleClearHistory} className="clear-history-btn">
                Clear History
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="saved-searches-list">
          {savedSearches.length === 0 ? (
            <p className="empty-state">No saved searches yet.</p>
          ) : (
            <div className="saved-items">
              {savedSearches.map((saved, idx) => (
                <div key={idx} className="saved-item">
                  <div
                    className="saved-item-content"
                    onClick={() => handleLoadSavedSearch(saved.filters)}
                  >
                    <span className="saved-icon">⭐</span>
                    <div>
                      <h4>{saved.name}</h4>
                      <p className="saved-filters">
                        {Object.values(saved.filters).filter(Boolean).length}{' '}
                        filter(s) active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSavedSearch(saved.name);
                    }}
                    className="delete-saved-btn"
                    aria-label="Delete saved search"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
