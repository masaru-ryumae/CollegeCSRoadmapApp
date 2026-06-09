import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../context/AuthContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'milestone' | 'reminder' | 'achievement' | 'deadline';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications and subscribe to real-time updates
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const notificationsList: Notification[] = data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            title: item.title,
            message: item.message,
            type: item.type,
            read: item.read,
            createdAt: item.created_at,
            actionUrl: item.action_url,
          }));
          setNotifications(notificationsList);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(message);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            createdAt: payload.new.created_at,
            actionUrl: payload.new.action_url,
          };
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === payload.new.id
                ? {
                    ...notif,
                    read: payload.new.read,
                    title: payload.new.title,
                    message: payload.new.message,
                  }
                : notif
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const markRead = useCallback(
    async (notificationId: string) => {
      try {
        setError(null);

        // Update locally first
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );

        // Update in Supabase
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);

        if (updateError) {
          throw updateError;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark as read';
        setError(message);
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);

      // Update locally first
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      setError(message);
      console.error('Error marking all notifications as read:', err);
    }
  }, [userId]);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return { notifications, unreadCount, markRead, markAllRead, loading, error };
}
