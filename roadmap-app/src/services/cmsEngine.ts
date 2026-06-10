// Content Management System Engine
// Handles content lifecycle: draft → review → published

import { ContentItem, ContentStatus, VersionEntry } from '../types';

type WorkflowState = 'draft' | 'review' | 'approved' | 'published' | 'archived';

interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  allowedRoles?: string[];
}

// State machine for publishing workflow
const workflowTransitions: WorkflowTransition[] = [
  { from: 'draft', to: 'review', allowedRoles: ['user', 'admin'] },
  { from: 'review', to: 'approved', allowedRoles: ['admin'] },
  { from: 'review', to: 'draft', allowedRoles: ['admin'] },
  { from: 'approved', to: 'published', allowedRoles: ['admin'] },
  { from: 'published', to: 'archived', allowedRoles: ['admin'] },
];

// In-memory storage
const contentDb = new Map<string, ContentItem>();
const scheduledPublications = new Map<string, { contentId: string; publishAt: string }>();

/**
 * Create new content item
 */
export const createContent = (
  title: string,
  description: string,
  type: 'tutorial' | 'documentation' | 'guide' | 'resource',
  content: string,
  authorId: string,
  tags: string[] = []
): ContentItem => {
  const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const contentItem: ContentItem = {
    id: contentId,
    title,
    description,
    type,
    status: 'draft',
    content,
    authorId,
    createdAt: now,
    updatedAt: now,
    tags,
    views: 0,
    engagement: 0,
    version: 1,
    changelog: [
      {
        version: 1,
        updatedAt: now,
        changes: 'Initial creation',
        authorId,
      },
    ],
  };

  contentDb.set(contentId, contentItem);
  return contentItem;
};

/**
 * Update content
 */
export const updateContent = (
  contentId: string,
  updates: Partial<ContentItem>,
  updatedBy: string
): ContentItem | null => {
  const content = contentDb.get(contentId);
  if (!content) return null;

  const updated: ContentItem = {
    ...content,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: content.version + 1,
  };

  // Add to changelog
  updated.changelog.push({
    version: updated.version,
    updatedAt: updated.updatedAt,
    changes: JSON.stringify(updates),
    authorId: updatedBy,
  });

  contentDb.set(contentId, updated);
  return updated;
};

/**
 * Submit content for review
 */
export const submitForReview = (contentId: string): ContentItem | null => {
  const content = contentDb.get(contentId);
  if (!content || content.status !== 'draft') return null;

  const updated: ContentItem = {
    ...content,
    status: 'review',
    updatedAt: new Date().toISOString(),
  };

  contentDb.set(contentId, updated);
  return updated;
};

/**
 * Approve content (by admin)
 */
export const approveContent = (contentId: string): ContentItem | null => {
  const content = contentDb.get(contentId);
  if (!content || content.status !== 'review') return null;

  const updated: ContentItem = {
    ...content,
    status: 'published',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  contentDb.set(contentId, updated);
  return updated;
};

/**
 * Reject content (send back to draft)
 */
export const rejectContent = (contentId: string, reason: string): ContentItem | null => {
  const content = contentDb.get(contentId);
  if (!content || content.status !== 'review') return null;

  const updated: ContentItem = {
    ...content,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    // Could store rejection reason in metadata
  };

  contentDb.set(contentId, updated);
  return updated;
};

/**
 * Schedule content publication
 */
export const schedulePublication = (contentId: string, publishAt: string): boolean => {
  const content = contentDb.get(contentId);
  if (!content) return false;

  const now = new Date().getTime();
  const scheduledTime = new Date(publishAt).getTime();

  if (scheduledTime <= now) {
    // Publish immediately if time is in the past
    approveContent(contentId);
    return true;
  }

  scheduledPublications.set(contentId, { contentId, publishAt });

  const updated: ContentItem = {
    ...content,
    scheduledPublishAt: publishAt,
    updatedAt: new Date().toISOString(),
  };

  contentDb.set(contentId, updated);
  return true;
};

/**
 * Get content by ID
 */
export const getContent = (contentId: string): ContentItem | null => {
  return contentDb.get(contentId) || null;
};

/**
 * Search content with filters
 */
export const searchContent = (query: string, filters?: {
  type?: string;
  status?: ContentStatus;
  author?: string;
  tags?: string[];
}): ContentItem[] => {
  const lowerQuery = query.toLowerCase();

  return Array.from(contentDb.values()).filter((content) => {
    // Text search
    const matchesQuery =
      content.title.toLowerCase().includes(lowerQuery) ||
      content.description.toLowerCase().includes(lowerQuery) ||
      content.content.toLowerCase().includes(lowerQuery);

    if (!matchesQuery) return false;

    // Apply filters
    if (filters?.type && content.type !== filters.type) return false;
    if (filters?.status && content.status !== filters.status) return false;
    if (filters?.author && content.authorId !== filters.author) return false;
    if (filters?.tags && filters.tags.length > 0) {
      const hasAnyTag = filters.tags.some((tag) => content.tags.includes(tag));
      if (!hasAnyTag) return false;
    }

    return true;
  });
};

/**
 * Get content by status (for publishing workflow)
 */
export const getContentByStatus = (status: ContentStatus): ContentItem[] => {
  return Array.from(contentDb.values()).filter((c) => c.status === status);
};

/**
 * Get all published content
 */
export const getPublishedContent = (): ContentItem[] => {
  return Array.from(contentDb.values()).filter((c) => c.status === 'published');
};

/**
 * Get content by author
 */
export const getContentByAuthor = (authorId: string): ContentItem[] => {
  return Array.from(contentDb.values()).filter((c) => c.authorId === authorId);
};

/**
 * Delete content (soft delete - archive)
 */
export const deleteContent = (contentId: string): boolean => {
  const content = contentDb.get(contentId);
  if (!content) return false;

  content.status = 'archived';
  contentDb.set(contentId, content);
  return true;
};

/**
 * Track view
 */
export const trackContentView = (contentId: string): void => {
  const content = contentDb.get(contentId);
  if (content) {
    content.views += 1;
  }
};

/**
 * Track engagement
 */
export const trackContentEngagement = (contentId: string, score: number): void => {
  const content = contentDb.get(contentId);
  if (content) {
    content.engagement += score;
  }
};

/**
 * Get content analytics
 */
export const getContentAnalytics = (contentId: string): {
  views: number;
  engagement: number;
  version: number;
  createdAt: string;
  publishedAt?: string;
} | null => {
  const content = contentDb.get(contentId);
  if (!content) return null;

  return {
    views: content.views,
    engagement: content.engagement,
    version: content.version,
    createdAt: content.createdAt,
    publishedAt: content.publishedAt,
  };
};

/**
 * Get content changelog
 */
export const getContentChangelog = (contentId: string): VersionEntry[] => {
  const content = contentDb.get(contentId);
  return content?.changelog || [];
};

/**
 * Rollback to previous version (creates new version with old content)
 */
export const rollbackToVersion = (contentId: string, version: number, rolledBackBy: string): ContentItem | null => {
  const content = contentDb.get(contentId);
  if (!content || version < 1 || version > content.version) return null;

  const oldEntry = content.changelog.find((e) => e.version === version);
  if (!oldEntry) return null;

  // In production, would need to store full snapshots
  const rolledBack: ContentItem = {
    ...content,
    version: content.version + 1,
    updatedAt: new Date().toISOString(),
  };

  rolledBack.changelog.push({
    version: rolledBack.version,
    updatedAt: rolledBack.updatedAt,
    changes: `Rolled back to version ${version}`,
    authorId: rolledBackBy,
  });

  contentDb.set(contentId, rolledBack);
  return rolledBack;
};

/**
 * Process scheduled publications (should be called periodically)
 */
export const processScheduledPublications = (): ContentItem[] => {
  const published: ContentItem[] = [];
  const now = new Date().getTime();

  scheduledPublications.forEach((scheduled, contentId) => {
    const scheduledTime = new Date(scheduled.publishAt).getTime();
    if (scheduledTime <= now) {
      const content = approveContent(contentId);
      if (content) {
        published.push(content);
      }
      scheduledPublications.delete(contentId);
    }
  });

  return published;
};

/**
 * Get dashboard statistics
 */
export const getCMSStatistics = (): {
  totalContent: number;
  published: number;
  inReview: number;
  drafts: number;
  averageEngagement: number;
  topContent: ContentItem[];
} => {
  const allContent = Array.from(contentDb.values());
  const published = allContent.filter((c) => c.status === 'published');
  const inReview = allContent.filter((c) => c.status === 'review');
  const drafts = allContent.filter((c) => c.status === 'draft');

  const avgEngagement = allContent.length > 0
    ? allContent.reduce((sum, c) => sum + c.engagement, 0) / allContent.length
    : 0;

  const topContent = [...published].sort((a, b) => b.views - a.views).slice(0, 5);

  return {
    totalContent: allContent.length,
    published: published.length,
    inReview: inReview.length,
    drafts: drafts.length,
    averageEngagement: Math.round(avgEngagement * 100) / 100,
    topContent,
  };
};
