import { supabase } from '../config/supabaseClient';

/**
 * Subscribe to real-time progress updates for a user
 * @param {string} userId - The user's ID
 * @param {Function} callback - Callback function to handle progress updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToProgress(userId, callback) {
  if (!userId) {
    console.warn('subscribeToProgress: userId is required');
    return () => {};
  }

  const subscription = supabase
    .from(`progress:user_id=eq.${userId}`)
    .on('*', (payload) => {
      callback(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to progress updates for user ${userId}`);
      } else if (status === 'CLOSED') {
        console.log(`Unsubscribed from progress updates for user ${userId}`);
      }
    });

  return () => {
    supabase.removeSubscription(subscription);
  };
}

/**
 * Update user progress for a module
 * @param {string} userId - The user's ID
 * @param {string} moduleId - The module ID
 * @param {Object} progressData - Progress data to update
 * @returns {Promise<{data, error}>} Updated progress record
 */
export async function updateProgress(userId, moduleId, progressData) {
  try {
    if (!userId || !moduleId) {
      throw new Error('userId and moduleId are required');
    }

    const { data, error } = await supabase
      .from('progress')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          ...progressData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Update progress error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error updating progress:', err);
    return { data: null, error: err };
  }
}

/**
 * Get progress history for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{data, error}>} Array of progress records
 */
export async function getProgressHistory(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get progress history error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error getting progress history:', err);
    return { data: null, error: err };
  }
}

/**
 * Subscribe to real-time notifications for a user
 * @param {string} userId - The user's ID
 * @param {Function} callback - Callback function to handle notifications
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(userId, callback) {
  if (!userId) {
    console.warn('subscribeToNotifications: userId is required');
    return () => {};
  }

  const subscription = supabase
    .from(`notifications:user_id=eq.${userId}`)
    .on('INSERT', (payload) => {
      callback(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to notifications for user ${userId}`);
      } else if (status === 'CLOSED') {
        console.log(`Unsubscribed from notifications for user ${userId}`);
      }
    });

  return () => {
    supabase.removeSubscription(subscription);
  };
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{data, error}>} Updated notification record
 */
export async function markNotificationRead(notificationId) {
  try {
    if (!notificationId) {
      throw new Error('notificationId is required');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Mark notification read error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error marking notification as read:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId - The user's ID
 * @param {boolean} unreadOnly - If true, only return unread notifications
 * @returns {Promise<{data, error}>} Array of notification records
 */
export async function getNotifications(userId, unreadOnly = false) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get notifications error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error getting notifications:', err);
    return { data: null, error: err };
  }
}
