import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../context/AuthContext';
import type { RoadmapProgress, ModuleProgress } from '../types';

export interface UseProgressReturn {
  progress: RoadmapProgress | null;
  updateProgress: (moduleId: string, updates: Partial<ModuleProgress>) => Promise<void>;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

export function useProgress(userId: string | null): UseProgressReturn {
  const [progress, setProgress] = useState<RoadmapProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load from localStorage if available
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cached = localStorage.getItem(`progress-${userId}`);
    if (cached) {
      try {
        setProgress(JSON.parse(cached));
      } catch (e) {
        console.warn('Failed to parse cached progress', e);
      }
    }
  }, [userId]);

  // Fetch from Supabase and subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    // Fetch initial progress
    const fetchProgress = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('roadmap_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data) {
          const progressData = {
            roadmapId: data.roadmap_id,
            moduleProgress: data.module_progress || [],
            overallProgress: data.overall_progress || 0,
            currentWeek: data.current_week || 1,
          };
          setProgress(progressData);
          localStorage.setItem(`progress-${userId}`, JSON.stringify(progressData));
          setLastSync(new Date());
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch progress';
        setError(message);
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`progress:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roadmap_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            const progressData = {
              roadmapId: payload.new.roadmap_id,
              moduleProgress: payload.new.module_progress || [],
              overallProgress: payload.new.overall_progress || 0,
              currentWeek: payload.new.current_week || 1,
            };
            setProgress(progressData);
            localStorage.setItem(`progress-${userId}`, JSON.stringify(progressData));
            setLastSync(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const updateProgress = useCallback(
    async (moduleId: string, updates: Partial<ModuleProgress>) => {
      if (!userId || !progress) return;

      try {
        setError(null);

        // Update locally first for optimistic UI
        const updatedModuleProgress = progress.moduleProgress.map((mp) =>
          mp.moduleId === moduleId ? { ...mp, ...updates } : mp
        );

        const overallProgress = Math.round(
          (updatedModuleProgress.filter((m) => m.status === 'done').length /
            updatedModuleProgress.length) *
            100
        );

        const updatedProgress = {
          ...progress,
          moduleProgress: updatedModuleProgress,
          overallProgress,
        };

        setProgress(updatedProgress);
        localStorage.setItem(`progress-${userId}`, JSON.stringify(updatedProgress));

        // Update in Supabase
        const { error: updateError } = await supabase
          .from('roadmap_progress')
          .update({
            module_progress: updatedModuleProgress,
            overall_progress: overallProgress,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }

        setLastSync(new Date());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update progress';
        setError(message);
        console.error('Error updating progress:', err);

        // Revert on error
        const cached = localStorage.getItem(`progress-${userId}`);
        if (cached) {
          setProgress(JSON.parse(cached));
        }
      }
    },
    [userId, progress]
  );

  return { progress, updateProgress, loading, error, lastSync };
}
