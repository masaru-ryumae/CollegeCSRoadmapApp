import React, { useState, useMemo } from 'react';
import { ContentItem, ContentStatus } from '../types';
import {
  createContent,
  getContentByStatus,
  searchContent,
  approveContent,
  rejectContent,
  getPublishedContent,
  getCMSStatistics,
  trackContentView,
  getContentAnalytics,
  schedulePublication,
} from '../services/cmsEngine';
import './ContentPortal.css';

type FilterStatus = 'all' | ContentStatus;

interface ContentWithAnalytics extends ContentItem {
  analytics?: {
    views: number;
    engagement: number;
  };
}

export const ContentPortal: React.FC = () => {
  const [contentList, setContentList] = useState<ContentWithAnalytics[]>(getPublishedContent());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentWithAnalytics | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stats'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create new content form
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    type: 'tutorial' as const,
    content: '',
    tags: '',
    status: 'draft' as ContentStatus,
  });

  // Search and filter
  const filteredContent = useMemo(() => {
    let result = contentList;

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus);
    }

    if (searchQuery) {
      result = searchContent(searchQuery, {
        status: filterStatus === 'all' ? undefined : (filterStatus as ContentStatus),
      });
    }

    return result;
  }, [contentList, filterStatus, searchQuery]);

  // Create content
  const handleCreateContent = () => {
    if (!newContent.title.trim() || !newContent.content.trim()) {
      alert('Title and content are required');
      return;
    }

    const content = createContent(
      newContent.title,
      newContent.description,
      newContent.type,
      newContent.content,
      'user_current', // Replace with actual user ID
      newContent.tags.split(',').map((t) => t.trim())
    );

    setContentList([...contentList, content]);
    setNewContent({
      title: '',
      description: '',
      type: 'tutorial',
      content: '',
      tags: '',
      status: 'draft',
    });
    setShowCreateForm(false);
    alert('Content created successfully!');
  };

  // Submit for review
  const handleSubmitReview = (contentId: string) => {
    const updated = contentList.map((c) => {
      if (c.id === contentId) {
        return { ...c, status: 'review' as ContentStatus };
      }
      return c;
    });
    setContentList(updated);
  };

  // Approve content
  const handleApprove = (contentId: string) => {
    const approved = approveContent(contentId);
    if (approved) {
      const updated = contentList.map((c) => (c.id === contentId ? approved : c));
      setContentList(updated);
      alert('Content approved and published!');
    }
  };

  // Reject content
  const handleReject = (contentId: string) => {
    const reason = prompt('Rejection reason:');
    if (reason) {
      const rejected = rejectContent(contentId, reason);
      if (rejected) {
        const updated = contentList.map((c) => (c.id === contentId ? rejected : c));
        setContentList(updated);
        alert('Content rejected');
      }
    }
  };

  // View content
  const handleViewContent = (content: ContentWithAnalytics) => {
    trackContentView(content.id);
    const analytics = getContentAnalytics(content.id);
    setSelectedContent({
      ...content,
      analytics: analytics ? { views: analytics.views, engagement: analytics.engagement } : undefined,
    });
  };

  // Schedule publication
  const handleSchedule = (contentId: string) => {
    const date = prompt('Schedule publication date (YYYY-MM-DD HH:mm):');
    if (date) {
      const success = schedulePublication(contentId, new Date(date).toISOString());
      if (success) {
        alert('Content scheduled for publication!');
      }
    }
  };

  // Stats
  const stats = getCMSStatistics();

  return (
    <div className="content-portal">
      <div className="portal-header">
        <h1>Content Management System</h1>
        <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Content'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="create-form">
          <h2>Create New Content</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                placeholder="Content title"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                value={newContent.type}
                onChange={(e) =>
                  setNewContent({
                    ...newContent,
                    type: e.target.value as 'tutorial' | 'documentation' | 'guide' | 'resource',
                  })
                }
              >
                <option value="tutorial">Tutorial</option>
                <option value="documentation">Documentation</option>
                <option value="guide">Guide</option>
                <option value="resource">Resource</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                placeholder="Content description"
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label>Content *</label>
              <textarea
                value={newContent.content}
                onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                placeholder="Content text"
                rows={6}
              />
            </div>

            <div className="form-group full-width">
              <label>Tags</label>
              <input
                type="text"
                value={newContent.tags}
                onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={handleCreateContent}>
                Create
              </button>
              <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <h3>{stats.totalContent}</h3>
          <p>Total Content</p>
        </div>
        <div className="stat-card">
          <h3>{stats.published}</h3>
          <p>Published</p>
        </div>
        <div className="stat-card">
          <h3>{stats.inReview}</h3>
          <p>In Review</p>
        </div>
        <div className="stat-card">
          <h3>{stats.drafts}</h3>
          <p>Drafts</p>
        </div>
        <div className="stat-card">
          <h3>{stats.averageEngagement.toFixed(1)}</h3>
          <p>Avg Engagement</p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {(['all', 'published', 'review', 'draft', 'archived'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              className={`tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="view-options">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ≡
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ≈
          </button>
          <button
            className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
            title="Stats view"
          >
            📊
          </button>
        </div>
      </div>

      {/* Content Display */}
      <div className="content-display">
        {selectedContent ? (
          /* Detail View */
          <div className="detail-view">
            <button
              className="btn-back"
              onClick={() => setSelectedContent(null)}
            >
              ← Back
            </button>

            <div className="detail-header">
              <h2>{selectedContent.title}</h2>
              <span className={`status-badge status-${selectedContent.status}`}>
                {selectedContent.status}
              </span>
            </div>

            <div className="detail-meta">
              <span>Type: <strong>{selectedContent.type}</strong></span>
              <span>Created: <strong>{new Date(selectedContent.createdAt).toLocaleDateString()}</strong></span>
              <span>Views: <strong>{selectedContent.analytics?.views || 0}</strong></span>
              <span>Engagement: <strong>{selectedContent.analytics?.engagement || 0}</strong></span>
            </div>

            <p className="detail-description">{selectedContent.description}</p>

            <div className="detail-content">
              {selectedContent.content}
            </div>

            {selectedContent.tags.length > 0 && (
              <div className="detail-tags">
                {selectedContent.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              {selectedContent.status === 'draft' && (
                <button
                  className="btn-secondary"
                  onClick={() => handleSubmitReview(selectedContent.id)}
                >
                  Submit for Review
                </button>
              )}
              {selectedContent.status === 'review' && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => handleApprove(selectedContent.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleReject(selectedContent.id)}
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedContent.status === 'published' && (
                <button
                  className="btn-secondary"
                  onClick={() => handleSchedule(selectedContent.id)}
                >
                  Schedule Update
                </button>
              )}
            </div>
          </div>
        ) : (
          /* List/Grid View */
          <>
            {filteredContent.length === 0 ? (
              <p className="empty-state">No content found</p>
            ) : viewMode === 'list' ? (
              <table className="content-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((content) => (
                    <tr key={content.id}>
                      <td className="title-cell" onClick={() => handleViewContent(content)}>
                        {content.title}
                      </td>
                      <td>{content.type}</td>
                      <td>
                        <span className={`status-badge status-${content.status}`}>
                          {content.status}
                        </span>
                      </td>
                      <td>{new Date(content.createdAt).toLocaleDateString()}</td>
                      <td>{content.views}</td>
                      <td>
                        <button
                          className="btn-small"
                          onClick={() => handleViewContent(content)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="content-grid">
                {filteredContent.map((content) => (
                  <div
                    key={content.id}
                    className="content-card"
                    onClick={() => handleViewContent(content)}
                  >
                    <h3>{content.title}</h3>
                    <p>{content.description}</p>
                    <div className="card-meta">
                      <span className={`status-badge status-${content.status}`}>
                        {content.status}
                      </span>
                      <span className="type-badge">{content.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentPortal;
