import React, { useState } from 'react';
import {
  submitContent,
  getPendingContributions,
  getApprovedContributions,
  getLeaderboard,
  getFeaturedContributors,
  getContributorStats,
  getCommunityStats,
  getContribution,
  approveContent,
  rejectContent,
  featureContent,
  searchContributions,
} from '../services/communityEngine';
import { Contribution, Contributor } from '../types';
import './ContentContributor.css';

type TabType = 'submit' | 'pending' | 'approved' | 'leaderboard' | 'featured';

export const ContentContributor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('submit');
  const [contributions, setContributions] = useState<Contribution[]>(getApprovedContributions());
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>(
    getPendingContributions()
  );
  const [leaderboard, setLeaderboard] = useState<Contributor[]>(getLeaderboard(20));
  const [featured, setFeatured] = useState<Contributor[]>(getFeaturedContributors());
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Submit form
  const [submitForm, setSubmitForm] = useState({
    title: '',
    content: '',
    type: 'tutorial' as const,
  });

  // Community stats
  const stats = getCommunityStats();

  // Submit contribution
  const handleSubmit = () => {
    if (!submitForm.title.trim() || !submitForm.content.trim()) {
      alert('Title and content are required');
      return;
    }

    const contribution = submitContent(
      submitForm.title,
      submitForm.content,
      submitForm.type,
      'user_current' // Replace with actual user ID
    );

    setPendingContributions([...pendingContributions, contribution]);
    setSubmitForm({ title: '', content: '', type: 'tutorial' });
    alert('Content submitted for review! Thank you for contributing.');
  };

  // Approve contribution
  const handleApprove = (contentId: string) => {
    const approved = approveContent(contentId, 'admin_user');
    if (approved) {
      setPendingContributions(pendingContributions.filter((c) => c.id !== contentId));
      setContributions([...contributions, approved]);
      alert('Content approved!');
    }
  };

  // Reject contribution
  const handleReject = (contentId: string) => {
    const feedback = prompt('Rejection feedback:');
    if (feedback) {
      const rejected = rejectContent(contentId, 'admin_user', feedback);
      if (rejected) {
        setPendingContributions(pendingContributions.filter((c) => c.id !== contentId));
        alert('Content rejected');
      }
    }
  };

  // Feature content
  const handleFeature = (contentId: string) => {
    const featured = featureContent(contentId);
    if (featured) {
      alert('Content featured!');
    }
  };

  // Search contributions
  const handleSearch = () => {
    const results = searchContributions(searchQuery);
    setContributions(results);
  };

  return (
    <div className="content-contributor">
      <div className="contributor-header">
        <h1>Community Content Hub</h1>
        <p>Share your knowledge and earn rewards</p>
      </div>

      {/* Stats Dashboard */}
      <div className="community-stats">
        <div className="stat-box">
          <h3>{stats.totalContributors}</h3>
          <p>Active Contributors</p>
        </div>
        <div className="stat-box">
          <h3>{stats.totalContributions}</h3>
          <p>Total Contributions</p>
        </div>
        <div className="stat-box">
          <h3>{stats.approvedContributions}</h3>
          <p>Approved</p>
        </div>
        <div className="stat-box">
          <h3>{stats.pendingReview}</h3>
          <p>Pending Review</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="contributor-tabs">
        {(['submit', 'pending', 'approved', 'leaderboard', 'featured'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'submit' && '📝 Submit'}
            {tab === 'pending' && `⏳ Pending (${pendingContributions.length})`}
            {tab === 'approved' && `✓ Approved`}
            {tab === 'leaderboard' && '🏆 Leaderboard'}
            {tab === 'featured' && '⭐ Featured'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Submit Tab */}
        {activeTab === 'submit' && (
          <div className="submit-section">
            <h2>Submit Your Content</h2>
            <p className="section-desc">
              Share tutorials, guides, or resources with the community. Your contributions help others learn!
            </p>

            <div className="reward-info">
              <h3>Reward System</h3>
              <ul>
                <li>
                  <strong>10 points</strong> - For submitting content
                </li>
                <li>
                  <strong>50 points</strong> - When your content is approved
                </li>
                <li>
                  <strong>100 points</strong> - When your content is featured
                </li>
                <li>
                  <strong>Badges</strong> - Unlock badges at milestones
                </li>
              </ul>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="submit-form"
            >
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                  placeholder="Give your content a catchy title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={submitForm.type}
                  onChange={(e) =>
                    setSubmitForm({
                      ...submitForm,
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

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={submitForm.content}
                  onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                  placeholder="Write your content here. Use markdown for formatting."
                  rows={10}
                  required
                />
              </div>

              <button type="submit" className="btn-submit">
                Submit for Review
              </button>
            </form>
          </div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="pending-section">
            <h2>Pending Review ({pendingContributions.length})</h2>

            {pendingContributions.length === 0 ? (
              <p className="empty-state">No pending contributions</p>
            ) : (
              <div className="contributions-list">
                {pendingContributions.map((contribution) => (
                  <div key={contribution.id} className="contribution-item">
                    <div className="contribution-header">
                      <h3>{contribution.title}</h3>
                      <span className="type-badge">{contribution.type}</span>
                    </div>
                    <p className="contribution-excerpt">
                      {contribution.content.substring(0, 150)}...
                    </p>
                    <div className="contribution-footer">
                      <span className="submitted">
                        Submitted {new Date(contribution.submittedAt).toLocaleDateString()}
                      </span>
                      <div className="contribution-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setSelectedContribution(contribution)}
                        >
                          View
                        </button>
                        <button
                          className="btn-success"
                          onClick={() => handleApprove(contribution.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleReject(contribution.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Tab */}
        {activeTab === 'approved' && (
          <div className="approved-section">
            <h2>Approved Contributions</h2>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Search contributions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn-secondary" onClick={handleSearch}>
                Search
              </button>
            </div>

            {contributions.length === 0 ? (
              <p className="empty-state">No approved contributions yet</p>
            ) : (
              <div className="contributions-grid">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="contribution-card">
                    <div className="card-header">
                      <h3>{contribution.title}</h3>
                      <span className={`status-badge status-${contribution.status}`}>
                        {contribution.status}
                      </span>
                    </div>
                    <p className="card-excerpt">
                      {contribution.content.substring(0, 100)}...
                    </p>
                    <div className="card-meta">
                      <span className="type-badge">{contribution.type}</span>
                      <span className="author">by {contribution.submittedBy}</span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-small"
                        onClick={() => setSelectedContribution(contribution)}
                      >
                        View Full
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => handleFeature(contribution.id)}
                      >
                        ⭐ Feature
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h2>Top Contributors</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Contributor</th>
                  <th>Contributions</th>
                  <th>Points</th>
                  <th>Badges</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((contributor, idx) => (
                  <tr key={contributor.id} className={idx < 3 ? `rank-${idx + 1}` : ''}>
                    <td className="rank">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx >= 3 && `#${idx + 1}`}
                    </td>
                    <td className="contributor-name">{contributor.username}</td>
                    <td>{contributor.contributions}</td>
                    <td className="points">{contributor.points}</td>
                    <td className="badges">
                      {contributor.badges.length > 0 ? (
                        contributor.badges.slice(0, 2).map((badge) => (
                          <span key={badge} className="badge-small" title={badge}>
                            {badge.substring(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="no-badges">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="featured-section">
            <h2>⭐ Featured Contributors</h2>
            <p className="section-desc">
              Spotlight on our most active and valued community members
            </p>

            {featured.length === 0 ? (
              <p className="empty-state">No featured contributors yet</p>
            ) : (
              <div className="featured-grid">
                {featured.map((contributor, idx) => (
                  <div key={contributor.id} className="featured-card">
                    <div className="featured-rank">
                      {idx === 0 && '👑'}
                      {idx > 0 && '⭐'}
                    </div>
                    <h3>{contributor.username}</h3>
                    <p className="bio">{contributor.bio || 'Dedicated community member'}</p>
                    <div className="featured-stats">
                      <div className="stat">
                        <span className="value">{contributor.contributions}</span>
                        <span className="label">Contributions</span>
                      </div>
                      <div className="stat">
                        <span className="value">{contributor.points}</span>
                        <span className="label">Points</span>
                      </div>
                    </div>
                    <div className="featured-badges">
                      {contributor.badges.map((badge) => (
                        <span key={badge} className="badge-featured">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedContribution && (
        <div className="detail-modal" onClick={() => setSelectedContribution(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-close"
              onClick={() => setSelectedContribution(null)}
            >
              ×
            </button>
            <h2>{selectedContribution.title}</h2>
            <p className="modal-type">{selectedContribution.type}</p>
            <div className="modal-body">{selectedContribution.content}</div>
            {selectedContribution.feedback && (
              <div className="feedback-box">
                <strong>Feedback:</strong> {selectedContribution.feedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentContributor;
