import type { PersonalizedRoadmap } from '../types';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string[];
  resources: Array<{ title: string; url: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  startDate: Date;
  endDate: Date;
  participants: number;
  prizePool: number;
  badges: string[];
  isActive: boolean;
}

export interface ChallengeSubmission {
  id: string;
  userId: string;
  userName: string;
  challengeId: string;
  projectId: string;
  projectTitle: string;
  submittedAt: Date;
  score: number;
  verified: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  projectTitle: string;
  score: number;
  submittedAt: Date;
  badges: string[];
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: Date;
}

// Default challenges
const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'beginner-bootcamp',
    title: "Beginner's Bootcamp",
    description: 'Start your journey with fundamental web development projects. Perfect for beginners!',
    rules: [
      'Project must include HTML, CSS, and JavaScript',
      'Must be a working web application',
      'Project must be completed within 2 weeks',
      'Code should be well-commented'
    ],
    resources: [
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
      { title: 'CSS Tricks', url: 'https://css-tricks.com' },
      { title: 'JavaScript.info', url: 'https://javascript.info' }
    ],
    difficulty: 'beginner',
    startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    participants: 342,
    prizePool: 500,
    badges: ['Bootcamp Graduate', 'Web Developer'],
    isActive: true
  },
  {
    id: '30-day-builder',
    title: '30-Day Builder Challenge',
    description: 'Build something new every day for 30 days. Track your progress and build your portfolio!',
    rules: [
      'Submit one project per day',
      'Projects can be small or large',
      'Must be completed in 30 consecutive days',
      'Daily reflection on what you learned'
    ],
    resources: [
      { title: 'Github - Free APIs', url: 'https://github.com/public-apis/public-apis' },
      { title: 'Design Resources', url: 'https://dribbble.com' },
      { title: 'Challenge Ideas', url: 'https://www.frontendmentor.io' }
    ],
    difficulty: 'intermediate',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
    participants: 1250,
    prizePool: 2000,
    badges: ['30-Day Warrior', 'Consistency Champion'],
    isActive: true
  },
  {
    id: 'budget-hacker',
    title: 'Budget Hacker',
    description: 'Build innovative projects using free tools and open-source libraries. Maximum creativity, minimum cost!',
    rules: [
      'All tools and libraries must be free or open-source',
      'Budget cannot exceed $0',
      'Must solve a real problem',
      'Code must be open-sourced on GitHub'
    ],
    resources: [
      { title: 'Open Source Directory', url: 'https://opensource.org' },
      { title: 'Free APIs', url: 'https://rapidapi.com/collection/list-of-free-apis' },
      { title: 'Dev Tools', url: 'https://github.com/free-for-dev/free-for-dev' }
    ],
    difficulty: 'advanced',
    startDate: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
    participants: 568,
    prizePool: 1500,
    badges: ['Budget Master', 'Open Source Contributor'],
    isActive: true
  },
  {
    id: 'ai-innovator',
    title: 'AI Innovator Challenge',
    description: 'Build projects that leverage AI/ML technologies. Push the boundaries of what\'s possible!',
    rules: [
      'Must incorporate AI or Machine Learning',
      'Must be a functional prototype or MVP',
      'Creativity and innovation are key',
      'Must document your AI/ML approach'
    ],
    resources: [
      { title: 'TensorFlow.js', url: 'https://js.tensorflow.org' },
      { title: 'OpenAI API', url: 'https://openai.com' },
      { title: 'Hugging Face', url: 'https://huggingface.co' }
    ],
    difficulty: 'advanced',
    startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() + 27 * 24 * 60 * 60 * 1000),
    participants: 897,
    prizePool: 3000,
    badges: ['AI Pioneer', 'Innovation Leader'],
    isActive: true
  }
];

// Get all active challenges
export function getChallenges(): Challenge[] {
  const stored = localStorage.getItem('challenges');
  if (!stored) {
    // Initialize with defaults
    localStorage.setItem('challenges', JSON.stringify(DEFAULT_CHALLENGES));
    return DEFAULT_CHALLENGES;
  }

  try {
    return JSON.parse(stored).map((c: any) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate)
    }));
  } catch {
    return DEFAULT_CHALLENGES;
  }
}

// Get a specific challenge
export function getChallenge(challengeId: string): Challenge | null {
  const challenges = getChallenges();
  return challenges.find(c => c.id === challengeId) || null;
}

// Submit a project to a challenge
export function submitChallenge(
  userId: string,
  userName: string,
  challengeId: string,
  projectId: string,
  projectTitle: string
): ChallengeSubmission | null {
  const challenge = getChallenge(challengeId);
  if (!challenge) return null;

  const submission: ChallengeSubmission = {
    id: generateId(),
    userId,
    userName,
    challengeId,
    projectId,
    projectTitle,
    submittedAt: new Date(),
    score: Math.floor(Math.random() * 100),
    verified: false
  };

  const submissions = getAllSubmissions();
  submissions.push(submission);
  localStorage.setItem('challenge-submissions', JSON.stringify(submissions));

  // Update participant count
  const challenges = getChallenges();
  const challengeIndex = challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex > -1) {
    challenges[challengeIndex].participants += 1;
    localStorage.setItem('challenges', JSON.stringify(challenges));
  }

  return submission;
}

// Get leaderboard for a challenge
export function getLeaderboard(
  challengeId: string,
  limit: number = 50
): LeaderboardEntry[] {
  const submissions = getAllSubmissions();
  const challengeSubmissions = submissions
    .filter(s => s.challengeId === challengeId && s.verified)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return challengeSubmissions.map((submission, index) => ({
    rank: index + 1,
    userId: submission.userId,
    userName: submission.userName,
    projectTitle: submission.projectTitle,
    score: submission.score,
    submittedAt: new Date(submission.submittedAt),
    badges: getUserBadgesForChallenge(submission.userId, challengeId)
  }));
}

// Claim a badge
export function claimBadge(
  userId: string,
  badgeId: string,
  badgeName: string,
  badgeDescription: string,
  badgeIcon: string = '🏆'
): UserBadge {
  const badge: UserBadge = {
    id: generateId(),
    userId,
    badgeId,
    name: badgeName,
    description: badgeDescription,
    icon: badgeIcon,
    awardedAt: new Date()
  };

  const badges = getUserBadges(userId);
  // Check if already claimed
  if (!badges.some(b => b.badgeId === badgeId)) {
    badges.push(badge);
    const allBadges = JSON.parse(localStorage.getItem('user-badges-full') || '{}');
    if (!allBadges[userId]) {
      allBadges[userId] = [];
    }
    allBadges[userId].push(badge);
    localStorage.setItem('user-badges-full', JSON.stringify(allBadges));
  }

  return badge;
}

// Get user's badges for a challenge
export function getUserBadgesForChallenge(userId: string, challengeId: string): string[] {
  const badges = getUserBadges(userId);
  // In a real app, this would filter badges related to the challenge
  return badges.slice(0, 2).map(b => b.icon);
}

// Get user's all badges
export function getUserBadges(userId: string): UserBadge[] {
  const allBadges = JSON.parse(localStorage.getItem('user-badges-full') || '{}');
  if (!allBadges[userId]) return [];

  return allBadges[userId].map((b: any) => ({
    ...b,
    awardedAt: new Date(b.awardedAt)
  }));
}

// Get challenge statistics
export function getChallengeStats(challengeId: string) {
  const submissions = getAllSubmissions();
  const challengeSubmissions = submissions.filter(s => s.challengeId === challengeId);

  return {
    totalSubmissions: challengeSubmissions.length,
    verified: challengeSubmissions.filter(s => s.verified).length,
    avgScore: challengeSubmissions.length > 0
      ? challengeSubmissions.reduce((sum, s) => sum + s.score, 0) / challengeSubmissions.length
      : 0,
    topScore: Math.max(...challengeSubmissions.map(s => s.score), 0)
  };
}

// Helper functions
function getAllSubmissions(): ChallengeSubmission[] {
  const stored = localStorage.getItem('challenge-submissions');
  if (!stored) return [];

  try {
    return JSON.parse(stored).map((s: any) => ({
      ...s,
      submittedAt: new Date(s.submittedAt)
    }));
  } catch {
    return [];
  }
}

function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Verify a submission (admin only)
export function verifySubmission(submissionId: string): boolean {
  const submissions = getAllSubmissions();
  const submission = submissions.find(s => s.id === submissionId);

  if (submission) {
    submission.verified = true;
    localStorage.setItem('challenge-submissions', JSON.stringify(submissions));
    return true;
  }

  return false;
}

// Get user's challenge submissions
export function getUserChallengeSubmissions(userId: string): ChallengeSubmission[] {
  const submissions = getAllSubmissions();
  return submissions.filter(s => s.userId === userId);
}

// Check if user has already submitted to a challenge
export function hasSubmittedToChallenge(userId: string, challengeId: string): boolean {
  const submissions = getUserChallengeSubmissions(userId);
  return submissions.some(s => s.challengeId === challengeId);
}
