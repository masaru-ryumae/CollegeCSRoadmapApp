import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as linkedinShare from '../../integrations/linkedin/linkedinShare';
import * as socialPost from '../../integrations/social/socialPost';
import * as slackAuth from '../../integrations/slack/slackAuth';

const router = Router();

/**
 * @swagger
 * /api/v1/integrations/linkedin/auth:
 *   get:
 *     summary: Get LinkedIn OAuth URL
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: LinkedIn auth URL
 */
router.get('/linkedin/auth', (req: Request, res: Response) => {
  const state = require('crypto').randomBytes(16).toString('hex');
  const authUrl = linkedinShare.getLinkedInAuthUrl(state);

  res.json({
    data: {
      url: authUrl,
      state
    }
  });
});

/**
 * @swagger
 * /api/v1/integrations/linkedin/callback:
 *   post:
 *     summary: LinkedIn OAuth callback
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token exchanged
 */
router.post('/linkedin/callback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const { accessToken, expiresIn, userId } = await linkedinShare.exchangeCodeForLinkedInToken(code);

    linkedinShare.storeLinkedInProfile(req.user?.id || '', accessToken, expiresIn);

    res.json({
      data: {
        connected: true,
        linkedInUserId: userId,
        expiresIn
      }
    });
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(400).json({
      error: 'LinkedIn authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/slack/auth:
 *   get:
 *     summary: Get Slack OAuth URL
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: Slack auth URL
 */
router.get('/slack/auth', (req: Request, res: Response) => {
  const authUrl = slackAuth.getSlackAuthUrl();

  res.json({
    data: {
      url: authUrl
    }
  });
});

/**
 * @swagger
 * /api/v1/integrations/slack/workspaces:
 *   get:
 *     summary: List connected Slack workspaces
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 */
router.get('/slack/workspaces', authMiddleware, (req: Request, res: Response) => {
  const workspaces = slackAuth.listWorkspaces();

  res.json({
    data: workspaces
  });
});

/**
 * @swagger
 * /api/v1/integrations/slack/revoke:
 *   post:
 *     summary: Revoke Slack integration
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workspaceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Integration revoked
 */
router.post('/slack/revoke', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Missing workspaceId' });
    }

    const success = await slackAuth.revokeSlackIntegration(workspaceId);

    if (success) {
      res.json({ data: { revoked: true } });
    } else {
      res.status(400).json({ error: 'Failed to revoke integration' });
    }
  } catch (error) {
    console.error('Slack revoke error:', error);
    res.status(500).json({
      error: 'Failed to revoke Slack integration'
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/social/share:
 *   post:
 *     summary: Share to social platforms
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               achievement:
 *                 type: object
 *               project:
 *                 type: object
 *               customMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shared to platforms
 */
router.post('/social/share', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platforms, achievement, project, customMessage } = req.body;

    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms specified' });
    }

    // Generate message
    let message = customMessage;

    if (!message) {
      if (achievement) {
        const template = socialPost.SHARE_TEMPLATES.achievementUnlock;
        message = socialPost.renderTemplate(template, {
          achievementIcon: achievement.icon,
          achievementName: achievement.name,
          achievementDescription: achievement.description
        });
      } else if (project) {
        const template = socialPost.SHARE_TEMPLATES.projectCompletion;
        message = socialPost.renderTemplate(template, {
          projectName: project.name,
          hours: project.hours.toString(),
          modules: project.modules.toString(),
          difficulty: project.difficulty
        });
      }
    }

    if (!message) {
      return res.status(400).json({ error: 'No message to share' });
    }

    // Share to LinkedIn
    if (platforms.includes('linkedin')) {
      try {
        if (achievement) {
          await linkedinShare.shareAchievementBadge(req.user?.id || '', achievement);
        } else if (project) {
          await linkedinShare.shareProjectCompletion(req.user?.id || '', project);
        }
      } catch (error) {
        console.warn('LinkedIn share failed:', error);
      }
    }

    res.json({
      data: {
        shared: true,
        platforms,
        message: message.substring(0, 100) + '...'
      }
    });
  } catch (error) {
    console.error('Social share error:', error);
    res.status(500).json({
      error: 'Failed to share to social platforms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/linkedin/profile:
 *   get:
 *     summary: Get connected LinkedIn profile
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: LinkedIn profile data
 */
router.get('/linkedin/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const profile = linkedinShare.getLinkedInProfile(req.user?.id || '');

    if (!profile) {
      return res.status(404).json({ error: 'LinkedIn profile not connected' });
    }

    const profileData = await linkedinShare.getLinkedInProfileData(req.user?.id || '');

    res.json({
      data: {
        connected: true,
        ...profileData
      }
    });
  } catch (error) {
    console.error('Get LinkedIn profile error:', error);
    res.status(500).json({
      error: 'Failed to get LinkedIn profile'
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/linkedin/disconnect:
 *   post:
 *     summary: Disconnect LinkedIn
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: LinkedIn disconnected
 */
router.post('/linkedin/disconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await linkedinShare.revokeLinkedInAccess(req.user?.id || '');

    if (success) {
      res.json({ data: { disconnected: true } });
    } else {
      res.status(400).json({ error: 'Failed to disconnect LinkedIn' });
    }
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    res.status(500).json({
      error: 'Failed to disconnect LinkedIn'
    });
  }
});

export default router;
