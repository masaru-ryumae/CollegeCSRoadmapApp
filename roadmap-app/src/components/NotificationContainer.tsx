import React, { useState, useEffect, useCallback } from 'react';
import {
  getInAppNotifications,
  markNotificationAsRead,
  getCurrentUserId
} from '../services/notificationService';
import './NotificationContainer.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  read: boolean;
  createdAt: string;
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<
    Notification[]
  >([]);
  const userId = getCurrentUserId() || 'default-user';

  // Load notifications on mount and listen for new ones
  useEffect(() => {
    // Initial load
    const stored = getInAppNotifications(userId);
    setNotifications(stored);
    setVisibleNotifications(stored.slice(0, 3)); // Show top 3

    // Listen for new notifications
    const handleNewNotification = (event: any) => {
      if (event.detail.userId === userId) {
        setNotifications(prev => [event.detail, ...prev].slice(0, 50));
        setVisibleNotifications(prev => [event.detail, ...prev].slice(0, 3));
      }
    };

    window.addEventListener('notification:new', handleNewNotification);
    return () => {
      window.removeEventListener('notification:new', handleNewNotification);
    };
  }, [userId]);

  const handleDismiss = useCallback((id: string) => {
    markNotificationAsRead(id);
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleShowMore = useCallback(() => {
    // Show all unread notifications
    const unread = notifications.filter(n => !n.read);
    setVisibleNotifications(unread);
  }, [notifications]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {visibleNotifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}

      {notifications.filter(n => !n.read).length > 3 && (
        <div className="notification-more">
          <button onClick={handleShowMore} className="btn-show-more">
            Show {notifications.filter(n => !n.read).length - 3} more
          </button>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onDismiss(notification.id);
        }, 300); // Match animation duration
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  const handleDismissClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`notification-item notification-${notification.type} ${
        isExiting ? 'exiting' : ''
      }`}
    >
      <div className="notification-icon">{getIcon(notification.type)}</div>

      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
      </div>

      <button
        onClick={handleDismissClick}
        className="notification-close"
        aria-label="Dismiss notification"
      >
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
