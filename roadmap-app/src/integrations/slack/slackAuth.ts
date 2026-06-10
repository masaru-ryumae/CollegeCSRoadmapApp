import axios from 'axios';
import { Request, Response } from 'express';

interface SlackOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface SlackAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
  };
  authed_user: {
    id: string;
    access_token: string;
  };
}

// Configuration
const slackConfig: SlackOAuthConfig = {
  clientId: process.env.SLACK_CLIENT_ID || '',
  clientSecret: process.env.SLACK_CLIENT_SECRET || '',
  redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/slack/callback'
};

// Store for workspace tokens - use database in production
const workspaceTokens: Map<string, SlackAuthToken> = new Map();
const userPermissions: Map<string, Set<string>> = new Map();

/**
 * Generate Slack OAuth authorization URL
 */
export const getSlackAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: slackConfig.clientId,
    scope: [
      'app_mentions:read',
      'channels:history',
      'channels:manage',
      'channels:read',
      'chat:write',
      'commands',
      'emoji:read',
      'groups:history',
      'groups:read',
      'im:history',
      'im:read',
      'reactions:read',
      'team:read',
      'users:read',
      'users:read.email'
    ].join(' '),
    redirect_uri: slackConfig.redirectUri,
    state: generateRandomState()
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<SlackAuthToken> => {
  try {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      {
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
        code,
        redirect_uri: slackConfig.redirectUri
      }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error}`);
    }

    const token: SlackAuthToken = response.data;

    // Store token for the workspace
    if (token.team?.id) {
      workspaceTokens.set(token.team.id, token);
    }

    return token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

/**
 * OAuth callback handler for Express
 */
export const slackOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({
        error: 'Slack authorization failed',
        message: error
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Missing authorization code'
      });
    }

    // Verify state parameter (implement CSRF protection)
    if (!state || !verifyState(state as string)) {
      return res.status(400).json({
        error: 'Invalid state parameter',
        message: 'CSRF verification failed'
      });
    }

    // Exchange code for token
    const token = await exchangeCodeForToken(code);

    // Redirect to frontend with success
    const redirectUrl = new URL(
      `${process.env.APP_URL || 'http://localhost:5173'}/integrations/slack/success`
    );
    redirectUrl.searchParams.append('workspace', token.team?.name || 'Unknown');
    redirectUrl.searchParams.append('userId', token.authed_user?.id || '');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Revoke Slack workspace integration
 */
export const revokeSlackIntegration = async (workspaceId: string): Promise<boolean> => {
  try {
    const token = workspaceTokens.get(workspaceId);

    if (!token) {
      throw new Error('Workspace not found');
    }

    // Call Slack API to revoke token
    const response = await axios.post(
      'https://slack.com/api/auth.revoke',
      {},
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      }
    );

    if (response.data.ok) {
      workspaceTokens.delete(workspaceId);
      userPermissions.delete(workspaceId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error revoking Slack integration:', error);
    throw error;
  }
};

/**
 * Request channel permissions for notifications
 */
export const requestChannelPermissions = async (
  workspaceId: string,
  channelId: string,
  permissions: string[]
): Promise<boolean> => {
  try {
    const token = workspaceTokens.get(workspaceId);

    if (!token) {
      throw new Error('Workspace not found');
    }

    // Verify bot has access to channel
    const response = await axios.get(
      'https://slack.com/api/conversations.info',
      {
        params: { channel: channelId },
        headers: { Authorization: `Bearer ${token.access_token}` }
      }
    );

    if (response.data.ok) {
      // Store permission for this workspace
      userPermissions.set(workspaceId, new Set(permissions));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error requesting channel permissions:', error);
    throw error;
  }
};

/**
 * Get workspace token
 */
export const getWorkspaceToken = (workspaceId: string): SlackAuthToken | undefined => {
  return workspaceTokens.get(workspaceId);
};

/**
 * Check if workspace has required permissions
 */
export const hasPermission = (workspaceId: string, permission: string): boolean => {
  const perms = userPermissions.get(workspaceId);
  return perms ? perms.has(permission) : false;
};

/**
 * List all connected workspaces
 */
export const listWorkspaces = (): Array<{
  id: string;
  name: string;
  iconUrl: string;
}> => {
  return Array.from(workspaceTokens.entries()).map(([id, token]) => ({
    id,
    name: token.team?.name || 'Unknown',
    iconUrl: `https://a.slack-edge.com/80588/marketing/img/logos/company/slack-icon-512.png`
  }));
};

/**
 * Get workspace info
 */
export const getWorkspaceInfo = async (workspaceId: string): Promise<any> => {
  try {
    const token = workspaceTokens.get(workspaceId);

    if (!token) {
      throw new Error('Workspace not found');
    }

    const response = await axios.get(
      'https://slack.com/api/team.info',
      {
        headers: { Authorization: `Bearer ${token.access_token}` }
      }
    );

    return response.data.team;
  } catch (error) {
    console.error('Error getting workspace info:', error);
    throw error;
  }
};

/**
 * Helper: Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return require('crypto').randomBytes(16).toString('hex');
}

/**
 * Helper: Verify state parameter
 */
function verifyState(state: string): boolean {
  // In production, validate against session store
  return state.length === 32;
}

/**
 * Test Slack connection
 */
export const testSlackConnection = async (workspaceId: string): Promise<boolean> => {
  try {
    const token = workspaceTokens.get(workspaceId);

    if (!token) {
      return false;
    }

    const response = await axios.get(
      'https://slack.com/api/auth.test',
      {
        headers: { Authorization: `Bearer ${token.access_token}` }
      }
    );

    return response.data.ok;
  } catch (error) {
    console.error('Error testing Slack connection:', error);
    return false;
  }
};
