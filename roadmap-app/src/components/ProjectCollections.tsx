import { useState, useEffect } from 'react';
import {
  getUserCollections,
  createCollection,
  deleteCollection,
  shareCollection,
  createPreMadeCollections,
  type ProjectCollection
} from '../utils/collectionStorage';
import './ProjectCollections.css';

interface ProjectCollectionsProps {
  userId: string;
}

export function ProjectCollections({ userId }: ProjectCollectionsProps) {
  const [collections, setCollections] = useState<ProjectCollection[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<ProjectCollection | null>(null);
  const [sharedLinks, setSharedLinks] = useState<Map<string, string>>(new Map());

  // Initialize collections on mount
  useEffect(() => {
    createPreMadeCollections(userId);
    loadCollections();
  }, [userId]);

  const loadCollections = () => {
    const loaded = getUserCollections(userId);
    setCollections(loaded);
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    createCollection(userId, newCollectionName, newCollectionDescription);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCreateModal(false);
    loadCollections();
  };

  const handleDeleteCollection = (collectionId: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteCollection(collectionId);
      setSelectedCollection(null);
      loadCollections();
    }
  };

  const handleShareCollection = (collectionId: string) => {
    const link = shareCollection(collectionId);
    if (link) {
      setSharedLinks(new Map(sharedLinks).set(collectionId, link));
      loadCollections();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Collection link copied to clipboard!');
  };

  return (
    <div className="project-collections">
      <div className="collections-header">
        <h2>My Collections</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Collection
        </button>
      </div>

      {/* Collections Grid */}
      <div className="collections-grid">
        {collections.map(collection => (
          <div
            key={collection.id}
            className={`collection-card ${selectedCollection?.id === collection.id ? 'active' : ''}`}
            onClick={() => setSelectedCollection(collection)}
          >
            <div className="collection-content">
              <h3>{collection.name}</h3>
              <p className="description">{collection.description}</p>
              <div className="collection-stats">
                <span className="stat">
                  {collection.projectIds.length} projects
                </span>
                <span className="stat">
                  {new Date(collection.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="collection-actions">
              {collection.isShared && sharedLinks.has(collection.id) && (
                <button
                  className="btn-share-active"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(sharedLinks.get(collection.id)!);
                  }}
                  title="Copy share link"
                >
                  ✓ Shared
                </button>
              )}
              {!collection.isShared && (
                <button
                  className="btn-share"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareCollection(collection.id);
                  }}
                >
                  Share
                </button>
              )}
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCollection(collection.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Collection Detail */}
      {selectedCollection && (
        <div className="collection-detail">
          <div className="detail-header">
            <h3>{selectedCollection.name}</h3>
            <button
              className="btn-close"
              onClick={() => setSelectedCollection(null)}
            >
              ×
            </button>
          </div>
          <p className="detail-description">{selectedCollection.description}</p>
          <div className="project-list">
            <h4>Projects ({selectedCollection.projectIds.length})</h4>
            {selectedCollection.projectIds.length === 0 ? (
              <p className="empty-message">No projects in this collection yet</p>
            ) : (
              <ul>
                {selectedCollection.projectIds.map((projectId, idx) => (
                  <li key={idx}>{projectId}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Collection</h2>
            <input
              type="text"
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="modal-input"
            />
            <textarea
              placeholder="Description (optional)"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              className="modal-textarea"
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleCreateCollection}
              >
                Create
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
