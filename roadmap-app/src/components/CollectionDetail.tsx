import { useState, useEffect } from 'react';
import {
  getCollection,
  updateCollection,
  removeProjectFromCollection,
  reorderProjectsInCollection,
  type ProjectCollection
} from '../utils/collectionStorage';
import './CollectionDetail.css';

interface CollectionDetailProps {
  collectionId: string;
  onBack: () => void;
}

type SortOption = 'name' | 'difficulty' | 'budget' | 'time';

// Mock project data - replace with actual data in integration
const MOCK_PROJECTS: Record<string, { name: string; difficulty: string; budget: string; time: string }> = {
  'proj_1': { name: 'Todo App', difficulty: 'beginner', budget: 'free', time: '2h' },
  'proj_2': { name: 'Weather API', difficulty: 'beginner', budget: 'free', time: '3h' },
  'proj_3': { name: 'Chat Application', difficulty: 'intermediate', budget: '$50', time: '20h' },
  'proj_4': { name: 'ML Model', difficulty: 'advanced', budget: '$100', time: '40h' }
};

export function CollectionDetail({ collectionId, onBack }: CollectionDetailProps) {
  const [collection, setCollection] = useState<ProjectCollection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    const loaded = getCollection(collectionId);
    if (loaded) {
      setCollection(loaded);
      setEditName(loaded.name);
      setEditDescription(loaded.description);
    }
  }, [collectionId]);

  const handleSaveEdits = () => {
    if (collection && editName.trim()) {
      const updated = updateCollection(collectionId, {
        name: editName,
        description: editDescription
      });
      if (updated) {
        setCollection(updated);
        setIsEditing(false);
      }
    }
  };

  const handleRemoveProject = (projectId: string) => {
    if (collection) {
      const updated = removeProjectFromCollection(collectionId, projectId);
      if (updated) {
        setCollection(updated);
      }
    }
  };

  const handleDragStart = (idx: number) => {
    setDraggedItem(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedItem === null || !collection) return;

    const newOrder = [...collection.projectIds];
    const [draggedId] = newOrder.splice(draggedItem, 1);
    newOrder.splice(targetIdx, 0, draggedId);

    const updated = reorderProjectsInCollection(collectionId, newOrder);
    if (updated) {
      setCollection(updated);
    }
    setDraggedItem(null);
  };

  const getSortedProjects = () => {
    if (!collection) return [];

    const projectsWithData = collection.projectIds.map(id => ({
      id,
      ...MOCK_PROJECTS[id] || { name: id, difficulty: 'unknown', budget: 'unknown', time: 'unknown' }
    }));

    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return projectsWithData.sort((a, b) =>
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) -
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        );
      case 'budget':
        return projectsWithData.sort((a, b) => a.budget.localeCompare(b.budget));
      case 'time':
        return projectsWithData.sort((a, b) => {
          const timeA = parseInt(a.time);
          const timeB = parseInt(b.time);
          return timeA - timeB;
        });
      case 'name':
      default:
        return projectsWithData.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const handleExport = () => {
    if (!collection) return;

    const exportData = {
      name: collection.name,
      description: collection.description,
      projects: getSortedProjects(),
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${collection.name.replace(/\s+/g, '-').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!collection) {
    return (
      <div className="collection-detail-container">
        <p>Loading collection...</p>
      </div>
    );
  }

  const sortedProjects = getSortedProjects();

  return (
    <div className="collection-detail-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Collections
      </button>

      {/* Header Section */}
      <div className="detail-header-section">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="edit-input-title"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="edit-textarea-description"
              rows={3}
            />
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSaveEdits}>
                Save
              </button>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="display-info">
            <h1>{collection.name}</h1>
            <p className="description">{collection.description}</p>
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="detail-controls">
        <div className="sort-control">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="difficulty">Difficulty</option>
            <option value="budget">Budget</option>
            <option value="time">Time Required</option>
          </select>
        </div>
        <button className="btn-export" onClick={handleExport}>
          Export as List
        </button>
      </div>

      {/* Projects List */}
      <div className="projects-section">
        <h2>Projects ({collection.projectIds.length})</h2>
        {sortedProjects.length === 0 ? (
          <p className="empty-state">No projects in this collection yet</p>
        ) : (
          <ul className="projects-list">
            {sortedProjects.map((project, idx) => (
              <li
                key={project.id}
                className={`project-item ${draggedItem === idx ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
              >
                <div className="project-drag-handle">⋮⋮</div>
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <div className="project-meta">
                    <span className={`badge difficulty-${project.difficulty}`}>
                      {project.difficulty}
                    </span>
                    <span className="badge budget">{project.budget}</span>
                    <span className="badge time">⏱ {project.time}</span>
                  </div>
                </div>
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveProject(project.id)}
                  title="Remove from collection"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
