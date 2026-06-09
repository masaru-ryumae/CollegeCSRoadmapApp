import { useEffect, useRef } from 'react';
import type { PersonalizedRoadmap } from '../types';
import {
  scheduleWeeklyNotificationCheck,
  checkAndSendWeeklyNotification
} from '../services/weeklyNotificationTrigger';
import {
  getCurrentUserId,
  getNotificationPreferences,
  registerServiceWorker
} from '../services/notificationService';

/**
 * Hook to schedule notification checks when the app loads
 * Automatically sets up the daily notification schedule
 */
export function useScheduleNotifications(roadmap: PersonalizedRoadmap | null) {
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!roadmap) return;

    const userId = getCurrentUserId() || 'default-user';
    const prefs = getNotificationPreferences(userId);

    // Only schedule if notifications are enabled
    if (!prefs.emailEnabled && !prefs.pushEnabled && !prefs.inAppEnabled) {
      console.log('Notifications disabled, skipping schedule');
      return;
    }

    // Register service worker for push notifications
    registerServiceWorker().catch(err =>
      console.log('Service Worker registration skipped:', err.message)
    );

    // Schedule notification checks
    const cancel = scheduleWeeklyNotificationCheck(
      userId,
      roadmap,
      prefs.preferredTime
    );

    cancelRef.current = cancel;

    // Perform an immediate check (if it's the preferred time, it will send)
    checkAndSendWeeklyNotification(userId, roadmap).catch(err =>
      console.error('Error in immediate notification check:', err)
    );

    return () => {
      // Clean up on unmount
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [roadmap]);

  return {
    cancelNotificationSchedule: () => {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
    }
  };
}
