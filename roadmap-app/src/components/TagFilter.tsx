import { useState, useEffect } from 'react';
import {
  getAllTags,
  getPopularTags,
  getTagCloud,
  getRecommendedProjectsByTags,
  getUserTagPreferences,
  saveUserTagPreferences,
  addTagPreference,
  removeTagPreference,
  getSuggestedTags,
  searchProjects,
  type ProjectTag,
  type TagCloudItem
} from '../utils/projectTags';
import './TagFilter.css';

interface TagFilterProps {
  userId: string;
}

export function TagFilter({ userId }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<ProjectTag[]>([]);
  const [popularTags, setPopularTags] = useState<ProjectTag[]>([]);
  const [tagCloud, setTagCloud] = useState<TagCloudItem[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<ProjectTag[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = () => {
    setAllTags(getAllTags());
    setPopularTags(getPopularTags());
    setTagCloud(getTagCloud());
    setSuggestedTags(getSuggestedTags(userId));

    // Load saved preferences
    const saved = getUserTagPreferences(userId);
    setSelectedTags(saved);
    updateFilteredProjects(saved);
  };

  const updateFilteredProjects = (tagIds: string[]) => {
    const projects = getRecommendedProjectsByTags(userId);
    if (tagIds.length === 0) {
      setFilteredProjects(projects);
    } else {
      // Filter by selected tags
      const filtered = projects.filter(p =>
        tagIds.some(tagId => p.tags.some(t => t.id === tagId))
      );
      setFilteredProjects(filtered);
    }
  };

  const handleToggleTag = (tagId: string) => {
    let newTags: string[];

    if (selectedTags.includes(tagId)) {
      newTags = selectedTags.filter(id => id !== tagId);
      removeTagPreference(userId, tagId);
    } else {
      newTags = [...selectedTags, tagId];
      addTagPreference(userId, tagId);
    }

    setSelectedTags(newTags);
    updateFilteredProjects(newTags);
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    saveUserTagPreferences(userId, []);
    updateFilteredProjects([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchProjects(query);
      setFilteredProjects(results);
    } else {
      updateFilteredProjects(selectedTags);
    }
  };

  const getTagColor = (tag: ProjectTag): string => {
    return tag.color || '#667eea';
  };

  return (
    <div className="tag-filter">
      <div className="tf-header">
        <h1>Project Discovery</h1>
        <p>Find projects by skills, topics, and use cases</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search tags or projects..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              updateFilteredProjects(selectedTags);
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Popular Tags Carousel */}
      <div className="popular-tags-section">
        <h2>Popular Tags</h2>
        <div className="tags-carousel">
          {popularTags.map(tag => (
            <button
              key={tag.id}
              className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? getTagColor(tag) : 'white',
                borderColor: getTagColor(tag),
                color: selectedTags.includes(tag.id) ? 'white' : getTagColor(tag)
              }}
              onClick={() => handleToggleTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Cloud */}
      <div className="tag-cloud-section">
        <div className="cloud-header">
          <h2>Tag Cloud</h2>
          <button
            className="btn-toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} All Tags
          </button>
        </div>

        {!showAdvanced ? (
          <div className="tag-cloud">
            {tagCloud.slice(0, 12).map(item => (
              <button
                key={item.tag.id}
                className={`cloud-tag ${selectedTags.includes(item.tag.id) ? 'selected' : ''}`}
                style={{
                  fontSize: `${0.9 + (item.frequency / 5) * 0.4}rem`,
                  backgroundColor: selectedTags.includes(item.tag.id)
                    ? getTagColor(item.tag)
                    : 'transparent',
                  color: selectedTags.includes(item.tag.id)
                    ? 'white'
                    : getTagColor(item.tag)
                }}
                onClick={() => handleToggleTag(item.tag.id)}
                title={`${item.frequency} projects`}
              >
                {item.tag.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="advanced-tags">
            {['skill', 'topic', 'usecase'].map(category => (
              <div key={category} className="tag-category">
                <h3>{category === 'skill' ? 'Skills' : category === 'topic' ? 'Topics' : 'Use Cases'}</h3>
                <div className="category-tags">
                  {allTags
                    .filter(t => t.category === category)
                    .map(tag => (
                      <button
                        key={tag.id}
                        className={`category-tag ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                        style={{
                          borderColor: getTagColor(tag),
                          backgroundColor: selectedTags.includes(tag.id)
                            ? getTagColor(tag)
                            : 'white',
                          color: selectedTags.includes(tag.id)
                            ? 'white'
                            : getTagColor(tag)
                        }}
                        onClick={() => handleToggleTag(tag.id)}
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="selected-tags-section">
          <div className="selected-header">
            <h3>Selected Filters ({selectedTags.length})</h3>
            <button className="btn-clear-all" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
          <div className="selected-tags">
            {selectedTags.map(tagId => {
              const tag = allTags.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tagId}
                  className="selected-tag"
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  {tag.name}
                  <button
                    className="tag-remove"
                    onClick={() => handleToggleTag(tagId)}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && selectedTags.length === 0 && (
        <div className="suggested-tags-section">
          <h3>You might like...</h3>
          <div className="suggested-tags">
            {suggestedTags.map(tag => (
              <button
                key={tag.id}
                className="suggested-tag"
                style={{ borderColor: getTagColor(tag) }}
                onClick={() => {
                  handleToggleTag(tag.id);
                }}
              >
                <span className="tag-name">{tag.name}</span>
                <span className="tag-add">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Projects */}
      <div className="filtered-projects-section">
        <div className="results-header">
          <h2>Results ({filteredProjects.length})</h2>
          {selectedTags.length > 0 && (
            <span className="filter-info">
              Filtering by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-results">
            <p>No projects found matching your filters.</p>
            <button className="btn-reset" onClick={handleClearAll}>
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="projects-list">
            {filteredProjects.map(project => (
              <div key={project.projectId} className="project-result-card">
                <div className="card-header">
                  <h3>{project.projectName}</h3>
                  <span className="match-badge">
                    {project.matchCount > 1 ? `+${project.matchCount} matches` : 'Match'}
                  </span>
                </div>

                <div className="project-tags">
                  {project.tags.map(tag => (
                    <span
                      key={tag.id}
                      className={`project-tag ${selectedTags.includes(tag.id) ? 'selected-tag-badge' : ''}`}
                      style={{
                        backgroundColor: selectedTags.includes(tag.id)
                          ? getTagColor(tag)
                          : `${getTagColor(tag)}20`,
                        color: selectedTags.includes(tag.id) ? 'white' : getTagColor(tag)
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                <button className="btn-view-project">View Project →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
