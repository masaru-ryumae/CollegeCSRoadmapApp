import React, { useState, useEffect } from 'react';
import { addComment, replyToComment, getProjectComments, upvoteComment, downvoteComment, editComment, deleteComment, flagComment } from '../utils/discussions';
import './ProjectDiscussion.css';

interface ProjectDiscussionProps {
  projectId: string;
  userId: string;
  userName: string;
  isPublic?: boolean;
}

export function ProjectDiscussion({
  projectId,
  userId,
  userName,
  isPublic = true
}: ProjectDiscussionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'best'>('best');

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = () => {
    const projectComments = getProjectComments(projectId);
    setComments(projectComments);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(projectId, userId, userName, newComment);
    setNewComment('');
    loadComments();
  };

  const handleVoteComment = (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (voteType === 'upvote') {
      upvoteComment(commentId, userId);
    } else {
      downvoteComment(commentId, userId);
    }
    loadComments();
  };

  if (!isPublic) {
    return (
      <div className="project-discussion">
        <div className="discussion-locked">Comments are only available for public projects</div>
      </div>
    );
  }

  return (
    <div className="project-discussion">
      <div className="discussion-header">
        <h3>Discussion ({comments.length})</h3>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="best">Best First</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      <div className="comment-input-section">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="comment-textarea"
        />
        <div className="input-actions">
          <span>{newComment.length}/500</span>
          <button className="btn-comment" onClick={handleAddComment} disabled={!newComment.trim()}>
            Post
          </button>
        </div>
      </div>

      <div className="comments-section">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first!</p>
        ) : (
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="username">{comment.userName}</span>
                  <span className="timestamp">{formatTime(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                  <button className="btn-vote" onClick={() => handleVoteComment(comment.id, 'upvote')}>
                    👍 {comment.upvotes}
                  </button>
                  <button className="btn-vote" onClick={() => handleVoteComment(comment.id, 'downvote')}>
                    👎 {comment.downvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
