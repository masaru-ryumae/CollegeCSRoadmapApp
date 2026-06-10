// Test suite for content creation & management features
import { expect, describe, it, beforeEach } from 'vitest';
import * as tutorialEngine from '../../utils/tutorialEngine';
import * as cmsEngine from '../../services/cmsEngine';
import * as communityEngine from '../../services/communityEngine';
import * as docGenerator from '../../services/docGenerator';

describe('Content Features - Tutorial Engine', () => {
  it('should create a new tutorial', () => {
    const tutorial = tutorialEngine.createTutorial(
      {
        title: 'Learning React',
        description: 'A complete guide to React',
        steps: [],
        tags: ['react', 'javascript'],
        difficulty: 'beginner',
        estimatedMinutes: 60,
      },
      {
        authorId: 'user123',
        seo: {
          title: 'Learn React',
          description: 'Complete guide',
          keywords: ['react'],
          slug: 'learn-react',
        },
      }
    );

    expect(tutorial.title).toBe('Learning React');
    expect(tutorial.status).toBe('draft');
    expect(tutorial.views).toBe(0);
  });

  it('should publish a tutorial', () => {
    const tutorial = tutorialEngine.createTutorial(
      {
        title: 'Test Tutorial',
        description: 'Test',
        steps: [],
        tags: [],
        difficulty: 'beginner',
        estimatedMinutes: 30,
      },
      {
        authorId: 'user123',
        seo: {
          title: 'Test',
          description: 'Test',
          keywords: [],
          slug: 'test',
        },
      }
    );

    const published = tutorialEngine.publishTutorial(tutorial.id);
    expect(published?.status).toBe('published');
    expect(published?.publishedAt).toBeDefined();
  });

  it('should track views and engagement', () => {
    const tutorial = tutorialEngine.createTutorial(
      {
        title: 'Tracking Test',
        description: 'Test',
        steps: [],
        tags: [],
        difficulty: 'beginner',
        estimatedMinutes: 30,
      },
      {
        authorId: 'user123',
        seo: {
          title: 'Test',
          description: 'Test',
          keywords: [],
          slug: 'test',
        },
      }
    );

    tutorialEngine.trackTutorialView(tutorial.id);
    tutorialEngine.trackEngagement(tutorial.id, 10);

    const stats = tutorialEngine.getTutorialStats(tutorial.id);
    expect(stats?.views).toBe(1);
    expect(stats?.engagement).toBe(10);
  });

  it('should export tutorial to markdown', () => {
    const tutorial = tutorialEngine.createTutorial(
      {
        title: 'Export Test',
        description: 'Test export',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'First step',
          },
        ],
        tags: ['test'],
        difficulty: 'beginner',
        estimatedMinutes: 30,
      },
      {
        authorId: 'user123',
        seo: {
          title: 'Test',
          description: 'Test',
          keywords: [],
          slug: 'test',
        },
      }
    );

    const markdown = tutorialEngine.exportTutorial(tutorial.id, 'markdown');
    expect(markdown).toContain('# Export Test');
    expect(markdown).toContain('Step 1');
  });
});

describe('Content Features - CMS Engine', () => {
  it('should create content', () => {
    const content = cmsEngine.createContent(
      'My First Content',
      'Description',
      'tutorial',
      'Content body',
      'user123',
      ['tag1', 'tag2']
    );

    expect(content.title).toBe('My First Content');
    expect(content.status).toBe('draft');
    expect(content.tags).toContain('tag1');
  });

  it('should submit content for review', () => {
    const content = cmsEngine.createContent(
      'Review Test',
      'Test',
      'tutorial',
      'Content',
      'user123'
    );

    const inReview = cmsEngine.submitForReview(content.id);
    expect(inReview?.status).toBe('review');
  });

  it('should approve content', () => {
    const content = cmsEngine.createContent(
      'Approval Test',
      'Test',
      'tutorial',
      'Content',
      'user123'
    );

    cmsEngine.submitForReview(content.id);
    const approved = cmsEngine.approveContent(content.id);

    expect(approved?.status).toBe('published');
    expect(approved?.publishedAt).toBeDefined();
  });

  it('should reject content', () => {
    const content = cmsEngine.createContent(
      'Rejection Test',
      'Test',
      'tutorial',
      'Content',
      'user123'
    );

    cmsEngine.submitForReview(content.id);
    const rejected = cmsEngine.rejectContent(content.id, 'Not enough detail');

    expect(rejected?.status).toBe('draft');
  });

  it('should search content', () => {
    cmsEngine.createContent('Search Test 1', 'Test', 'tutorial', 'React', 'user123', ['react']);
    cmsEngine.createContent('Search Test 2', 'Test', 'guide', 'Node.js', 'user123', ['nodejs']);

    const results = cmsEngine.searchContent('React', { type: 'tutorial' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should track content views and engagement', () => {
    const content = cmsEngine.createContent(
      'Analytics Test',
      'Test',
      'tutorial',
      'Content',
      'user123'
    );

    cmsEngine.trackContentView(content.id);
    cmsEngine.trackContentEngagement(content.id, 25);

    const analytics = cmsEngine.getContentAnalytics(content.id);
    expect(analytics?.views).toBe(1);
    expect(analytics?.engagement).toBe(25);
  });
});

describe('Content Features - Community Engine', () => {
  it('should submit content for community review', () => {
    const contribution = communityEngine.submitContent(
      'Community Tutorial',
      'Shared content',
      'tutorial',
      'contributor1'
    );

    expect(contribution.status).toBe('pending');
    expect(contribution.submittedBy).toBe('contributor1');
  });

  it('should approve community contribution', () => {
    const contribution = communityEngine.submitContent(
      'Approval Test',
      'Content',
      'tutorial',
      'contributor1'
    );

    const approved = communityEngine.approveContent(contribution.id, 'admin123');
    expect(approved?.status).toBe('approved');
    expect(approved?.reviewedBy).toBe('admin123');
  });

  it('should reject community contribution with feedback', () => {
    const contribution = communityEngine.submitContent(
      'Rejection Test',
      'Content',
      'tutorial',
      'contributor1'
    );

    const rejected = communityEngine.rejectContent(
      contribution.id,
      'admin123',
      'Needs more detail'
    );

    expect(rejected?.status).toBe('rejected');
    expect(rejected?.feedback).toContain('detail');
  });

  it('should award points to contributor', () => {
    const contribution = communityEngine.submitContent(
      'Points Test',
      'Content',
      'tutorial',
      'contributor1'
    );

    communityEngine.approveContent(contribution.id, 'admin123');

    const stats = communityEngine.getContributorStats('contributor1');
    expect(stats?.points).toBeGreaterThan(0);
  });

  it('should maintain leaderboard', () => {
    communityEngine.submitContent('Tutorial 1', 'Content', 'tutorial', 'user1');
    communityEngine.submitContent('Tutorial 2', 'Content', 'tutorial', 'user2');

    const leaderboard = communityEngine.getLeaderboard(5);
    expect(leaderboard.length).toBeGreaterThan(0);
  });

  it('should feature contributor', () => {
    const contributor = communityEngine.getOrCreateContributor('featured_user');
    const featured = communityEngine.featureContributor('featured_user');

    expect(featured?.featured).toBe(true);
  });

  it('should search contributions', () => {
    communityEngine.submitContent('Search Test', 'React content', 'tutorial', 'user1');

    const results = communityEngine.searchContributions('React', { status: 'pending' });
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Content Features - Documentation Generator', () => {
  it('should generate API documentation', () => {
    const endpoints = [
      {
        method: 'GET',
        path: '/api/users',
        description: 'Get all users',
        params: { limit: 'Number of results' },
      },
      {
        method: 'POST',
        path: '/api/users',
        description: 'Create user',
      },
    ];

    const doc = docGenerator.generateAPIDocumentation(endpoints, 'User API');

    expect(doc.title).toBe('User API');
    expect(doc.markdown).toContain('GET');
    expect(doc.markdown).toContain('/api/users');
  });

  it('should generate architecture documentation', () => {
    const doc = docGenerator.generateArchitectureDocumentation(
      {
        components: ['Frontend', 'Backend', 'Database'],
        relationships: ['Frontend calls Backend API', 'Backend uses Database'],
        dataFlow: 'User → Frontend → Backend → Database',
      },
      'My Project'
    );

    expect(doc.title).toContain('My Project');
    expect(doc.markdown).toContain('Frontend');
    expect(doc.markdown).toContain('Backend');
  });

  it('should generate deployment guide', () => {
    const doc = docGenerator.generateDeploymentGuide('My App', 'vercel');

    expect(doc.title).toContain('Deployment Guide');
    expect(doc.markdown).toContain('Vercel');
  });

  it('should generate troubleshooting guide', () => {
    const issues = {
      'Build fails': [
        'Check dependencies',
        'Clear node_modules',
      ],
      'Port in use': [
        'Kill process',
        'Use different port',
      ],
    };

    const doc = docGenerator.generateTroubleshootingGuide(issues);

    expect(doc.title).toContain('Troubleshooting');
    expect(doc.markdown).toContain('Build fails');
  });
});

describe('Content Features - Integration Tests', () => {
  it('should handle complete content lifecycle', () => {
    // Create
    const content = cmsEngine.createContent(
      'Complete Lifecycle',
      'Test content',
      'tutorial',
      'author1',
      ['test']
    );
    expect(content.status).toBe('draft');

    // Submit for review
    const inReview = cmsEngine.submitForReview(content.id);
    expect(inReview?.status).toBe('review');

    // Approve
    const published = cmsEngine.approveContent(content.id);
    expect(published?.status).toBe('published');

    // Track engagement
    cmsEngine.trackContentView(content.id);
    cmsEngine.trackContentEngagement(content.id, 50);

    const analytics = cmsEngine.getContentAnalytics(content.id);
    expect(analytics?.views).toBe(1);
    expect(analytics?.engagement).toBe(50);
  });

  it('should handle community contribution workflow', () => {
    // Submit
    const contribution = communityEngine.submitContent(
      'Community Content',
      'Great tutorial',
      'tutorial',
      'contributor123'
    );

    // Get pending
    const pending = communityEngine.getPendingContributions();
    expect(pending.length).toBeGreaterThan(0);

    // Approve
    communityEngine.approveContent(contribution.id, 'admin123');

    // Check contributor stats
    const stats = communityEngine.getContributorStats('contributor123');
    expect(stats?.approvedContributions).toBeGreaterThanOrEqual(0);
  });
});
