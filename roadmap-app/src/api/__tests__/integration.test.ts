/**
 * Integration Tests for Summer Builder API
 * Tests API endpoints, authentication, rate limiting, and integrations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'test-password-123'
};

let authToken: string;
let userId: string;
let testProjectId: string;

describe('Summer Builder API Integration Tests', () => {
  beforeEach(() => {
    // Would initialize test database state here
  });

  // ============= Authentication Tests =============
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await axios.post(`${API_BASE_URL}/users/register`, TEST_USER);

      expect(response.status).toBe(201);
      expect(response.data.data.user).toBeDefined();
      expect(response.data.data.token).toBeDefined();
      expect(response.data.data.user.email).toBe(TEST_USER.email);

      authToken = response.data.data.token;
      userId = response.data.data.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      expect(response.status).toBe(200);
      expect(response.data.data.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      try {
        await axios.post(`${API_BASE_URL}/users/login`, {
          email: TEST_USER.email,
          password: 'wrong-password'
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject requests without authentication', async () => {
      try {
        await axios.post(`${API_BASE_URL}/projects`, {
          name: 'Test Project',
          description: 'Test'
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // ============= Projects Tests =============
  describe('Projects', () => {
    it('should create a project', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/projects`,
        {
          name: 'My Summer Roadmap',
          description: 'CS Learning Plan',
          pathName: 'balanced',
          public: false
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe('My Summer Roadmap');

      testProjectId = response.data.data.id;
    });

    it('should get project details', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${testProjectId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(testProjectId);
    });

    it('should list projects', async () => {
      const response = await axios.get(`${API_BASE_URL}/projects?limit=10`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    it('should update project', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/projects/${testProjectId}`,
        {
          name: 'Updated Roadmap Name',
          public: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated Roadmap Name');
      expect(response.data.data.public).toBe(true);
    });

    it('should share project', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/projects/${testProjectId}/share`,
        {
          emails: ['friend@example.com'],
          permission: 'view'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.sharedWith).toBeDefined();
    });
  });

  // ============= Progress Tests =============
  describe('Progress Tracking', () => {
    it('should log progress', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/progress`,
        {
          roadmapId: testProjectId,
          moduleId: 'module-1',
          hoursLogged: 2.5,
          keyPointsCompleted: ['kp-1', 'kp-2'],
          status: 'in-progress',
          notes: 'Great session!'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.data.hoursLogged).toBe(2.5);
    });

    it('should get progress summary', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/progress/stats/summary`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.totalHoursLogged).toBeDefined();
      expect(response.data.data.overallProgress).toBeDefined();
    });

    it('should get achievements', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/progress/achievements/list`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data.achievements)).toBe(true);
    });
  });

  // ============= Collections Tests =============
  describe('Collections', () => {
    let collectionId: string;

    it('should create collection', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/collections`,
        {
          name: 'Data Structures',
          description: 'Master DS & Algorithms',
          category: 'algorithms',
          modules: ['mod-1', 'mod-2'],
          public: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe('Data Structures');

      collectionId = response.data.data.id;
    });

    it('should list collections', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/collections?limit=20&category=algorithms`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should follow collection', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/collections/${collectionId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.isFollowing).toBe(true);
    });

    it('should like collection', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/collections/${collectionId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.likes).toBeGreaterThan(0);
    });
  });

  // ============= Rate Limiting Tests =============
  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(response.headers['x-ratelimit-tier']).toBe('free');
    });

    it('should enforce rate limits', async () => {
      // Make many requests to trigger rate limit
      const requests = Array(1001).fill(null).map(() =>
        axios.get(`${API_BASE_URL}/projects`)
      );

      const results = await Promise.allSettled(requests);
      const rateLimitErrors = results.filter(
        r => r.status === 'rejected' && r.reason?.response?.status === 429
      );

      expect(rateLimitErrors.length).toBeGreaterThan(0);
    });
  });

  // ============= Integration Tests =============
  describe('Integrations', () => {
    it('should get LinkedIn auth URL', async () => {
      const response = await axios.get(`${API_BASE_URL}/integrations/linkedin/auth`);

      expect(response.status).toBe(200);
      expect(response.data.data.url).toContain('linkedin.com/oauth');
    });

    it('should get Slack auth URL', async () => {
      const response = await axios.get(`${API_BASE_URL}/integrations/slack/auth`);

      expect(response.status).toBe(200);
      expect(response.data.data.url).toContain('slack.com/oauth');
    });

    it('should share to social platforms', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/integrations/social/share`,
        {
          platforms: ['linkedin'],
          project: {
            name: 'Test Project',
            difficulty: 'intermediate',
            hours: 10,
            modules: 3
          }
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.shared).toBe(true);
    });
  });

  // ============= User Tests =============
  describe('User Profile', () => {
    it('should get user profile', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.data.data.email).toBe(TEST_USER.email);
    });

    it('should update user profile', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/users/${userId}`,
        {
          name: 'Updated Name',
          bio: 'CS Student',
          public: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated Name');
    });

    it('should get user progress', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/progress`);

      expect(response.status).toBe(200);
      expect(response.data.data.totalHoursLogged).toBeDefined();
    });

    it('should get user badges', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/badges`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data.badges)).toBe(true);
    });
  });

  // ============= Error Handling Tests =============
  describe('Error Handling', () => {
    it('should return 404 for non-existent project', async () => {
      try {
        await axios.get(`${API_BASE_URL}/projects/non-existent`);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Not Found');
      }
    });

    it('should return 403 for unauthorized access', async () => {
      // Try to delete another user's project
      try {
        await axios.delete(
          `${API_BASE_URL}/projects/other-user-project`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect([403, 404]).toContain(error.response.status);
      }
    });

    it('should return validation error', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/projects`,
          {
            // Missing required fields
            description: 'Test'
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  // ============= Health Check =============
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
    });
  });
});
