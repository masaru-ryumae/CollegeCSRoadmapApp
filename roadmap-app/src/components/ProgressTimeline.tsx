import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTimelineEvents } from '../utils/analyticsEngine';
import type { ActivityEvent } from '../types';
import './ProgressTimeline.css';

type EventFilter = 'all' | 'project-completed' | 'milestone' | 'badge-earned' | 'streak' | 'level-up';

export function ProgressTimeline() {
  const { state } = useApp();
  const { roadmap } = state;
  const [filter, setFilter] = useState<EventFilter>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const timelineEvents = useMemo(() => {
    if (!roadmap) return [];
    return getTimelineEvents(roadmap);
  }, [roadmap]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return timelineEvents;

    return timelineEvents
      .map((timelineEntry) => ({
        ...timelineEntry,
        events: timelineEntry.events.filter((e) => e.type === filter),
      }))
      .filter((entry) => entry.events.length > 0);
  }, [timelineEvents, filter]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'project-completed':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'milestone':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'badge-earned':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        );
      case 'streak':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657L13.414 22.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
            />
          </svg>
        );
      case 'level-up':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      default:
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
    }
  };

  const getEventColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'project-completed':
        return 'event-blue';
      case 'milestone':
        return 'event-green';
      case 'badge-earned':
        return 'event-purple';
      case 'streak':
        return 'event-orange';
      case 'level-up':
        return 'event-gold';
      default:
        return 'event-gray';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  if (!roadmap) {
    return (
      <div className="timeline-empty">
        <p>Start your roadmap to track milestones and achievements.</p>
      </div>
    );
  }

  return (
    <div className="progress-timeline">
      {/* Header */}
      <div className="timeline-header">
        <div className="header-content">
          <h1>Progress Timeline</h1>
          <p>View all your achievements and milestones</p>
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          {(['all', 'project-completed', 'milestone', 'badge-earned', 'streak', 'level-up'] as const).map(
            (f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all'
                  ? 'All'
                  : f === 'project-completed'
                    ? 'Projects'
                    : f === 'milestone'
                      ? 'Milestones'
                      : f === 'badge-earned'
                        ? 'Badges'
                        : f === 'streak'
                          ? 'Streaks'
                          : 'Level Up'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        {filteredEvents.length === 0 ? (
          <div className="timeline-empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>No events found for this filter</p>
          </div>
        ) : (
          <div className="timeline">
            {filteredEvents.map((timelineEntry, dateIdx) => (
              <div key={dateIdx} className="timeline-date-group">
                <div className="timeline-date">
                  <h3>{formatDate(timelineEntry.date)}</h3>
                  <span className="event-count">{timelineEntry.events.length} event(s)</span>
                </div>

                <div className="timeline-events">
                  {timelineEntry.events.map((event, eventIdx) => (
                    <div
                      key={event.id}
                      className={`timeline-event ${getEventColor(event.type)}`}
                    >
                      <div className="event-marker">
                        <div className="event-icon">{getEventIcon(event.type)}</div>
                        {eventIdx < timelineEntry.events.length - 1 && (
                          <div className="event-line" />
                        )}
                      </div>

                      <div className="event-content">
                        <div className="event-header">
                          <h4>{event.title}</h4>
                          <span className="event-type">
                            {event.type.replace('-', ' ').charAt(0).toUpperCase() +
                              event.type.replace('-', ' ').slice(1)}
                          </span>
                        </div>
                        <p className="event-description">{event.description}</p>
                        <span className="event-time">
                          {new Date(event.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="timeline-stats">
        <div className="stat-card">
          <div className="stat-number">{timelineEvents.length}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{timelineEvents.filter((t) => t.events.some((e) => e.type === 'project-completed')).length}</div>
          <div className="stat-label">Projects Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{timelineEvents.filter((t) => t.events.some((e) => e.type === 'badge-earned')).length}</div>
          <div className="stat-label">Badges Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{timelineEvents[0]?.date || 'N/A'}</div>
          <div className="stat-label">Last Activity</div>
        </div>
      </div>
    </div>
  );
}
