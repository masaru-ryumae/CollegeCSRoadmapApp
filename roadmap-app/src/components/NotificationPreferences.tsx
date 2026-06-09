import React, { useState, useEffect } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getCurrentUserId,
  requestPushPermission
} from '../services/notificationService';
import type { NotificationPreferences } from '../services/notificationService';
import './NotificationPreferences.css';

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    'denied'
  );
  const [loading, setLoading] = useState(true);

  const userId = getCurrentUserId() || 'default-user';

  useEffect(() => {
    // Load user preferences
    const prefs = getNotificationPreferences(userId);
    setPreferences(prefs);

    // Check push permission status
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    setLoading(false);
  }, [userId]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    setSaved(false);
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly') => {
    if (!preferences) return;

    const updated = { ...preferences, frequency };
    setPreferences(updated);
    setSaved(false);
  };

  const handleTimeChange = (time: string) => {
    if (!preferences) return;

    const updated = { ...preferences, preferredTime: time };
    setPreferences(updated);
    setSaved(false);
  };

  const handleSave = () => {
    if (!preferences) return;

    updateNotificationPreferences(userId, preferences);
    setSaved(true);

    // Reset saved indicator after 2 seconds
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRequestPushPermission = async () => {
    const permission = await requestPushPermission();
    setPushPermission(permission);

    if (permission === 'granted') {
      handleToggle('pushEnabled', true);
    }
  };

  const handleUnsubscribe = () => {
    if (!confirm('Unsubscribe from all notifications? You can re-enable them anytime.')) {
      return;
    }

    if (preferences) {
      const updated = {
        ...preferences,
        emailEnabled: false,
        pushEnabled: false,
        inAppEnabled: false
      };
      setPreferences(updated);
      updateNotificationPreferences(userId, updated);
      setSaved(true);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="notification-preferences">
        <div className="loading">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-container">
        <div className="preferences-header">
          <h2>Notification Settings</h2>
          <p className="preferences-subtitle">
            Manage how and when you receive updates about your roadmap progress
          </p>
        </div>

        {/* Notification Types */}
        <section className="preferences-section">
          <h3 className="section-title">Notification Types</h3>

          <div className="preference-item">
            <div className="preference-control">
              <label className="preference-label">
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled}
                  onChange={(e) =>
                    handleToggle('inAppEnabled', e.target.checked)
                  }
                  className="preference-checkbox"
                />
                <span className="preference-name">In-App Notifications</span>
              </label>
              <p className="preference-description">
                See updates while using the app
              </p>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-control">
              <label className="preference-label">
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) =>
                    handleToggle('emailEnabled', e.target.checked)
                  }
                  className="preference-checkbox"
                />
                <span className="preference-name">Email Notifications</span>
              </label>
              <p className="preference-description">
                Get email reminders about your progress
              </p>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-control">
              <label className="preference-label">
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled}
                  disabled={pushPermission === 'denied'}
                  onChange={(e) =>
                    handleToggle('pushEnabled', e.target.checked)
                  }
                  className="preference-checkbox"
                />
                <span className="preference-name">Push Notifications</span>
              </label>
              <p className="preference-description">
                Browser notifications on your desktop
              </p>
              {pushPermission === 'denied' && (
                <button
                  onClick={handleRequestPushPermission}
                  className="btn btn-sm btn-secondary"
                >
                  Enable Push Notifications
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Notification Frequency */}
        <section className="preferences-section">
          <h3 className="section-title">Notification Frequency</h3>

          <div className="preference-item">
            <div className="preference-radio-group">
              <label className="preference-radio">
                <input
                  type="radio"
                  name="frequency"
                  value="immediate"
                  checked={preferences.frequency === 'immediate'}
                  onChange={(e) =>
                    handleFrequencyChange(
                      e.target.value as 'immediate' | 'daily' | 'weekly'
                    )
                  }
                />
                <span>Immediate</span>
                <p className="radio-description">Get notified right away</p>
              </label>

              <label className="preference-radio">
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={preferences.frequency === 'daily'}
                  onChange={(e) =>
                    handleFrequencyChange(
                      e.target.value as 'immediate' | 'daily' | 'weekly'
                    )
                  }
                />
                <span>Daily</span>
                <p className="radio-description">
                  Get a summary once per day
                </p>
              </label>

              <label className="preference-radio">
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={preferences.frequency === 'weekly'}
                  onChange={(e) =>
                    handleFrequencyChange(
                      e.target.value as 'immediate' | 'daily' | 'weekly'
                    )
                  }
                />
                <span>Weekly</span>
                <p className="radio-description">Weekly summary</p>
              </label>
            </div>
          </div>
        </section>

        {/* Preferred Time */}
        <section className="preferences-section">
          <h3 className="section-title">Preferred Notification Time</h3>

          <div className="preference-item">
            <label className="preference-label">
              <span className="preference-name">Time of Day</span>
              <input
                type="time"
                value={preferences.preferredTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="time-input"
              />
            </label>
            <p className="preference-description">
              Notifications will be sent at this time in your timezone (
              {preferences.timezone})
            </p>
          </div>
        </section>

        {/* Save Status */}
        <div className="preferences-footer">
          {saved && (
            <div className="save-success">
              ✓ Preferences saved successfully
            </div>
          )}

          <div className="button-group">
            <button onClick={handleSave} className="btn btn-primary">
              Save Preferences
            </button>

            <button
              onClick={handleUnsubscribe}
              className="btn btn-link btn-danger"
            >
              Unsubscribe from All
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="preferences-info">
          <h4>How Notifications Work</h4>
          <ul>
            <li>
              <strong>Weekly Check:</strong> Every Monday morning, we check if
              it's time to start a new module
            </li>
            <li>
              <strong>Behind Schedule:</strong> We'll let you know if you're
              falling behind and help you catch up
            </li>
            <li>
              <strong>Timezone:</strong> All times are in your local timezone
            </li>
            <li>
              <strong>No Spam:</strong> We only send important updates about
              your progress
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
