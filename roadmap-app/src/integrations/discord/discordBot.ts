import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js';

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

// Mock data stores
const userProgress: Map<string, any> = new Map();
const guildConfig: Map<string, any> = new Map();

/**
 * Bot ready event
 */
client.on('ready', async () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`);

  // Register slash commands
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('progress')
        .setDescription('Check your learning progress')
        .addStringOption(option =>
          option
            .setName('roadmap')
            .setDescription('Optional: Specific roadmap to check')
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Get AI-powered learning recommendations'),
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View community leaderboard')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of top learners to show (default: 10)')
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName('badges')
        .setDescription('Show your achievements and badges'),
      new SlashCommandBuilder()
        .setName('challenge')
        .setDescription('See active learning challenges'),
      new SlashCommandBuilder()
        .setName('logprogress')
        .setDescription('Log your learning session')
        .addNumberOption(option =>
          option
            .setName('hours')
            .setDescription('Hours studied')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('topic')
            .setDescription('Topic or module')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('notes')
            .setDescription('Optional notes')
            .setRequired(false)
        )
    ];

    await client.application?.commands.set(commands);
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

/**
 * Handle slash commands
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'progress':
        await handleProgressCommand(interaction);
        break;
      case 'recommend':
        await handleRecommendCommand(interaction);
        break;
      case 'leaderboard':
        await handleLeaderboardCommand(interaction);
        break;
      case 'badges':
        await handleBadgesCommand(interaction);
        break;
      case 'challenge':
        await handleChallengeCommand(interaction);
        break;
      case 'logprogress':
        await handleLogProgressCommand(interaction);
        break;
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your command.',
      ephemeral: true
    });
  }
});

/**
 * Command: /progress
 */
async function handleProgressCommand(interaction: any) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const userStats = userProgress.get(userId) || {
    totalHours: 0,
    completedModules: 0,
    currentStreak: 0,
    level: 1
  };

  const embed = new EmbedBuilder()
    .setColor('#2E75B6')
    .setTitle('📊 Your Learning Progress')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: '⏱️ Total Hours', value: `${userStats.totalHours} hours`, inline: true },
      { name: '✅ Modules Completed', value: `${userStats.completedModules}`, inline: true },
      { name: '🔥 Current Streak', value: `${userStats.currentStreak} days`, inline: true },
      { name: '📈 Level', value: `Level ${userStats.level}`, inline: true }
    )
    .setFooter({ text: 'Keep up the great work! 💪' })
    .setTimestamp();

  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('log_progress')
        .setLabel('📝 Log Hours')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('📱 Open Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(`${process.env.APP_URL || 'http://localhost:5173'}/dashboard`)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

/**
 * Command: /recommend
 */
async function handleRecommendCommand(interaction: any) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const userStats = userProgress.get(userId) || { totalHours: 0, completedModules: [] };

  // Mock AI recommendations
  const recommendations = [
    {
      title: 'Master Data Structures',
      description: 'Build foundation with arrays, linked lists, and trees',
      difficulty: 'Intermediate',
      estimatedHours: 15,
      relevance: '95%'
    },
    {
      title: 'System Design Fundamentals',
      description: 'Learn scalability, load balancing, and distributed systems',
      difficulty: 'Advanced',
      estimatedHours: 20,
      relevance: '87%'
    },
    {
      title: 'LeetCode Hard Problems',
      description: 'Challenge yourself with advanced algorithms',
      difficulty: 'Advanced',
      estimatedHours: 25,
      relevance: '82%'
    }
  ];

  const embeds = recommendations.map((rec, idx) =>
    new EmbedBuilder()
      .setColor('#28A745')
      .setTitle(`${idx + 1}. ${rec.title}`)
      .setDescription(rec.description)
      .addFields(
        { name: 'Difficulty', value: rec.difficulty, inline: true },
        { name: 'Estimated Hours', value: rec.estimatedHours.toString(), inline: true },
        { name: 'Your Match', value: rec.relevance, inline: true }
      )
  );

  await interaction.editReply({ embeds });
}

/**
 * Command: /leaderboard
 */
async function handleLeaderboardCommand(interaction: any) {
  await interaction.deferReply();

  const limit = interaction.options.getInteger('limit') || 10;

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'CodeMaster', hours: 120, streak: 15 },
    { rank: 2, name: 'AlgoFanatic', hours: 108, streak: 12 },
    { rank: 3, name: 'SysDesignPro', hours: 95, streak: 10 },
    { rank: 4, name: 'DataStructureGod', hours: 87, streak: 8 },
    { rank: 5, name: 'LeetcodeHero', hours: 76, streak: 7 }
  ].slice(0, limit);

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏅 Summer Builder Leaderboard')
    .setDescription(
      leaderboard
        .map(entry => {
          const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '📌';
          return `${medal} #${entry.rank} **${entry.name}** - ${entry.hours}h | 🔥 ${entry.streak}d`;
        })
        .join('\n')
    )
    .setFooter({ text: 'Keep learning and climb the leaderboard!' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Command: /badges
 */
async function handleBadgesCommand(interaction: any) {
  await interaction.deferReply();

  const userId = interaction.user.id;

  // Mock badges
  const badges = [
    { name: '🌟 First Steps', description: 'Logged your first hour' },
    { name: '⭐ 10 Hour Club', description: 'Logged 10+ hours' },
    { name: '🚀 Rocket Start', description: 'Completed first module' },
    { name: '🔥 On Fire', description: '7-day learning streak' }
  ];

  const embed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('🏆 Your Achievements')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(
      badges
        .map((badge, idx) => `${badge.name}\n_${badge.description}_`)
        .join('\n\n')
    )
    .setFooter({ text: `${badges.length} total achievements unlocked` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Command: /challenge
 */
async function handleChallengeCommand(interaction: any) {
  await interaction.deferReply();

  // Mock active challenges
  const challenges = [
    {
      name: '🎯 30 Days of Coding',
      description: 'Code every single day for 30 days',
      reward: '500 points',
      participants: 234,
      daysRemaining: 12
    },
    {
      name: '📚 Algorithm Mastery',
      description: 'Solve 50 medium/hard problems',
      reward: '750 points',
      participants: 156,
      daysRemaining: 7
    }
  ];

  const embeds = challenges.map(challenge =>
    new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(challenge.name)
      .setDescription(challenge.description)
      .addFields(
        { name: '🎁 Reward', value: challenge.reward, inline: true },
        { name: '👥 Participants', value: challenge.participants.toString(), inline: true },
        { name: '⏱️ Days Left', value: challenge.daysRemaining.toString(), inline: true }
      )
  );

  await interaction.editReply({ embeds });
}

/**
 * Command: /logprogress
 */
async function handleLogProgressCommand(interaction: any) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const hours = interaction.options.getNumber('hours');
  const topic = interaction.options.getString('topic');
  const notes = interaction.options.getString('notes') || 'No notes';

  // Update progress
  const existing = userProgress.get(userId) || { totalHours: 0, sessions: [] };
  existing.totalHours += hours;
  existing.sessions = (existing.sessions || []).concat({
    topic,
    hours,
    notes,
    date: new Date().toISOString()
  });
  userProgress.set(userId, existing);

  const embed = new EmbedBuilder()
    .setColor('#28A745')
    .setTitle('✅ Progress Logged!')
    .addFields(
      { name: '📝 Topic', value: topic },
      { name: '⏱️ Hours', value: `${hours} hours`, inline: true },
      { name: '📊 Total', value: `${existing.totalHours} hours`, inline: true },
      { name: '📋 Notes', value: notes }
    )
    .setFooter({ text: 'Great job! Keep it up! 💪' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Send notification to Discord when milestone is reached
 */
export const notifyMilestoneDiscord = async (
  guildId: string,
  userId: string,
  milestone: 'first-module' | 'ten-hours' | 'achievement',
  details: any
) => {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const config = guildConfig.get(guildId) || { notificationChannel: 'general' };
    const channel = guild.channels.cache.find(
      ch => ch.name === config.notificationChannel && ch.type === ChannelType.GuildText
    );

    if (!channel || !channel.isTextBased()) return;

    const messages: any = {
      'first-module': {
        title: '🎯 First Module Complete!',
        description: `<@${userId}> just completed their first module: **${details.moduleName}**`,
        color: '#2E75B6'
      },
      'ten-hours': {
        title: '⭐ 10 Hour Club!',
        description: `<@${userId}> just logged their 10th hour of learning!`,
        color: '#FFD700'
      },
      'achievement': {
        title: `🏆 Achievement Unlocked!`,
        description: `<@${userId}> earned: **${details.achievementName}**`,
        color: '#9B59B6'
      }
    };

    const msg = messages[milestone];
    const embed = new EmbedBuilder()
      .setColor(msg.color)
      .setTitle(msg.title)
      .setDescription(msg.description)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

/**
 * Post leaderboard to Discord
 */
export const postLeaderboardDiscord = async (
  guildId: string,
  leaderboard: any[],
  channelName: string = 'general'
) => {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.find(
      ch => ch.name === channelName && ch.type === ChannelType.GuildText
    );

    if (!channel || !channel.isTextBased()) return;

    const rows = leaderboard
      .map((entry, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📌';
        return `${medal} #${idx + 1} ${entry.name} - ${entry.hours}h`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏅 Summer Builder Leaderboard')
      .setDescription(rows)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error posting Discord leaderboard:', error);
  }
};

/**
 * Set notification channel for a guild
 */
export const setDiscordNotificationChannel = (guildId: string, channelName: string) => {
  guildConfig.set(guildId, { notificationChannel: channelName });
};

/**
 * Connect to Discord
 */
export const connectDiscord = async () => {
  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('Discord bot connected');
  } catch (error) {
    console.error('Error connecting to Discord:', error);
    throw error;
  }
};

export default client;
