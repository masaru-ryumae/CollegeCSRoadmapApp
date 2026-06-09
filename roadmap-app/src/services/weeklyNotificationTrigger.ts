/**
 * Weekly Notification Trigger Service
 * Checks schedule and sends appropriate notifications
 */

import {
  sendInAppNotification,
  sendEmailNotification,
  sendPushNotification,
  getCurrentUserId,
  getNotificationPreferences
} from './notificationService';
import type { PersonalizedRoadmap, ScheduledModule } from '../types';

interface NotificationCheckResult {
  triggered: boolean;
  type: 'week-start' | 'behind-schedule' | 'none';
  message: string;
}

/**
 * Get the Monday of the current week
 */
function getWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate current week number since roadmap start
 */
function getCurrentWeek(roadmapGeneratedAt: string): number {
  const now = new Date();
  const generatedDate = new Date(roadmapGeneratedAt);
  const diffTime = now.getTime() - generatedDate.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffWeeks + 1);
}

/**
 * Get the next module to start this week
 */
function getNextModuleForWeek(
  roadmap: PersonalizedRoadmap,
  currentWeek: number
): ScheduledModule | null {
  const weekModules = roadmap.modules.filter(
    m => m.startWeek === currentWeek && m.status === 'pending'
  );

  if (weekModules.length === 0) return null;

  // Return the first pending module for the week
  return weekModules[0];
}

/**
 * Check if user is behind schedule
 */
function checkIfBehindSchedule(
  roadmap: PersonalizedRoadmap,
  currentWeek: number
): { isBehind: boolean; weeksLate: number } {
  const deadline = new Date(roadmap.deadline);
  const now = new Date();

  // Calculate weeks until deadline
  const diffTime = deadline.getTime() - now.getTime();
  const weeksLeft = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));

  // Calculate weeks remaining in plan
  const lastModule = [...roadmap.modules].sort(
    (a, b) => b.endWeek - a.endWeek
  )[0];
  const weeksNeeded = lastModule.endWeek - currentWeek + 1;

  const isBehind = weeksNeeded > weeksLeft;
  const weeksLate = weeksNeeded - weeksLeft;

  return { isBehind, weeksLate };
}

/**
 * Main function to check and send weekly notifications
 * Should be called once daily at user's preferred time
 */
export async function checkAndSendWeeklyNotification(
  userId: string,
  roadmap: PersonalizedRoadmap
): Promise<NotificationCheckResult> {
  try {
    const prefs = getNotificationPreferences(userId);

    // Don't send if notifications are disabled
    if (!prefs.emailEnabled && !prefs.pushEnabled && !prefs.inAppEnabled) {
      return {
        triggered: false,
        type: 'none',
        message: 'Notifications disabled'
      };
    }

    const today = new Date();
    const weekMonday = getWeekMonday();
    const currentWeek = getCurrentWeek(roadmap.generatedAt);

    // Check if today is Monday (week start)
    const isWeekStart = isSameDay(today, weekMonday);

    // Check week start notification
    if (isWeekStart) {
      const nextModule = getNextModuleForWeek(roadmap, currentWeek);

      if (nextModule) {
        const title = `Week ${currentWeek} Starts! 🚀`;
        const message = `Your task: Start "${nextModule.name}". You have ~${nextModule.hours[roadmap.answers.techLevel]} hours to complete it.`;

        // Send notifications based on preferences
        if (prefs.inAppEnabled) {
          sendInAppNotification(userId, {
            title,
            message,
            type: 'success',
            duration: 0
          });
        }

        if (prefs.emailEnabled) {
          await sendEmailNotification(userId, {
            subject: title,
            body: message,
            html: `<h2>${title}</h2><p>${message}</p>`
          });
        }

        if (prefs.pushEnabled) {
          await sendPushNotification(userId, {
            title,
            message
          });
        }

        return {
          triggered: true,
          type: 'week-start',
          message: `Sent week ${currentWeek} start notification for module: ${nextModule.name}`
        };
      }
    }

    // Check if behind schedule (daily check)
    const { isBehind, weeksLate } = checkIfBehindSchedule(roadmap, currentWeek);

    if (isBehind) {
      // Only send once per week (on Monday) to avoid spam
      const lastBehindNotificationKey = `cs-roadmap-behind-notif-${userId}`;
      const lastSentStr = localStorage.getItem(lastBehindNotificationKey);
      const lastSent = lastSentStr ? new Date(lastSentStr) : null;

      // Check if we've already sent a behind notification this week
      const daysSinceLastNotif = lastSent
        ? Math.floor((today.getTime() - lastSent.getTime()) / (24 * 60 * 60 * 1000))
        : Infinity;

      if (daysSinceLastNotif >= 7 || !lastSent) {
        const title = `You're ${weeksLate} weeks behind schedule 📊`;
        const message = `Don't worry! We can adjust your plan. You have ${Math.max(
          0,
          getCurrentWeek(roadmap.deadline) - currentWeek
        )} weeks left. Ready to catch up?`;

        if (prefs.inAppEnabled) {
          sendInAppNotification(userId, {
            title,
            message,
            type: 'warning',
            duration: 0
          });
        }

        if (prefs.emailEnabled) {
          await sendEmailNotification(userId, {
            subject: title,
            body: message,
            html: `<h2>${title}</h2><p>${message}</p>`
          });
        }

        if (prefs.pushEnabled) {
          await sendPushNotification(userId, {
            title,
            message
          });
        }

        localStorage.setItem(lastBehindNotificationKey, new Date().toISOString());

        return {
          triggered: true,
          type: 'behind-schedule',
          message: `User is ${weeksLate} weeks behind schedule`
        };
      }
    }

    return {
      triggered: false,
      type: 'none',
      message: 'No notifications triggered'
    };
  } catch (error) {
    console.error('Error in checkAndSendWeeklyNotification:', error);
    return {
      triggered: false,
      type: 'none',
      message: `Error: ${error}`
    };
  }
}

/**
 * Schedule daily notification checks
 * Returns a function to cancel the schedule
 */
export function scheduleWeeklyNotificationCheck(
  userId: string,
  roadmap: PersonalizedRoadmap,
  preferredTime: string = '09:00' // HH:MM format
): () => void {
  // Parse preferred time
  const [hours, minutes] = preferredTime.split(':').map(Number);

  function scheduleNextCheck() {
    const now = new Date();
    const nextCheck = new Date(now);
    nextCheck.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1);
    }

    const timeUntilCheck = nextCheck.getTime() - now.getTime();

    console.log(
      `Scheduling notification check for ${nextCheck.toLocaleString()}`
    );

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkAndSendWeeklyNotification(userId, roadmap);
        console.log('Notification check result:', result);
      } catch (error) {
        console.error('Error during scheduled notification check:', error);
      }

      // Schedule the next check
      scheduleNextCheck();
    }, timeUntilCheck);

    return timeoutId;
  }

  let currentTimeoutId = scheduleNextCheck();

  // Return a function to cancel the schedule
  return () => {
    clearTimeout(currentTimeoutId);
  };
}

/**
 * Send an immediate notification for debugging/testing
 */
export async function sendTestNotification(
  userId: string,
  roadmap: PersonalizedRoadmap
): Promise<void> {
  const currentWeek = getCurrentWeek(roadmap.generatedAt);
  const nextModule = getNextModuleForWeek(roadmap, currentWeek);

  const title = 'Test Notification 🧪';
  const message = nextModule
    ? `Next module to start: ${nextModule.name}`
    : 'No upcoming modules for this week';

  sendInAppNotification(userId, {
    title,
    message,
    type: 'info',
    duration: 5000
  });

  await sendEmailNotification(userId, {
    subject: title,
    body: message
  });

  await sendPushNotification(userId, {
    title,
    message
  });
}
