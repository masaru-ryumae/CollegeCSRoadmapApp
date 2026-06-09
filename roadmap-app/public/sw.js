/**
 * Service Worker for Push Notifications
 * Handles push notification events and background sync
 */

const CACHE_NAME = 'cs-roadmap-v1';

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'CS Internship Roadmap',
    options: {
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      requireInteraction: false
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || notificationData.title;
      notificationData.options = {
        ...notificationData.options,
        body: data.message || data.body,
        ...data.options
      };
    } catch (e) {
      notificationData.options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already a window open
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications function
async function syncNotifications() {
  try {
    // In a real app, this would call your backend API
    // to sync any pending notifications
    console.log('Syncing notifications...');
  } catch (error) {
    console.error('Error syncing notifications:', error);
    throw error;
  }
}

// Message event for client communication
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
