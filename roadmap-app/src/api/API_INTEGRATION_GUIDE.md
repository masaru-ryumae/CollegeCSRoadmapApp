# Summer Builder API Integration Guide

## Overview

This guide covers the REST API, authentication, integrations with Slack, Discord, LinkedIn, and social media platforms for the Summer Builder application.

## Table of Contents

1. [REST API](#rest-api)
2. [Authentication](#authentication)
3. [Slack Integration](#slack-integration)
4. [Discord Integration](#discord-integration)
5. [LinkedIn Integration](#linkedin-integration)
6. [Social Media Sharing](#social-media-sharing)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)

---

## REST API

### Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.summerbuilder.com/v1
```

### API Documentation

Interactive API docs available at: `/api-docs` (Swagger UI)

---

## Authentication

### Methods

The API supports three authentication methods:

#### 1. JWT Token (Bearer)

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  https://api.summerbuilder.com/api/v1/projects
```

#### 2. API Keys

```bash
curl -H "X-API-Key: <your-api-key>" \
  https://api.summerbuilder.com/api/v1/projects
```

#### 3. OAuth2 (Third-party)

```
GET /api/v1/auth/google/authorize
GET /api/v1/auth/github/authorize
```

### Getting a JWT Token

**Register:**
```bash
POST /api/v1/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure-password"
}
```

**Login:**
```bash
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response includes JWT token valid for 24 hours.

---

## Endpoints

### Projects

#### List Projects
```
GET /api/v1/projects?limit=20&offset=0
```

#### Get Project Details
```
GET /api/v1/projects/{id}
```

#### Create Project
```
POST /api/v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My CS Roadmap",
  "description": "Summer learning plan",
  "pathName": "balanced",
  "public": false
}
```

#### Update Project
```
PUT /api/v1/projects/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "public": true
}
```

#### Delete Project
```
DELETE /api/v1/projects/{id}
Authorization: Bearer {token}
```

#### Share Project
```
POST /api/v1/projects/{id}/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "emails": ["friend@example.com"],
  "permission": "view"
}
```

### Users

#### Get User Profile
```
GET /api/v1/users/{id}
```

#### Update Profile
```
PUT /api/v1/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Name",
  "bio": "CS student",
  "avatar": "https://...",
  "public": true
}
```

#### Get Progress
```
GET /api/v1/users/{id}/progress
```

#### Update Progress
```
POST /api/v1/users/{id}/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "hoursLogged": 2.5,
  "moduleCompleted": "module-123",
  "roadmapId": "roadmap-456"
}
```

#### Get Badges
```
GET /api/v1/users/{id}/badges
```

### Collections

#### List Collections
```
GET /api/v1/collections?limit=20&category=general
```

#### Get Collection
```
GET /api/v1/collections/{id}
```

#### Create Collection
```
POST /api/v1/collections
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Data Structures",
  "description": "Master DS & Algorithms",
  "category": "algorithms",
  "modules": ["mod-1", "mod-2"],
  "public": true
}
```

#### Follow Collection
```
POST /api/v1/collections/{id}/follow
Authorization: Bearer {token}
```

#### Like Collection
```
POST /api/v1/collections/{id}/like
Authorization: Bearer {token}
```

### Progress

#### Log Progress
```
POST /api/v1/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "roadmapId": "roadmap-123",
  "moduleId": "module-456",
  "hoursLogged": 2,
  "keyPointsCompleted": ["kp-1", "kp-2"],
  "status": "in-progress",
  "notes": "Great session today!"
}
```

#### Get Progress Summary
```
GET /api/v1/progress/stats/summary?roadmapId=roadmap-123
Authorization: Bearer {token}
```

#### Get Achievements
```
GET /api/v1/progress/achievements/list
Authorization: Bearer {token}
```

---

## Slack Integration

### Setup

1. Create Slack app at https://api.slack.com/apps
2. Set up Event Subscriptions and Slash Commands
3. Get OAuth tokens from Slack

### Authorization

```bash
GET /api/v1/integrations/slack/auth
```

Redirects to Slack OAuth flow. Returns workspace token.

### Available Slack Commands

```
/summer-builder start-project     - Start tracking a project
/summer-builder my-progress       - Show your progress
/summer-builder recommend         - Get AI recommendations
/summer-builder leaderboard       - See team leaderboard
/summer-builder streak            - Show learning streak
```

### Slack Events

Bot automatically posts notifications for:
- Project completion
- Achievement unlocked
- Friend joined community
- Milestone reached

### Example: Post Progress Update

```bash
POST /api/v1/integrations/slack/notify
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "milestone",
  "milestone": "first-module",
  "details": {
    "moduleName": "Data Structures"
  }
}
```

---

## Discord Integration

### Setup

1. Create Discord app at https://discord.com/developers
2. Enable Message Content Intent
3. Add bot to your server

### Available Commands

```
/progress                - Show your progress
/recommend              - Get AI recommendations
/leaderboard [limit]   - Top learners
/badges                - Your achievements
/challenge             - Active challenges
/logprogress <hours> <topic> [notes] - Log session
```

### Notifications

Bot posts to configured channel when:
- User completes module
- User earns badge
- Leaderboard updates

### Configuration

```bash
POST /api/v1/integrations/discord/configure
Authorization: Bearer {token}
Content-Type: application/json

{
  "guildId": "discord-guild-id",
  "notificationChannel": "learning-updates"
}
```

---

## LinkedIn Integration

### OAuth Flow

**Step 1: Get Auth URL**
```bash
GET /api/v1/integrations/linkedin/auth
```

**Step 2: User Authorizes**
Redirect to LinkedIn OAuth page

**Step 3: Exchange Code**
```bash
POST /api/v1/integrations/linkedin/callback
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "linkedin-auth-code"
}
```

### Share to LinkedIn

Automatically shares when:
- Project completed
- Achievement unlocked
- Learning roadmap published

### Manual Share

```bash
POST /api/v1/integrations/social/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "platforms": ["linkedin"],
  "project": {
    "name": "CS Algorithms",
    "difficulty": "intermediate",
    "hours": 15,
    "modules": 5
  }
}
```

---

## Social Media Sharing

### Supported Platforms

- LinkedIn
- Twitter/X
- Facebook

### Share Templates

```javascript
// Achievement
{
  "achievement": {
    "name": "First Module Complete",
    "icon": "🎯",
    "description": "Completed your first module"
  },
  "platforms": ["linkedin", "twitter", "facebook"]
}

// Project
{
  "project": {
    "name": "Data Structures Mastery",
    "difficulty": "Intermediate",
    "hours": 20,
    "modules": 5
  },
  "platforms": ["linkedin", "twitter"]
}
```

### Custom Message

```bash
POST /api/v1/integrations/social/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "platforms": ["linkedin", "twitter"],
  "customMessage": "Just crushed my CS learning goals! 🚀"
}
```

---

## Rate Limiting

### Limits by Tier

| Tier | Requests/Hour | Premium Features |
|------|---------------|------------------|
| Free | 1,000 | Limited |
| Premium | 5,000 | Full |
| Enterprise | 10,000 | Unlimited |

### Headers

Response includes rate limit info:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
X-RateLimit-Tier: free
```

### Exceeding Limits

```
HTTP 429 Too Many Requests

{
  "error": "Too Many Requests",
  "message": "Rate limit of 1000 requests per hour exceeded",
  "retryAfter": 3600
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Name",
  "message": "Detailed error message",
  "timestamp": "2024-06-08T10:30:00Z"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

### Example Error

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired JWT token",
  "timestamp": "2024-06-08T10:30:00Z"
}
```

---

## Best Practices

### 1. Security

- Always use HTTPS in production
- Store tokens securely (httpOnly cookies)
- Rotate API keys regularly
- Use environment variables for secrets

### 2. Performance

- Use pagination for large datasets
- Cache frequently accessed data
- Batch requests when possible
- Implement exponential backoff for retries

### 3. Reliability

- Implement retry logic with exponential backoff
- Monitor API response times
- Set up alerts for error rates
- Use webhooks for async operations

### 4. Development

- Use sandbox/staging environment
- Test rate limiting behavior
- Validate error handling
- Test OAuth flows thoroughly

---

## Environment Variables

```bash
# API Configuration
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Slack
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_BOT_TOKEN=...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=...

# Discord
DISCORD_BOT_TOKEN=...

# LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Rate Limiting
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## Support

For API issues or questions:
- Email: api@summerbuilder.com
- Discord: https://discord.gg/summerbuilder
- Docs: https://docs.summerbuilder.com
