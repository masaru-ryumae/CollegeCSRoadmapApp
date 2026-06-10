import axios from 'axios';

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook';

export interface SocialShareConfig {
  platform: SocialPlatform;
  accessToken: string;
  userId: string;
  username?: string;
}

export interface ShareTemplate {
  id: string;
  name: string;
  template: string;
  platforms: SocialPlatform[];
  variables: string[];
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  text: string;
  imageUrl?: string;
  url?: string;
  createdAt: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
}

// Pre-defined templates for different achievement types
export const SHARE_TEMPLATES: Record<string, ShareTemplate> = {
  projectCompletion: {
    id: 'project-completion',
    name: 'Project Completion',
    template: `🎉 Just completed my "{projectName}" project!
Spent {hours} hours mastering {modules} modules at {difficulty} level.
Built with Summer Builder! #LearningJourney #CodingSkills`,
    platforms: ['linkedin', 'twitter', 'facebook'],
    variables: ['projectName', 'hours', 'modules', 'difficulty']
  },
  achievementUnlock: {
    id: 'achievement-unlock',
    name: 'Achievement Unlocked',
    template: `{achievementIcon} I just earned the "{achievementName}" badge!
{achievementDescription}

#Achievement #LearningPath #CareerGrowth`,
    platforms: ['linkedin', 'twitter', 'facebook'],
    variables: ['achievementIcon', 'achievementName', 'achievementDescription']
  },
  streakMilestone: {
    id: 'streak-milestone',
    name: 'Learning Streak',
    template: `🔥 {streakDays}-day learning streak!
Committed to my growth and crushing my goals with Summer Builder.
Who else is on a learning journey? #ConsistencyWins`,
    platforms: ['linkedin', 'twitter', 'facebook'],
    variables: ['streakDays']
  },
  collectionShare: {
    id: 'collection-share',
    name: 'Collection Share',
    template: `📚 Check out my "{collectionName}" learning roadmap!
{description}
{url}
#LearningPath #CareerDevelopment`,
    platforms: ['linkedin', 'twitter', 'facebook'],
    variables: ['collectionName', 'description', 'url']
  }
};

/**
 * Render template with variables
 */
export const renderTemplate = (
  template: ShareTemplate,
  variables: Record<string, string>
): string => {
  let rendered = template.template;

  template.variables.forEach(varName => {
    const placeholder = `{${varName}}`;
    const value = variables[varName] || '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  });

  return rendered;
};

/**
 * Post to Twitter/X
 */
export const postToTwitter = async (
  text: string,
  config: SocialShareConfig,
  mediaUrl?: string
): Promise<SocialPost> => {
  try {
    // Twitter API v2 endpoint
    const tweetData: any = {
      text: text.substring(0, 280) // Twitter character limit
    };

    if (mediaUrl) {
      // In production, upload media first and get media ID
      tweetData.reply = {
        in_reply_to_tweet_id: undefined
      };
    }

    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      tweetData,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      id: response.data.data.id,
      platform: 'twitter',
      text,
      imageUrl: mediaUrl,
      createdAt: new Date().toISOString(),
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0
      }
    };
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    throw error;
  }
};

/**
 * Post to Facebook
 */
export const postToFacebook = async (
  text: string,
  config: SocialShareConfig,
  imageUrl?: string,
  link?: string
): Promise<SocialPost> => {
  try {
    const postData: any = {
      message: text
    };

    if (imageUrl) {
      postData.picture = imageUrl;
    }

    if (link) {
      postData.link = link;
    }

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/me/feed`,
      postData,
      {
        params: {
          access_token: config.accessToken
        }
      }
    );

    return {
      id: response.data.id,
      platform: 'facebook',
      text,
      imageUrl,
      url: link,
      createdAt: new Date().toISOString(),
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0
      }
    };
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    throw error;
  }
};

/**
 * Post to multiple platforms simultaneously
 */
export const postToMultiplePlatforms = async (
  text: string,
  platforms: SocialPlatform[],
  configs: Map<SocialPlatform, SocialShareConfig>,
  mediaUrl?: string
): Promise<SocialPost[]> => {
  const results: SocialPost[] = [];
  const errors: Array<{ platform: SocialPlatform; error: string }> = [];

  for (const platform of platforms) {
    const config = configs.get(platform);
    if (!config) {
      errors.push({ platform, error: 'No config found' });
      continue;
    }

    try {
      let post: SocialPost;

      switch (platform) {
        case 'twitter':
          post = await postToTwitter(text, config, mediaUrl);
          break;
        case 'facebook':
          post = await postToFacebook(text, config, mediaUrl);
          break;
        case 'linkedin':
          // LinkedIn sharing handled separately in linkedinShare.ts
          continue;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      results.push(post);
    } catch (error) {
      errors.push({
        platform,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (errors.length > 0) {
    console.warn('Some posts failed:', errors);
  }

  return results;
};

/**
 * Generate shareable card image for achievements
 */
export const generateAchievementCard = async (
  achievement: {
    name: string;
    icon: string;
    description: string;
    earnedDate: string;
    username: string;
  }
): Promise<string> => {
  try {
    // In production, use image generation service (Cloudinary, etc.)
    // For now, return a placeholder
    const cardUrl = new URL('https://api.summerbuilder.com/generate-card');
    cardUrl.searchParams.append('type', 'achievement');
    cardUrl.searchParams.append('name', achievement.name);
    cardUrl.searchParams.append('icon', achievement.icon);
    cardUrl.searchParams.append('username', achievement.username);

    return cardUrl.toString();
  } catch (error) {
    console.error('Error generating achievement card:', error);
    throw error;
  }
};

/**
 * Generate project completion card
 */
export const generateProjectCard = async (
  project: {
    name: string;
    difficulty: string;
    hours: number;
    modules: number;
    username: string;
  }
): Promise<string> => {
  try {
    const cardUrl = new URL('https://api.summerbuilder.com/generate-card');
    cardUrl.searchParams.append('type', 'project');
    cardUrl.searchParams.append('name', project.name);
    cardUrl.searchParams.append('difficulty', project.difficulty);
    cardUrl.searchParams.append('hours', project.hours.toString());
    cardUrl.searchParams.append('modules', project.modules.toString());
    cardUrl.searchParams.append('username', project.username);

    return cardUrl.toString();
  } catch (error) {
    console.error('Error generating project card:', error);
    throw error;
  }
};

/**
 * URL shortener for share links
 */
export const shortenShareUrl = async (longUrl: string, platform: SocialPlatform): Promise<string> => {
  try {
    // Use bit.ly or similar service
    const response = await axios.post(
      'https://api-ssl.bitly.com/v4/shorten',
      {
        long_url: longUrl,
        domain: 'bit.ly'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BITLY_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.link;
  } catch (error) {
    console.error('Error shortening URL:', error);
    return longUrl; // Fall back to original URL
  }
};

/**
 * Get engagement metrics for a post
 */
export const getPostMetrics = async (
  postId: string,
  platform: SocialPlatform,
  config: SocialShareConfig
): Promise<{ likes: number; shares: number; comments: number }> => {
  try {
    switch (platform) {
      case 'twitter':
        const twitterRes = await axios.get(
          `https://api.twitter.com/2/tweets/${postId}`,
          {
            params: {
              'tweet.fields': 'public_metrics'
            },
            headers: {
              Authorization: `Bearer ${config.accessToken}`
            }
          }
        );

        const metrics = twitterRes.data.data.public_metrics;
        return {
          likes: metrics.like_count,
          shares: metrics.retweet_count,
          comments: metrics.reply_count
        };

      case 'facebook':
        const fbRes = await axios.get(
          `https://graph.facebook.com/v19.0/${postId}`,
          {
            params: {
              fields: 'likes.summary(total_count).limit(0),shares,comments.summary(total_count).limit(0)',
              access_token: config.accessToken
            }
          }
        );

        return {
          likes: fbRes.data.likes?.summary?.total_count || 0,
          shares: fbRes.data.shares?.data?.length || 0,
          comments: fbRes.data.comments?.summary?.total_count || 0
        };

      default:
        return { likes: 0, shares: 0, comments: 0 };
    }
  } catch (error) {
    console.error('Error getting post metrics:', error);
    return { likes: 0, shares: 0, comments: 0 };
  }
};

export default {
  renderTemplate,
  postToTwitter,
  postToFacebook,
  postToMultiplePlatforms,
  generateAchievementCard,
  generateProjectCard,
  shortenShareUrl,
  getPostMetrics,
  SHARE_TEMPLATES
};
