export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  parentCommentId: string | null;
  upvotes: number;
  downvotes: number;
  isEdited: boolean;
  flagged: boolean;
  flagCount: number;
}

export interface ThreadedComment extends Comment {
  replies: ThreadedComment[];
  userVote?: 'upvote' | 'downvote' | null;
}

export interface CommentStats {
  totalComments: number;
  totalReplies: number;
  avgSentiment: number;
  flaggedCount: number;
}

// Add a comment to a project
export function addComment(
  projectId: string,
  userId: string,
  userName: string,
  text: string
): Comment {
  const comment: Comment = {
    id: generateId(),
    projectId,
    userId,
    userName,
    text: filterToxic(text),
    createdAt: new Date(),
    updatedAt: new Date(),
    parentCommentId: null,
    upvotes: 0,
    downvotes: 0,
    isEdited: false,
    flagged: false,
    flagCount: 0
  };

  const allComments = getAllComments();
  allComments.push(comment);
  localStorage.setItem('project-comments', JSON.stringify(allComments));

  return comment;
}

// Reply to a comment
export function replyToComment(
  parentCommentId: string,
  projectId: string,
  userId: string,
  userName: string,
  text: string
): Comment | null {
  const comment: Comment = {
    id: generateId(),
    projectId,
    userId,
    userName,
    text: filterToxic(text),
    createdAt: new Date(),
    updatedAt: new Date(),
    parentCommentId,
    upvotes: 0,
    downvotes: 0,
    isEdited: false,
    flagged: false,
    flagCount: 0
  };

  const allComments = getAllComments();
  const parentExists = allComments.some(c => c.id === parentCommentId);

  if (!parentExists) return null;

  allComments.push(comment);
  localStorage.setItem('project-comments', JSON.stringify(allComments));

  return comment;
}

// Get comments for a project (threaded)
export function getProjectComments(projectId: string): ThreadedComment[] {
  const allComments = getAllComments();
  const projectComments = allComments.filter(c => c.projectId === projectId);

  // Build threaded structure
  const commentMap: Record<string, ThreadedComment> = {};
  const rootComments: ThreadedComment[] = [];

  // Create all threaded comments
  projectComments.forEach(comment => {
    commentMap[comment.id] = {
      ...comment,
      replies: [],
      userVote: null
    };
  });

  // Build tree structure
  projectComments.forEach(comment => {
    if (comment.parentCommentId && commentMap[comment.parentCommentId]) {
      commentMap[comment.parentCommentId].replies.push(commentMap[comment.id]);
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  // Sort by votes (best first)
  const sortByVotes = (comments: ThreadedComment[]): ThreadedComment[] => {
    return comments
      .sort((a, b) => {
        const aScore = a.upvotes - a.downvotes;
        const bScore = b.upvotes - b.downvotes;
        return bScore - aScore;
      })
      .map(c => ({
        ...c,
        replies: sortByVotes(c.replies)
      }));
  };

  return sortByVotes(rootComments);
}

// Upvote a comment
export function upvoteComment(commentId: string, userId: string): boolean {
  return voteComment(commentId, userId, 'upvote');
}

// Downvote a comment
export function downvoteComment(commentId: string, userId: string): boolean {
  return voteComment(commentId, userId, 'downvote');
}

// Edit a comment
export function editComment(
  commentId: string,
  userId: string,
  newText: string
): Comment | null {
  const allComments = getAllComments();
  const comment = allComments.find(c => c.id === commentId);

  if (!comment || comment.userId !== userId) return null;

  comment.text = filterToxic(newText);
  comment.updatedAt = new Date();
  comment.isEdited = true;

  localStorage.setItem('project-comments', JSON.stringify(allComments));
  return comment;
}

// Delete a comment
export function deleteComment(commentId: string, userId: string): boolean {
  const allComments = getAllComments();
  const index = allComments.findIndex(c => c.id === commentId && c.userId === userId);

  if (index === -1) return false;

  allComments.splice(index, 1);
  localStorage.setItem('project-comments', JSON.stringify(allComments));

  return true;
}

// Flag a comment as inappropriate
export function flagComment(commentId: string, reason: string = 'inappropriate'): Comment | null {
  const allComments = getAllComments();
  const comment = allComments.find(c => c.id === commentId);

  if (!comment) return null;

  comment.flagCount += 1;

  // Auto-hide if flagged too many times
  if (comment.flagCount >= 3) {
    comment.flagged = true;
  }

  localStorage.setItem('project-comments', JSON.stringify(allComments));

  // Log the flag
  const flags = JSON.parse(localStorage.getItem('comment-flags') || '{}');
  if (!flags[commentId]) {
    flags[commentId] = [];
  }
  flags[commentId].push({
    reason,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('comment-flags', JSON.stringify(flags));

  return comment;
}

// Get comment statistics
export function getCommentStats(projectId: string): CommentStats {
  const comments = getProjectComments(projectId);

  const flatComments = flattenThreadedComments(comments);
  const flaggedCount = flatComments.filter(c => c.flagged).length;

  return {
    totalComments: flatComments.filter(c => !c.parentCommentId).length,
    totalReplies: flatComments.filter(c => c.parentCommentId).length,
    avgSentiment: calculateSentiment(flatComments),
    flaggedCount
  };
}

// Remove old/inappropriate comments (moderation)
export function moderateComments(projectId: string): number {
  const allComments = getAllComments();
  const beforeCount = allComments.length;

  // Remove heavily flagged comments
  const filtered = allComments.filter(c => c.flagCount < 5);

  // Remove comments older than 90 days with no engagement
  const ninetyDaysAgo = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000);
  const moderated = filtered.filter(c => {
    const isOld = c.createdAt < ninetyDaysAgo;
    const hasEngagement = c.upvotes > 0 || c.downvotes > 0;
    return !isOld || hasEngagement;
  });

  localStorage.setItem('project-comments', JSON.stringify(moderated));
  return beforeCount - moderated.length;
}

// Helper functions
function generateId(): string {
  return 'cmt_' + Math.random().toString(36).substr(2, 9);
}

function getAllComments(): Comment[] {
  const stored = localStorage.getItem('project-comments');
  if (!stored) return [];

  try {
    return JSON.parse(stored).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    }));
  } catch {
    return [];
  }
}

function voteComment(commentId: string, userId: string, voteType: 'upvote' | 'downvote'): boolean {
  const allComments = getAllComments();
  const comment = allComments.find(c => c.id === commentId);

  if (!comment) return false;

  const votes = JSON.parse(localStorage.getItem('comment-votes') || '{}');
  const voteKey = `${userId}-${commentId}`;

  const previousVote = votes[voteKey];

  if (previousVote === voteType) {
    // Remove vote
    if (voteType === 'upvote') {
      comment.upvotes = Math.max(0, comment.upvotes - 1);
    } else {
      comment.downvotes = Math.max(0, comment.downvotes - 1);
    }
    delete votes[voteKey];
  } else {
    // Add or change vote
    if (previousVote === 'upvote') {
      comment.upvotes = Math.max(0, comment.upvotes - 1);
    } else if (previousVote === 'downvote') {
      comment.downvotes = Math.max(0, comment.downvotes - 1);
    }

    if (voteType === 'upvote') {
      comment.upvotes += 1;
    } else {
      comment.downvotes += 1;
    }

    votes[voteKey] = voteType;
  }

  localStorage.setItem('project-comments', JSON.stringify(allComments));
  localStorage.setItem('comment-votes', JSON.stringify(votes));

  return true;
}

function filterToxic(text: string): string {
  // Simple profanity filter - in production use a proper library
  const badWords = ['badword1', 'badword2', 'spam'];
  let filtered = text;

  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '****');
  });

  return filtered;
}

function flattenThreadedComments(comments: ThreadedComment[]): ThreadedComment[] {
  let flattened: ThreadedComment[] = [];
  comments.forEach(comment => {
    flattened.push(comment);
    if (comment.replies.length > 0) {
      flattened = flattened.concat(flattenThreadedComments(comment.replies));
    }
  });
  return flattened;
}

function calculateSentiment(comments: ThreadedComment[]): number {
  if (comments.length === 0) return 0;

  let totalScore = 0;
  comments.forEach(comment => {
    const text = comment.text.toLowerCase();
    // Very basic sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'love', 'excellent', 'perfect'];
    const negativeWords = ['bad', 'hate', 'terrible', 'awful', 'poor', 'worst'];

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    totalScore += positiveCount - negativeCount;
  });

  return totalScore / comments.length;
}

// Get discussion privacy - only show public project comments
export function canViewComments(
  projectId: string,
  userId: string,
  isPublicProject: boolean
): boolean {
  return isPublicProject || projectId.startsWith(userId);
}
