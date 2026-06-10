import { getSupabase } from './supabaseAuth';
import type { PersonalizedRoadmap, RoadmapProgress, DecisionAnswers } from '../types';

interface UserCloudData {
  userId: string;
  favorites: string[];
  progress: RoadmapProgress | null;
  answers: Partial<DecisionAnswers>;
  roadmap: PersonalizedRoadmap | null;
  lastSyncedAt: string;
}

interface OfflineQueueItem {
  id: string;
  action: 'sync-favorites' | 'sync-progress' | 'sync-answers' | 'sync-roadmap';
  data: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'cs-roadmap-offline-queue';
const CLOUD_DATA_KEY = 'cs-roadmap-cloud-cache';

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    console.warn('Failed to load offline queue', e);
    return [];
  }
}

function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function addToOfflineQueue(action: OfflineQueueItem['action'], data: any): void {
  const queue = getOfflineQueue();
  queue.push({
    id: Math.random().toString(36).substr(2, 9),
    action,
    data,
    timestamp: Date.now()
  });
  saveOfflineQueue(queue);
}

export async function syncFavoritesToCloud(userId: string, favorites: string[]): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        favorites: favorites,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to sync favorites: ${error.message}`);
    }
  } catch (e) {
    console.warn('Failed to sync favorites to cloud, queueing for later', e);
    addToOfflineQueue('sync-favorites', favorites);
  }
}

export async function syncProgressToCloud(userId: string, progress: RoadmapProgress): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        progress: progress,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to sync progress: ${error.message}`);
    }
  } catch (e) {
    console.warn('Failed to sync progress to cloud, queueing for later', e);
    addToOfflineQueue('sync-progress', progress);
  }
}

export async function syncAnswersToCloud(userId: string, answers: Partial<DecisionAnswers>): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        answers: answers,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to sync answers: ${error.message}`);
    }
  } catch (e) {
    console.warn('Failed to sync answers to cloud, queueing for later', e);
    addToOfflineQueue('sync-answers', answers);
  }
}

export async function syncRoadmapToCloud(userId: string, roadmap: PersonalizedRoadmap): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        roadmap: roadmap,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to sync roadmap: ${error.message}`);
    }
  } catch (e) {
    console.warn('Failed to sync roadmap to cloud, queueing for later', e);
    addToOfflineQueue('sync-roadmap', roadmap);
  }
}

export async function fetchFromCloud(userId: string): Promise<Partial<UserCloudData> | null> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw new Error(`Failed to fetch cloud data: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      favorites: data.favorites || [],
      progress: data.progress,
      answers: data.answers,
      roadmap: data.roadmap,
      lastSyncedAt: data.last_synced_at
    };
  } catch (e) {
    console.warn('Failed to fetch from cloud', e);
    // Return cached data if available
    const cached = localStorage.getItem(CLOUD_DATA_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }
}

export function setupRealtimeSubscriptions(userId: string, onDataChange: (data: Partial<UserCloudData>) => void): () => void {
  const supabase = getSupabase();

  const subscription = supabase
    .channel(`user-data-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.new) {
          const newData = payload.new as any;
          const cloudData: Partial<UserCloudData> = {
            userId: newData.user_id,
            favorites: newData.favorites,
            progress: newData.progress,
            answers: newData.answers,
            roadmap: newData.roadmap,
            lastSyncedAt: newData.last_synced_at
          };
          onDataChange(cloudData);
          // Cache the data
          localStorage.setItem(CLOUD_DATA_KEY, JSON.stringify(cloudData));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export async function processOfflineQueue(userId: string): Promise<void> {
  const queue = getOfflineQueue();

  if (queue.length === 0) {
    return;
  }

  const supabase = getSupabase();
  const processed: string[] = [];

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'sync-favorites':
          await syncFavoritesToCloud(userId, item.data);
          processed.push(item.id);
          break;
        case 'sync-progress':
          await syncProgressToCloud(userId, item.data);
          processed.push(item.id);
          break;
        case 'sync-answers':
          await syncAnswersToCloud(userId, item.data);
          processed.push(item.id);
          break;
        case 'sync-roadmap':
          await syncRoadmapToCloud(userId, item.data);
          processed.push(item.id);
          break;
      }
    } catch (e) {
      console.warn(`Failed to process queue item ${item.id}`, e);
      // Keep in queue for retry
    }
  }

  // Remove processed items
  const remainingQueue = queue.filter(item => !processed.includes(item.id));
  saveOfflineQueue(remainingQueue);
}

// Setup online/offline listeners
export function setupSyncListeners(userId: string): () => void {
  const handleOnline = () => {
    console.log('Back online, syncing offline queue...');
    processOfflineQueue(userId).catch(e => console.error('Failed to process offline queue', e));
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
