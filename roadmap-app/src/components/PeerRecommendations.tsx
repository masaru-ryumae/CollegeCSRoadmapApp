import React, { useState, useEffect } from 'react';
import { findSimilarUsers, getSimilarUserProjects, followUser, unfollowUser, isFollowing } from '../utils/similarityEngine';
import './PeerRecommendations.css';

interface PeerRecommendationsProps {
  userId: string;
  userExperience?: 'beginner' | 'intermediate' | 'advanced';
}

export function PeerRecommendations({ userId, userExperience = 'beginner' }: PeerRecommendationsProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const users = findSimilarUsers(userId, 10);
    setSimilarUsers(users);

    const projectRecs = getSimilarUserProjects(userId, 12);
    setProjects(projectRecs);

    const follows: Record<string, boolean> = {};
    users.forEach(u => {
      follows[u.profile.id] = isFollowing(userId, u.profile.id);
    });
    setFollowingMap(follows);
    setLoading(false);
  }, [userId]);

  const handleFollowToggle = (targetUserId: string) => {
    const currentFollowing = followingMap[targetUserId];
    if (currentFollowing) {
      unfollowUser(userId, targetUserId);
    } else {
      followUser(userId, targetUserId);
    }
    setFollowingMap(prev => ({ ...prev, [targetUserId]: !prev[targetUserId] }));
  };

  if (loading) {
    return <div className="peer-recommendations">Loading recommendations...</div>;
  }

  return (
    <div className="peer-recommendations">
      <div className="peer-header">
        <h2>Community Insights</h2>
      </div>

      <div className="peer-tabs">
        <button className={`peer-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          Recommended Projects ({projects.length})
        </button>
        <button className={`peer-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Similar Builders ({similarUsers.length})
        </button>
      </div>

      {activeTab === 'projects' && (
        <div className="peer-projects">
          {projects.length === 0 ? (
            <p className="no-content">No recommendations yet</p>
          ) : (
            <div className="projects-grid">
              {projects.map((project, idx) => (
                <div key={idx} className="project-card">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-meta">
                    <span>{project.userName}</span>
                    <span>{Math.round(project.matchScore * 100)}% Match</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="peer-users">
          {similarUsers.length === 0 ? (
            <p className="no-content">No similar users found</p>
          ) : (
            <div className="users-list">
              {similarUsers.map(({ profile, similarityScore }) => (
                <div key={profile.id} className="user-card">
                  <h3>{profile.name}</h3>
                  <p>{profile.experience} Builder</p>
                  <button
                    className={`btn-follow ${followingMap[profile.id] ? 'following' : ''}`}
                    onClick={() => handleFollowToggle(profile.id)}
                  >
                    {followingMap[profile.id] ? 'Following' : 'Follow'}
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
