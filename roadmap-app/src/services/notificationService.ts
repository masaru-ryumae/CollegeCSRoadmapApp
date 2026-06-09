/**
 * Notification Service
 * Handles in-app, email, and push notifications
 */

export interface InAppNotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // ms, 0 = persistent
  id?: string;
}

export interface EmailNotificationPayload {
  subject: string;
  body: string;
  html?: string;
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

// In-app notification storage key
const IN_APP_NOTIFICATIONS_KEY = 'cs-roadmap-notifications';
const USER_ID_KEY = 'cs-roadmap-user-id';

/**
 * Send an in-app notification
 * Stores notification in localStorage and can be displayed by NotificationContainer
 */
export function sendInAppNotification(
  userId: string,
  payload: InAppNotificationPayload
): void {
  const notificationId = payload.id || `notif-${Date.now()}-${Math.random()}`;
  const notification = {
    id: notificationId,
    userId,
    ...payload,
    createdAt: new Date().toISOString(),
    read: false
  };

  // Get existing notifications
  const existing = getInAppNotifications();

  // Add new notification
  const updated = [notification, ...existing].slice(0, 50); // Keep last 50

  // Save to localStorage
  localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));

  // Dispatch custom event for listeners
  window.dispatchEvent(
    new CustomEvent('notification:new', {
      detail: notification
    })
  );
}

/**
 * Get all in-app notifications for a user
 */
export function getInAppNotifications(userId?: string): any[] {
  try {
    const stored = localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
    if (!stored) return [];

    const notifications = JSON.parse(stored);
    if (!userId) return notifications;

    return notifications.filter((n: any) => n.userId === userId);
  } catch {
    return [];
  }
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
  try {
    const notifications = JSON.parse(
      localStorage.getItem(IN_APP_NOTIFICATIONS_KEY) || '[]'
    );

    const updated = notifications.map((n: any) =>
      n.id === notificationId ? { ...n, read: true } : n
    );

    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

/**
 * Clear all in-app notifications
 */
export function clearInAppNotifications(userId?: string): void {
  if (!userId) {
    localStorage.removeItem(IN_APP_NOTIFICATIONS_KEY);
    return;
  }

  try {
    const notifications = JSON.parse(
      localStorage.getItem(IN_APP_NOTIFICATIONS_KEY) || '[]'
    );

    const updated = notifications.filter((n: any) => n.userId !== userId);
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

/**
 * Send an email notification
 * In a real app, this would call a backend API
 */
export async function sendEmailNotification(
  userId: string,
  payload: EmailNotificationPayload
): Promise<void> {
  try {
    // Check notification preferences first
    const prefs = getNotificationPreferences(userId);
    if (!prefs.emailEnabled) {
      console.log('Email notifications disabled for user', userId);
      return;
    }

    // In a real app, this would call your backend API
    // POST /api/notifications/email
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...payload,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Email notification failed: ${response.statusText}`);
    }

    // Log for testing
    console.log('Email sent to user', userId, ':', payload.subject);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // In production, you might want to queue this for retry
  }
}

/**
 * Send a push notification using Web Push API
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Check notification preferences
    const prefs = getNotificationPreferences(userId);
    if (!prefs.pushEnabled) {
      console.log('Push notifications disabled for user', userId);
      return;
    }

    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Send push notification via service worker
    // In a real app, this would be triggered by your backend
    if (registration.showNotification) {
      await registration.showNotification(payload.title, {
        body: payload.message,
        icon: payload.icon || '/notification-icon.png',
        badge: payload.badge || '/notification-badge.png',
        tag: payload.tag || 'notification',
        requireInteraction: false
      });
    }

    console.log('Push notification sent to user', userId);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Request permission for push notifications
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  return 'denied';
}

/**
 * Register a service worker for push notifications
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered', registration);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  preferredTime: string; // HH:MM format in user's timezone
  timezone: string;
}

const PREFERENCES_KEY = 'cs-roadmap-notification-prefs';

/**
 * Get notification preferences for a user
 */
export function getNotificationPreferences(userId: string): NotificationPreferences {
  try {
    const stored = localStorage.getItem(`${PREFERENCES_KEY}-${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Silent fail
  }

  // Return defaults
  return {
    userId,
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    frequency: 'daily',
    preferredTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Update notification preferences
 */
export function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getNotificationPreferences(userId);
  const updated = { ...current, ...preferences, userId };

  localStorage.setItem(`${PREFERENCES_KEY}-${userId}`, JSON.stringify(updated));

  // Dispatch event
  window.dispatchEvent(
    new CustomEvent('preferences:updated', {
      detail: updated
    })
  );

  return updated;
}

/**
 * Store current user ID for notification context
 */
export function setCurrentUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}
