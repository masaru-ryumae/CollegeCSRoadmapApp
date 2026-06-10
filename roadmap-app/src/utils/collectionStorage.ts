// Collection storage utilities for managing project collections

export interface ProjectCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  shareLink?: string;
}

const STORAGE_KEY = 'cs-roadmap-collections';
const SHARED_COLLECTIONS_KEY = 'cs-roadmap-shared-collections';

// Helper to generate unique IDs
const generateId = (): string => {
  return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to generate share links
const generateShareLink = (): string => {
  return `https://share.cs-roadmap.app/${generateId()}`;
};

// Get all collections for a user
export function getUserCollections(userId: string): ProjectCollection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const collections = JSON.parse(stored) as ProjectCollection[];
    return collections.filter(col => col.userId === userId);
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
}

// Create a new collection
export function createCollection(
  userId: string,
  name: string,
  description: string = ''
): ProjectCollection {
  const collection: ProjectCollection = {
    id: generateId(),
    userId,
    name,
    description,
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: false
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const collections: ProjectCollection[] = stored ? JSON.parse(stored) : [];

  collections.push(collection);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));

  return collection;
}

// Add project to collection
export function addProjectToCollection(
  collectionId: string,
  projectId: string
): ProjectCollection | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const collections: ProjectCollection[] = JSON.parse(stored);
  const collection = collections.find(col => col.id === collectionId);

  if (!collection) return null;
  if (collection.projectIds.includes(projectId)) return collection; // Already added

  collection.projectIds.push(projectId);
  collection.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  return collection;
}

// Remove project from collection
export function removeProjectFromCollection(
  collectionId: string,
  projectId: string
): ProjectCollection | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const collections: ProjectCollection[] = JSON.parse(stored);
  const collection = collections.find(col => col.id === collectionId);

  if (!collection) return null;

  collection.projectIds = collection.projectIds.filter(id => id !== projectId);
  collection.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  return collection;
}

// Reorder projects within collection
export function reorderProjectsInCollection(
  collectionId: string,
  projectIds: string[]
): ProjectCollection | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const collections: ProjectCollection[] = JSON.parse(stored);
  const collection = collections.find(col => col.id === collectionId);

  if (!collection) return null;

  collection.projectIds = projectIds;
  collection.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  return collection;
}

// Get a specific collection
export function getCollection(collectionId: string): ProjectCollection | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const collections: ProjectCollection[] = JSON.parse(stored);
  return collections.find(col => col.id === collectionId) || null;
}

// Update collection metadata
export function updateCollection(
  collectionId: string,
  updates: Partial<Omit<ProjectCollection, 'id' | 'userId' | 'createdAt'>>
): ProjectCollection | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const collections: ProjectCollection[] = JSON.parse(stored);
  const collection = collections.find(col => col.id === collectionId);

  if (!collection) return null;

  Object.assign(collection, updates, {
    updatedAt: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  return collection;
}

// Delete a collection
export function deleteCollection(collectionId: string): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  const collections: ProjectCollection[] = JSON.parse(stored);
  const filtered = collections.filter(col => col.id !== collectionId);

  if (filtered.length === collections.length) return false; // Not found

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Share collection (generate link)
export function shareCollection(collectionId: string): string | null {
  const collection = getCollection(collectionId);
  if (!collection) return null;

  const shareLink = generateShareLink();
  const updated = updateCollection(collectionId, {
    isShared: true,
    shareLink
  });

  if (updated) {
    // Store shared collection for public access
    const shared = localStorage.getItem(SHARED_COLLECTIONS_KEY);
    const sharedCollections = shared ? JSON.parse(shared) : {};
    sharedCollections[shareLink] = updated;
    localStorage.setItem(SHARED_COLLECTIONS_KEY, JSON.stringify(sharedCollections));

    return shareLink;
  }

  return null;
}

// Get shared collection by link
export function getSharedCollection(shareLink: string): ProjectCollection | null {
  try {
    const shared = localStorage.getItem(SHARED_COLLECTIONS_KEY);
    if (!shared) return null;

    const sharedCollections = JSON.parse(shared);
    return sharedCollections[shareLink] || null;
  } catch (error) {
    console.error('Error loading shared collection:', error);
    return null;
  }
}

// Create pre-made collections
export function createPreMadeCollections(userId: string): void {
  const existing = getUserCollections(userId);
  if (existing.some(col => col.name === 'Beginner Roadmap')) return; // Already exists

  // Pre-made collection 1: Beginner Roadmap
  const beginnerCollection = createCollection(
    userId,
    'Beginner Roadmap',
    'Recommended projects for beginners to start their CS journey'
  );

  // Pre-made collection 2: Budget Projects
  const budgetCollection = createCollection(
    userId,
    'Budget Projects',
    'High-quality projects you can build with limited resources'
  );

  // Pre-made collection 3: Quick Wins
  const quickWinsCollection = createCollection(
    userId,
    'Quick Wins',
    'Projects you can complete in a weekend or less'
  );
}
