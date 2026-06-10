import type { PersonalizedRoadmap } from '../types';

interface ShareLinkData {
  id: string;
  collectionId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date | null;
  viewCount: number;
  isPublic: boolean;
  allowEdit: boolean;
}

interface ShareMetrics {
  linkId: string;
  views: number;
  clicks: number;
  lastAccessed: Date;
  accessHistory: Array<{ timestamp: Date; action: string }>;
}

interface SharedCollectionData {
  roadmap: PersonalizedRoadmap;
  metadata: {
    sharedBy: string;
    sharedAt: Date;
    collectionName: string;
  };
}

// Generate a short shareable link token
export function generateShareLink(
  collectionId: string,
  options: {
    isPublic?: boolean;
    allowEdit?: boolean;
    expirationHours?: number;
  } = {}
): ShareLinkData {
  const token = generateToken(8);
  const now = new Date();
  const expiresAt = options.expirationHours
    ? new Date(now.getTime() + options.expirationHours * 60 * 60 * 1000)
    : null;

  const shareLink: ShareLinkData = {
    id: generateToken(12),
    collectionId,
    token,
    createdAt: now,
    expiresAt,
    viewCount: 0,
    isPublic: options.isPublic ?? true,
    allowEdit: options.allowEdit ?? false
  };

  // Store in localStorage (in real app, this would be a backend)
  const allLinks = getAllShareLinks();
  allLinks.push(shareLink);
  localStorage.setItem('share-links', JSON.stringify(allLinks));

  return shareLink;
}

// Get the shareable URL
export function getShareLinkUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${token}`;
}

// Verify and load a shared collection
export function verifyShareLink(token: string): ShareLinkData | null {
  const allLinks = getAllShareLinks();
  const link = allLinks.find(l => l.token === token);

  if (!link) return null;

  // Check if expired
  if (link.expiresAt && new Date() > link.expiresAt) {
    return null;
  }

  return link;
}

// Track share metrics
export function trackShareMetrics(
  linkId: string,
  action: 'view' | 'click' = 'view'
): ShareMetrics | null {
  const allLinks = getAllShareLinks();
  const linkIndex = allLinks.findIndex(l => l.id === linkId);

  if (linkIndex === -1) return null;

  const link = allLinks[linkIndex];
  const now = new Date();

  if (action === 'view') {
    link.viewCount += 1;
  }

  // Get or create metrics
  const metricsMap = getMetricsMap();
  if (!metricsMap[linkId]) {
    metricsMap[linkId] = {
      linkId,
      views: 0,
      clicks: 0,
      lastAccessed: now,
      accessHistory: []
    };
  }

  const metrics = metricsMap[linkId];
  if (action === 'view') {
    metrics.views += 1;
  } else {
    metrics.clicks += 1;
  }
  metrics.lastAccessed = now;
  metrics.accessHistory.push({ timestamp: now, action });

  localStorage.setItem('share-metrics', JSON.stringify(metricsMap));
  localStorage.setItem('share-links', JSON.stringify(allLinks));

  return metrics;
}

// Get metrics for a share link
export function getShareMetrics(linkId: string): ShareMetrics | null {
  const metricsMap = getMetricsMap();
  return metricsMap[linkId] || null;
}

// Get shared collection data
export function getSharedCollectionData(linkToken: string): SharedCollectionData | null {
  const link = verifyShareLink(linkToken);
  if (!link) return null;

  // Track the view
  trackShareMetrics(link.id, 'view');

  // In a real app, this would fetch from backend
  // For now, we'll check localStorage for the actual roadmap data
  const collectionsMap = JSON.parse(localStorage.getItem('shared-collections') || '{}');
  const data = collectionsMap[link.collectionId];

  if (!data) return null;

  return {
    roadmap: data.roadmap,
    metadata: {
      sharedBy: data.sharedBy || 'Anonymous',
      sharedAt: new Date(data.sharedAt),
      collectionName: data.collectionName || 'Shared Collection'
    }
  };
}

// Store a collection for sharing
export function storeSharedCollection(
  collectionId: string,
  roadmap: PersonalizedRoadmap,
  metadata: {
    sharedBy: string;
    collectionName: string;
  }
): void {
  const collectionsMap = JSON.parse(localStorage.getItem('shared-collections') || '{}');
  collectionsMap[collectionId] = {
    roadmap,
    sharedBy: metadata.sharedBy,
    collectionName: metadata.collectionName,
    sharedAt: new Date().toISOString()
  };
  localStorage.setItem('shared-collections', JSON.stringify(collectionsMap));
}

// Helper functions
function generateToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getAllShareLinks(): ShareLinkData[] {
  const stored = localStorage.getItem('share-links');
  if (!stored) return [];
  try {
    return JSON.parse(stored).map((link: any) => ({
      ...link,
      createdAt: new Date(link.createdAt),
      expiresAt: link.expiresAt ? new Date(link.expiresAt) : null
    }));
  } catch {
    return [];
  }
}

function getMetricsMap(): Record<string, ShareMetrics> {
  const stored = localStorage.getItem('share-metrics');
  if (!stored) return {};
  try {
    const map = JSON.parse(stored);
    Object.keys(map).forEach(key => {
      map[key].lastAccessed = new Date(map[key].lastAccessed);
      map[key].accessHistory = map[key].accessHistory.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    });
    return map;
  } catch {
    return {};
  }
}

// Get all links for a collection (for management)
export function getCollectionShareLinks(collectionId: string): ShareLinkData[] {
  return getAllShareLinks().filter(link => link.collectionId === collectionId);
}

// Revoke a share link
export function revokeShareLink(linkId: string): boolean {
  const allLinks = getAllShareLinks();
  const index = allLinks.findIndex(l => l.id === linkId);

  if (index === -1) return false;

  allLinks.splice(index, 1);
  localStorage.setItem('share-links', JSON.stringify(allLinks));

  return true;
}

// Update share link settings
export function updateShareLink(
  linkId: string,
  updates: Partial<{ isPublic: boolean; allowEdit: boolean }>
): ShareLinkData | null {
  const allLinks = getAllShareLinks();
  const link = allLinks.find(l => l.id === linkId);

  if (!link) return null;

  Object.assign(link, updates);
  localStorage.setItem('share-links', JSON.stringify(allLinks));

  return link;
}
