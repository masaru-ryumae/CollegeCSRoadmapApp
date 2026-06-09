# Notification System Testing Guide

This guide explains how to test the notifications system for the CS Internship Roadmap app.

## Overview

The notifications system includes:
- **In-App Notifications**: Displayed at the top-right of the app
- **Email Notifications**: Sent to user's email address (requires backend API)
- **Push Notifications**: Browser notifications using Web Push API

## Quick Start Testing

### 1. Enable In-App Notifications (No Setup Required)

The in-app notification system works out of the box with localStorage. To test:

```javascript
// In browser console, while the app is open:
import { sendInAppNotification } from './src/services/notificationService.js';

sendInAppNotification('default-user', {
  title: 'Test Notification',
  message: 'This is a test in-app notification!',
  type: 'success',
  duration: 5000
});
```

You should see a notification appear in the top-right corner of the app.

### 2. Test Manual Notification Trigger

In the browser console:

```javascript
import { sendTestNotification } from './src/services/weeklyNotificationTrigger.js';
import { getCurrentUserId } from './src/services/notificationService.js';

// This will send test notifications for in-app, email, and push
const userId = getCurrentUserId() || 'default-user';
// Note: You'll need to pass a roadmap object
sendTestNotification(userId, roadmap);
```

## Testing Different Notification Types

### In-App Notifications

```javascript
import { sendInAppNotification } from './src/services/notificationService.js';

// Success notification (auto-hides after 3 seconds)
sendInAppNotification('default-user', {
  title: '✓ Module Completed',
  message: 'Great job! You finished Data Structures.',
  type: 'success',
  duration: 3000
});

// Warning notification (persistent)
sendInAppNotification('default-user', {
  title: '⚠️ Behind Schedule',
  message: 'You are 2 weeks behind. Would you like help?',
  type: 'warning',
  duration: 0 // 0 = persistent until dismissed
});

// Error notification
sendInAppNotification('default-user', {
  title: '❌ Error',
  message: 'Failed to save progress. Please try again.',
  type: 'error',
  duration: 0
});

// Info notification
sendInAppNotification('default-user', {
  title: 'ℹ️ New Module Available',
  message: 'System Design module is now available!',
  type: 'info',
  duration: 5000
});
```

### Push Notifications

First, you need to request permission:

```javascript
import { requestPushPermission } from './src/services/notificationService.js';

// Request browser permission
const permission = await requestPushPermission();
console.log('Push permission:', permission);
```

Then send a test push notification:

```javascript
import { sendPushNotification } from './src/services/notificationService.js';

await sendPushNotification('default-user', {
  title: 'Week 1 Starts!',
  message: 'Begin with Algorithm Basics. Good luck!'
});
```

### Email Notifications

```javascript
import { sendEmailNotification } from './src/services/notificationService.js';

await sendEmailNotification('default-user', {
  subject: 'Week 1 of Your CS Roadmap Starts Today',
  body: 'Hi! This week you should focus on Algorithm Basics. Set aside 5-10 hours to get through the key points.',
  html: '<h2>Week 1 Starts!</h2><p>Focus on Algorithm Basics...</p>'
});
```

**Note**: Email notifications require a backend API endpoint at `/api/notifications/email`

## Testing the Weekly Notification Schedule

### Check Current Settings

```javascript
import { getNotificationPreferences, getCurrentUserId } from './src/services/notificationService.js';

const userId = getCurrentUserId() || 'default-user';
const prefs = getNotificationPreferences(userId);
console.log('Notification preferences:', prefs);
```

### Update Preferences

```javascript
import { updateNotificationPreferences } from './src/services/notificationService.js';

updateNotificationPreferences('default-user', {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  frequency: 'daily',
  preferredTime: '09:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});
```

### Test Scheduled Checks

```javascript
import { scheduleWeeklyNotificationCheck } from './src/services/weeklyNotificationTrigger.js';

// Schedule notifications for 9:00 AM daily
const cancel = scheduleWeeklyNotificationCheck('default-user', roadmap, '09:00');

// To cancel the schedule later:
// cancel();
```

## Testing Week Start Detection

The system automatically sends notifications when:
1. **It's Monday** (start of the week)
2. **The user has a pending module for that week**

To test this:

```javascript
import { checkAndSendWeeklyNotification } from './src/services/weeklyNotificationTrigger.js';

const result = await checkAndSendWeeklyNotification('default-user', roadmap);
console.log('Notification result:', result);

// Expected output if today is Monday:
// {
//   triggered: true,
//   type: 'week-start',
//   message: '...'
// }
```

## Testing Behind Schedule Detection

```javascript
import { checkAndSendWeeklyNotification } from './src/services/weeklyNotificationTrigger.js';

const result = await checkAndSendWeeklyNotification('default-user', roadmap);

// If user is behind schedule:
// {
//   triggered: true,
//   type: 'behind-schedule',
//   message: 'User is X weeks behind schedule'
// }
```

## Testing Notification Preferences Page

The NotificationPreferences component provides a settings UI:

1. Add this route to your app:
```typescript
<Route path="/settings/notifications" element={<NotificationPreferences />} />
```

2. Visit `/settings/notifications` in your app
3. Test toggling each notification type
4. Change the frequency and preferred time
5. Click "Save Preferences" and verify the success message

## Testing LocalStorage

All notifications and preferences are stored in localStorage:

```javascript
// View all notifications
const notifications = localStorage.getItem('cs-roadmap-notifications');
console.log(JSON.parse(notifications));

// View preferences
const prefs = localStorage.getItem('cs-roadmap-notification-prefs-default-user');
console.log(JSON.parse(prefs));

// Clear all
localStorage.removeItem('cs-roadmap-notifications');
localStorage.removeItem('cs-roadmap-notification-prefs-default-user');
```

## Testing with Different Timezones

```javascript
import { updateNotificationPreferences } from './src/services/notificationService.js';

updateNotificationPreferences('default-user', {
  timezone: 'America/Los_Angeles',
  preferredTime: '06:00'
});

updateNotificationPreferences('default-user', {
  timezone: 'Europe/London',
  preferredTime: '08:00'
});
```

## Backend Integration Checklist

When integrating with your backend, ensure:

- [ ] Email notification endpoint: `POST /api/notifications/email`
  - Accepts `userId`, `subject`, `body`, `html`
  - Returns success/error status

- [ ] Push notification service setup
  - Generate VAPID keys
  - Configure Web Push API credentials
  - Update service worker with endpoint

- [ ] User preferences API
  - `GET /api/users/{id}/notification-preferences`
  - `PUT /api/users/{id}/notification-preferences`

- [ ] Notification history API (optional)
  - `GET /api/notifications?userId=...`
  - `POST /api/notifications/{id}/read`

## Troubleshooting

### Notifications not appearing?
1. Check browser console for errors
2. Verify notifications are enabled in preferences
3. Check localStorage for corrupted data
4. Try clearing localStorage and resetting

### Email not sending?
1. Check if `/api/notifications/email` endpoint exists
2. Verify backend is running
3. Check console for network errors
4. Verify user email in preferences

### Push notifications not working?
1. Check if browser supports Web Push API
2. Request notification permission first
3. Check if service worker is registered
4. Verify VAPID keys are configured

### Scheduled notifications not triggering?
1. Keep the browser tab open (some browsers pause timers)
2. Check preferred time format (should be HH:MM)
3. Verify timezone matches user's local time
4. Check browser console for scheduled timer logs

## Performance Testing

Monitor notification performance:

```javascript
// Measure notification creation time
console.time('notification');
sendInAppNotification('user', { title: 'Test', message: 'Test', type: 'info' });
console.timeEnd('notification');

// Measure notification retrieval
console.time('retrieval');
getInAppNotifications('user');
console.timeEnd('retrieval');

// Check localStorage size
const size = new Blob([JSON.stringify(localStorage)]).size / 1024;
console.log('LocalStorage size:', size + ' KB');
```

## API Testing

To test email notifications, you'll need to mock the backend:

```javascript
// Mock the fetch API for email notifications
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    statusText: 'OK'
  })
);

// Then test:
await sendEmailNotification('user', {
  subject: 'Test',
  body: 'Test body'
});

// Verify fetch was called:
expect(fetch).toHaveBeenCalledWith(
  '/api/notifications/email',
  expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
);
```

## Demo Flow

Here's a complete demo sequence:

1. Open the app and generate a roadmap
2. Go to Settings → Notifications
3. Enable all notification types
4. Set preferred time to 5 minutes from now
5. Click Save
6. Open browser console and run:
```javascript
import { sendInAppNotification } from './src/services/notificationService.js';
sendInAppNotification('default-user', {
  title: 'Welcome!',
  message: 'The notification system is working!',
  type: 'success',
  duration: 5000
});
```
7. See the notification appear in top-right
8. Test the backend integration when ready

---

For more details, see the service files:
- `src/services/notificationService.ts` - Core notification logic
- `src/services/weeklyNotificationTrigger.ts` - Scheduling logic
- `src/components/NotificationPreferences.tsx` - Settings UI
- `src/components/NotificationContainer.tsx` - Display UI
