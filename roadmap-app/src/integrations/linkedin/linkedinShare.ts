import axios from 'axios';

interface LinkedInProfile {
  userId: string;
  accessToken: string;
  expiresAt: number;
}

interface LinkedInPost {
  id: string;
  text: string;
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN' | 'PRIVATE';
  createdAt: string;
  likes: number;
  comments: number;
}

// LinkedIn OAuth config
const linkedInConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/linkedin/callback',
  apiVersion: 'v2'
};

// Storage for user profiles - use database in production
const userProfiles: Map<string, LinkedInProfile> = new Map();

/**
 * Generate LinkedIn OAuth authorization URL
 */
export const getLinkedInAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedInConfig.clientId,
    redirect_uri: linkedInConfig.redirectUri,
    state,
    scope: 'r_liteprofile r_emailaddress w_member_social'
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForLinkedInToken = async (
  code: string
): Promise<{ accessToken: string; expiresIn: number; userId: string }> => {
  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        grant_type: 'authorization_code',
        code,
        client_id: linkedInConfig.clientId,
        client_secret: linkedInConfig.clientSecret,
        redirect_uri: linkedInConfig.redirectUri
      },
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, expires_in } = response.data;

    // Get user ID
    const userRes = await axios.get(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/me`,
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    return {
      accessToken: access_token,
      expiresIn: expires_in,
      userId: userRes.data.id
    };
  } catch (error) {
    console.error('Error exchanging code for LinkedIn token:', error);
    throw error;
  }
};

/**
 * Store user profile token
 */
export const storeLinkedInProfile = (
  userId: string,
  accessToken: string,
  expiresIn: number
): void => {
  userProfiles.set(userId, {
    userId,
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000
  });
};

/**
 * Get stored profile
 */
export const getLinkedInProfile = (userId: string): LinkedInProfile | undefined => {
  return userProfiles.get(userId);
};

/**
 * Share project completion to LinkedIn
 */
export const shareProjectCompletion = async (
  userId: string,
  projectDetails: {
    name: string;
    description: string;
    hours: number;
    modules: number;
    difficulty: string;
  }
): Promise<LinkedInPost> => {
  const profile = getLinkedInProfile(userId);

  if (!profile) {
    throw new Error('LinkedIn profile not found. Please connect your LinkedIn account.');
  }

  if (Date.now() > profile.expiresAt) {
    throw new Error('LinkedIn token expired. Please reconnect.');
  }

  // Generate share text
  const shareText = `🎉 Just completed my "${projectDetails.name}" project!
Spent ${projectDetails.hours} hours mastering ${projectDetails.modules} modules at ${projectDetails.difficulty} level.

Building my CS skills this summer with @SummerBuilder
#LearningJourney #CSEducation #CodingSkills`;

  try {
    const response = await axios.post(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/ugcPosts`,
      {
        author: `urn:li:person:${profile.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishText': {
            text: shareText
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: { Authorization: `Bearer ${profile.accessToken}` }
      }
    );

    return {
      id: response.data.id,
      text: shareText,
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0
    };
  } catch (error) {
    console.error('Error sharing to LinkedIn:', error);
    throw error;
  }
};

/**
 * Share achievement badge to LinkedIn
 */
export const shareAchievementBadge = async (
  userId: string,
  achievement: {
    name: string;
    description: string;
    icon: string;
    unlockedDate: string;
  }
): Promise<LinkedInPost> => {
  const profile = getLinkedInProfile(userId);

  if (!profile) {
    throw new Error('LinkedIn profile not found');
  }

  const shareText = `${achievement.icon} I just earned the "${achievement.name}" badge!
${achievement.description}

Continuing my learning journey with @SummerBuilder
#Achievement #LearningPath #CareerGrowth`;

  try {
    const response = await axios.post(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/ugcPosts`,
      {
        author: `urn:li:person:${profile.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishText': {
            text: shareText
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: { Authorization: `Bearer ${profile.accessToken}` }
      }
    );

    return {
      id: response.data.id,
      text: shareText,
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0
    };
  } catch (error) {
    console.error('Error sharing achievement to LinkedIn:', error);
    throw error;
  }
};

/**
 * Share learning roadmap/collection
 */
export const shareRoadmapCollection = async (
  userId: string,
  collection: {
    name: string;
    description: string;
    modules: number;
    estimatedHours: number;
    shareUrl: string;
  }
): Promise<LinkedInPost> => {
  const profile = getLinkedInProfile(userId);

  if (!profile) {
    throw new Error('LinkedIn profile not found');
  }

  const shareText = `📚 Check out my curated "${collection.name}" learning roadmap!

${collection.description}

Modules: ${collection.modules} | Estimated Time: ${collection.estimatedHours}h

Explore it and let me know what you think!
${collection.shareUrl}

#LearningPath #CareerDevelopment #TechEducation`;

  try {
    const response = await axios.post(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/ugcPosts`,
      {
        author: `urn:li:person:${profile.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishText': {
            text: shareText
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: { Authorization: `Bearer ${profile.accessToken}` }
      }
    );

    return {
      id: response.data.id,
      text: shareText,
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0
    };
  } catch (error) {
    console.error('Error sharing roadmap to LinkedIn:', error);
    throw error;
  }
};

/**
 * Get user's LinkedIn profile data
 */
export const getLinkedInProfileData = async (
  userId: string
): Promise<{
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: string;
}> => {
  const profile = getLinkedInProfile(userId);

  if (!profile) {
    throw new Error('LinkedIn profile not found');
  }

  try {
    const response = await axios.get(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/me`,
      {
        headers: { Authorization: `Bearer ${profile.accessToken}` },
        params: {
          'projection': '(id,localizedFirstName,localizedLastName,profilePicture(displayImage))'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching LinkedIn profile data:', error);
    throw error;
  }
};

/**
 * Revoke LinkedIn access
 */
export const revokeLinkedInAccess = async (userId: string): Promise<boolean> => {
  const profile = getLinkedInProfile(userId);

  if (!profile) {
    return false;
  }

  try {
    await axios.post(
      `https://api.linkedin.com/${linkedInConfig.apiVersion}/oauth/v2/revoke`,
      {
        client_id: linkedInConfig.clientId,
        client_secret: linkedInConfig.clientSecret,
        token: profile.accessToken
      }
    );

    userProfiles.delete(userId);
    return true;
  } catch (error) {
    console.error('Error revoking LinkedIn access:', error);
    return false;
  }
};

export default {
  getLinkedInAuthUrl,
  exchangeCodeForLinkedInToken,
  storeLinkedInProfile,
  getLinkedInProfile,
  shareProjectCompletion,
  shareAchievementBadge,
  shareRoadmapCollection,
  getLinkedInProfileData,
  revokeLinkedInAccess
};
