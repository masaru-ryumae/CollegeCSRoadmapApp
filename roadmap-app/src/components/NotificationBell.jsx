import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationBell.css';

const typeColors = {
  milestone: '#4f46e5',
  reminder: '#f59e0b',
  achievement: '#10b981',
  deadline: '#ef4444',
};

const typeLabels = {
  milestone: 'Milestone',
  reminder: 'Reminder',
  achievement: 'Achievement',
  deadline: 'Deadline',
};

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id || null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title={`${unreadCount} unread notifications`}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <div className="header-title">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-indicator">
                  {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
                </span>
              )}
            </div>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button className="mark-all-read" onClick={markAllRead}>
              <CheckCircle2 size={16} />
              Mark all as read
            </button>
          )}

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={32} strokeWidth={1.5} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className="notification-marker"
                    style={{ backgroundColor: typeColors[notification.type] }}
                  ></div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      <span
                        className="notification-type"
                        style={{
                          backgroundColor: typeColors[notification.type],
                          color: 'white',
                        }}
                      >
                        {typeLabels[notification.type]}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <time className="notification-time">
                      {formatTime(new Date(notification.createdAt))}
                    </time>
                  </div>
                  {!notification.read && (
                    <div className="unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="/notifications" className="view-all">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
