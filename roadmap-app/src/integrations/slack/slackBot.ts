import { App, BoltEvent, BoltContext, RespondFn, AckFn } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

// Initialize Slack bot
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: {
    appToken: process.env.SLACK_APP_TOKEN || undefined
  }
});

// Mock user/project data - in production, fetch from database
const userProjects: Map<string, any> = new Map();
const userProgress: Map<string, any> = new Map();

/**
 * Command: /summer-builder start-project
 * Starts a new project in Summer Builder and announces in Slack
 */
app.command('/summer-builder', async ({ ack, body, context, respond }) => {
  await ack();

  const userId = body.user_id;
  const channelId = body.channel_id;

  try {
    // Create new project record
    const projectId = `proj-${Date.now()}`;
    userProjects.set(userId, {
      id: projectId,
      name: 'New Summer Project',
      status: 'started',
      startedAt: new Date().toISOString(),
      hoursLogged: 0
    });

    // Post confirmation to Slack
    await respond({
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🚀 <@${userId}> just started their Summer Builder journey!\n\n*Project:* New Summer Project\n*Status:* Just Getting Started\n\nYou've got this! Track your progress and get AI recommendations along the way.`
          },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: '📊 View Dashboard' },
            url: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`,
            action_id: 'view_dashboard'
          }
        }
      ]
    });

    // Send DM with initial guidance
    const web = new WebClient(context.botToken);
    await web.conversations.open({
      users: userId
    });

    await web.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Welcome to Summer Builder! 🎓'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "Here's what you can do with me:\n\n`/summer-builder my-progress` - See your current progress\n`/summer-builder recommend` - Get AI recommendations\n`/summer-builder leaderboard` - Check the leaderboard\n`/summer-builder streak` - View your learning streak"
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Get started by logging your first hours of learning!'
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error handling start-project command:', error);
    await respond({
      response_type: 'ephemeral',
      text: '❌ Something went wrong. Please try again.'
    });
  }
});

/**
 * Shortcut for quick progress logging
 */
app.shortcut('log_progress', async ({ ack, body, client, logger }) => {
  await ack();

  try {
    const triggerId = body.trigger_id;
    const userId = body.user_id;

    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'progress_modal',
        title: {
          type: 'plain_text',
          text: 'Log Your Progress'
        },
        blocks: [
          {
            block_id: 'hours_input',
            type: 'input',
            label: {
              type: 'plain_text',
              text: 'Hours Studied'
            },
            element: {
              type: 'number_input',
              action_id: 'hours_value',
              is_decimal_allowed: true
            }
          },
          {
            block_id: 'module_input',
            type: 'input',
            label: {
              type: 'plain_text',
              text: 'Module or Topic'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'module_value',
              placeholder: {
                type: 'plain_text',
                text: 'e.g., Data Structures, System Design'
              }
            }
          },
          {
            block_id: 'notes_input',
            type: 'input',
            label: {
              type: 'plain_text',
              text: 'Notes (Optional)'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'notes_value',
              multiline: true
            },
            optional: true
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Log Progress'
        }
      }
    });
  } catch (error) {
    logger.error('Error opening progress modal:', error);
  }
});

/**
 * Handle progress modal submission
 */
app.view('progress_modal', async ({ ack, body, view, client, logger }) => {
  await ack();

  try {
    const userId = body.user_id;
    const values = view.state.values;

    const hours = parseFloat(values.hours_input.hours_value.value);
    const module = values.module_input.module_value.value;
    const notes = values.notes_input?.notes_value?.value || '';

    // Update progress record
    const existing = userProgress.get(userId) || { totalHours: 0, sessions: [] };
    existing.totalHours += hours;
    existing.sessions.push({
      module,
      hours,
      notes,
      timestamp: new Date().toISOString()
    });
    userProgress.set(userId, existing);

    // Send confirmation
    await client.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ Great work! You logged *${hours} hours* on *${module}*\n\n📊 *Total Hours:* ${existing.totalHours}`
          }
        }
      ]
    });
  } catch (error) {
    logger.error('Error handling progress submission:', error);
  }
});

/**
 * Message handler for conversational interactions
 */
app.message(/progress|hours|learned/, async ({ message, say, context }) => {
  if (message.subtype === 'bot_message') return;

  try {
    const userId = (message as any).user;
    const userStats = userProgress.get(userId) || { totalHours: 0, sessions: [] };

    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${userId}>'s Progress 📈\n\n*Total Hours:* ${userStats.totalHours}\n*Sessions:* ${userStats.sessions.length}\n\nKeep crushing it! 💪`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

/**
 * Event listener for when user joins the workspace
 */
app.event('team_join', async ({ event, client, logger }) => {
  try {
    await client.chat.postMessage({
      channel: event.user.id,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎓 Welcome to Summer Builder Community!'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Connect with fellow learners, track your progress, and crush your CS learning goals this summer.'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📱 Open App' },
              url: process.env.APP_URL || 'http://localhost:5173',
              action_id: 'open_app'
            }
          ]
        }
      ]
    });
  } catch (error) {
    logger.error('Error handling team_join event:', error);
  }
});

/**
 * Reaction added handler for engagement
 */
app.event('reaction_added', async ({ event, client, logger }) => {
  if (event.reaction === 'rocket' || event.reaction === 'fire') {
    try {
      const userId = event.user;
      const channelId = event.item.channel;

      await client.reactions.add({
        channel: channelId,
        timestamp: event.item.ts,
        name: 'white_check_mark'
      });
    } catch (error) {
      logger.error('Error handling reaction:', error);
    }
  }
});

/**
 * Send notification to Slack when milestone is reached
 */
export const notifyMilestone = async (
  userId: string,
  milestone: 'first-module' | 'ten-hours' | 'achievement',
  details: any
) => {
  try {
    const web = new WebClient(process.env.SLACK_BOT_TOKEN);

    const messages: any = {
      'first-module': {
        title: '🎯 First Module Complete!',
        description: `<@${userId}> just completed their first module: *${details.moduleName}*`
      },
      'ten-hours': {
        title: '⭐ 10 Hour Club!',
        description: `<@${userId}> just logged their 10th hour of learning!`
      },
      'achievement': {
        title: `🏆 Achievement Unlocked!`,
        description: `<@${userId}> earned: *${details.achievementName}*`
      }
    };

    const msg = messages[milestone];

    await web.chat.postMessage({
      channel: process.env.SLACK_COMMUNITY_CHANNEL || 'general',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${msg.title}\n${msg.description}`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error sending milestone notification:', error);
  }
};

/**
 * Post leaderboard to Slack
 */
export const postLeaderboard = async (leaderboard: any[], channelId?: string) => {
  try {
    const web = new WebClient(process.env.SLACK_BOT_TOKEN);

    const rows = leaderboard.map((entry, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
      return `${medal} #${idx + 1} <@${entry.userId}> - ${entry.hours} hours`;
    }).join('\n');

    await web.chat.postMessage({
      channel: channelId || process.env.SLACK_COMMUNITY_CHANNEL || 'general',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏅 Summer Builder Leaderboard'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: rows
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error posting leaderboard:', error);
  }
};

export default app;
